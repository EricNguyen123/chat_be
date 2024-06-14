const { User, MediaItem, Message, Room, Remember, Relationship, React } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/database');


const messagesNoti = async (io, socket, data, roomSockets) => {
  try {
    let { roomId, userId, message } = data;
    const parsedRoomId = parseInt(roomId, 10);
    message = JSON.parse(message)
    if (roomSockets.has(parsedRoomId)) {
      await Remember.update(
        { isDelete: 0 },
        {
          where: {
            roomId: roomId 
          }
        }
      );
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
      });
      if (user && user.avatar) {
        message = {...message, User: user};
        const avatarMedia = await MediaItem.findOne({
          where: { id: user.avatar },
          attributes: ['id', 'mediaType', 'mediaUrl']
        });
        message = {...message, avatarMedia: avatarMedia};
      }
      message = {...message, isFollowing: false};

      const mediaItems = await MediaItem.findAll({
        where: { messageId: message.id },
        attributes: ['id', 'mediaType', 'mediaUrl']
      });
      message = {...message, MediaItems: mediaItems};
      message = JSON.stringify(message)
      io.sockets.in(socket.roomId).emit('newMessage', { userId, roomId: parsedRoomId, message });

    } else {
      console.error(`Phòng ${roomId} không tồn tại.`);
    }
  } catch (error) {
    const { userId } = data;
    console.error(`Lỗi khi gửi thông báo cho người dùng ${userId}:`, error);
  }
};

const messagesDelete = async (io, socket, data, roomSockets) => {
  try {
    let { roomId, id } = data;
    const msgId = parseInt(id, 10);
    const parsedRoomId = parseInt(roomId, 10);
    if (roomSockets.has(parsedRoomId)) {
      io.sockets.in(socket.roomId).emit('deleteMessage', { roomId: parsedRoomId, id: msgId });
    } else {
      console.error(`Phòng ${roomId} không tồn tại.`);
    }
  } catch (error) {
    const { userId } = data;
    console.error(`Lỗi khi gửi thông báo cho người dùng ${userId}:`, error);
  }
};

const roomJoin = async (socket, data, roomSockets) => {
  try {
    const { roomId } = data;
    console.log(`Attempting to join room ${roomId}`);

    const roomExists = await Room.findByPk(roomId);
    if (!roomExists) {
      console.error(`Room ${roomId} does not exist.`);
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;

    if (!roomSockets.has(roomId)) {
      roomSockets.set(roomId, new Set());
    }
    roomSockets.get(roomId).add(socket.id);

    console.log(`Socket ${socket.id} joined room ${roomId}`);
  } catch (error) {
    const { roomId } = data;
    console.error(`Error joining room ${roomId} for socket ${socket.id}:`, error);
  }
};

const getRoomInfoWithLastMessages = async (userId) => {
  try {
    const remembers = await Remember.findAll({
      where: { 
        userId: userId,
        isDelete: {
          [Op.or]: [null, { [Op.ne]: 1 }]
        }
      },
      include: [{
        model: Room,
        include: [{
          model: Remember,
          include: [{
            model: User,
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] }
          }],
        }],
      }],
    });

    const rooms = await Promise.all(remembers.map(async (remember) => {
      const room = remember.Room.get({ plain: true });
      
      let roomAvatar = null;
      if (room.groups === 0) {
        const otherUser = room.Remembers.find(member => member.userId !== userId)?.User;
        if (otherUser) {
          roomAvatar = await MediaItem.findByPk(otherUser.avatar);
          room.title = otherUser.name;
        }
      } else {
        roomAvatar = await MediaItem.findOne({
          where: { roomId: room.id }
        });
      }

      const users = await Promise.all(room.Remembers.map(async (member) => {
        if (!member.User) {
          return null;
        }

        const user = member.User
        const relationship = await Relationship.findOne({
          where: {
            followerId: userId,
            followedId: user.id,
          },
        });
        const isFollowing = !!relationship;
        const mediaAvatar = user.avatar ? await MediaItem.findByPk(user.avatar) : null;
        return { 
          ...user, 
          isFollowing, 
          imagAvatar: mediaAvatar ? mediaAvatar.mediaUrl : null 
        };
      }));

      return { 
        ...room, 
        roomInfor: {
          imagAvatar: roomAvatar ? roomAvatar.mediaUrl : null, 
          name: room.title
        }, 
        users: users.filter(Boolean) 
      };
    }));

    const lastMessages = await getLastMessages(userId);

    const roomsWithLastMessages = rooms.map(room => {
      const lastMessage = lastMessages.find(msg => msg.roomId === room.id);
      return {
        ...room,
        lastMessage: lastMessage ? [lastMessage] : []
      };
    });

    return roomsWithLastMessages;
  } catch (error) {
    console.error('Error fetching room info with last messages:', error);
    throw error;
  }
};

const getLastMessages = async (userId) => {
  try {
    const userRooms = await Remember.findAll({
      where: {
        userId: userId,
      },
      attributes: ['roomId']
    });

    const roomIds = userRooms.map(userRoom => userRoom.roomId);

    // Get the last message time for each room
    const messages = await Message.findAll({
      where: {
        roomId: {
          [Op.in]: roomIds,
        },
      },
      attributes: [
        'roomId',
        [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastMessageTime']
      ],
      group: ['roomId']
    });

    const lastMessageTimes = messages.map(m => ({
      roomId: m.roomId,
      lastMessageTime: m.get('lastMessageTime')
    }));

    // Fetch the last messages based on lastMessageTimes
    const lastMessages = await Promise.all(
      lastMessageTimes.map(async ({ roomId, lastMessageTime }) => {
        return await Message.findOne({
          where: {
            roomId: roomId,
            createdAt: lastMessageTime
          },
          include: [
            {
              model: MediaItem,
              attributes: ['id', 'mediaType', 'mediaUrl']
            },
            {
              model: React,
              attributes: ['id', 'action', 'userId']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
      })
    );

    return lastMessages;
  } catch (error) {
    console.error('Error fetching last messages:', error);
    throw error;
  }
};

const allLastMessages = async (io, socket, data, roomSockets) => {
  try {
    const { userId } = data;
    
    if (userId) {
      const lastMessages = await getRoomInfoWithLastMessages(userId);

      const dataResult = JSON.stringify(lastMessages);
      socket.emit('latsMessages', dataResult)
    }
  } catch (error) {

  }
}

const getMessage = async (io, socket, data, roomSockets) => {
  try {
    const { userId, messageId } = data;

    const message = await Message.findOne({
      where: {
        id: messageId,
      },
      include: [
        {
          model: MediaItem,
          attributes: ['id', 'mediaType', 'mediaUrl']
        },
        {
          model: React,
          attributes: ['id', 'action', 'userId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
    });
    if (user && user.avatar) {
      message.dataValues.User = user;
      const avatarMedia = await MediaItem.findOne({
        where: { id: user.avatar },
        attributes: ['id', 'mediaType', 'mediaUrl']
      });
      message.dataValues.avatarMedia = avatarMedia;
    }
    io.sockets.in(socket.roomId).emit('changedMessage', { userId, message });
  } catch (error) {
    console.error('Error fetching last messages:', error);
    throw error;
  }
};

module.exports = {
  messagesNoti,
  roomJoin,
  messagesDelete,
  allLastMessages,
  getMessage,
};
