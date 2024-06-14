const { User, Relationship } = require('../models');

const registerUser = async (socket, userId, io, userSockets) => {
  userSockets.set(userId, socket.id);
  console.log(`User ${userId} registered with socket id ${socket.id}`);

  try {
    const users = await Relationship.findAll({
      where: {
        followedId: userId,
      },
      attributes: ['followerId']
    });

    if(users) {
      users.forEach(friend => {
        
        const friendSocketId = userSockets.get(friend.followerId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friendOnline', { userId });
          socket.emit('friendOnline', { userId: friend.followerId })
        }
      });
    }
  } catch (error) {
    console.error(`Error fetching followers for user ${userId}:`, error);
  }
};

const handleDisconnect = async (socket, io, userSockets) => {
  console.log('Client disconnected');
  let userId = null;

  userSockets.forEach((value, key) => {
    if (value === socket.id) {
      userId = key;
      userSockets.delete(key);
    }
  });

  if (userId) {
    try {
      const user = await User.findByPk(userId, {
        include: {
          model: User,
          as: 'followers',
          attributes: ['id'],
        },
      });

      user.followers.forEach(friend => {
        const friendSocketId = userSockets.get(friend.id);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friendOffline', { userId });
        }
      });
    } catch (error) {
      console.error(`Error fetching followers for user ${userId}:`, error);
    }
  }
};

module.exports = {
  registerUser,
  handleDisconnect,
};
