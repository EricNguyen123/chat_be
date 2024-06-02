let io;
const userSockets = new Map();

const init = (socketIo) => {
  io = socketIo;
  io.on('connection', (socket) => {
    console.log('A new client connected');

    socket.on('register', (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket id ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      userSockets.forEach((value, key) => {
        if (value === socket.id) {
          userSockets.delete(key);
        }
      });
    });
  });
};

const notifyPostCreated = async (post, db) => {
  const followers = await db.query(
    'SELECT follower_id FROM followers WHERE followed_id = ?',
    [post.userId]
  );

  followers.forEach(follower => {
    const followerSocketId = userSockets.get(follower.follower_id);
    if (followerSocketId) {
      io.to(followerSocketId).emit('postCreated', { message: 'Post created successfully', post });
    }
  });
};

module.exports = {
  init,
  notifyPostCreated
};
