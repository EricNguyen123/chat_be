const { User, MediaItem, Relationship, Room, Remember } = require('../models');


const messagesNoti = async (io, socket, data, roomSockets) => {
  try {
    let { roomId, userId, message } = data;
    const parsedRoomId = parseInt(roomId, 10);
    message = JSON.parse(message)
    if (roomSockets.has(parsedRoomId)) {
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
      message = JSON.stringify(message)
      io.sockets.in(socket.roomId).emit('newMessage', { userId, roomId: parsedRoomId, message });
      console.log(`Người dùng ${userId} đã gửi tin nhắn tới phòng ${roomId}: ${message}`);
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

    // Kiểm tra xem phòng có tồn tại không
    const roomExists = await Room.findByPk(roomId);
    if (!roomExists) {
      console.error(`Room ${roomId} does not exist.`);
      return;
    }

    // Thêm socket vào phòng
    socket.join(roomId);
    socket.roomId = roomId;

    // Cập nhật roomSockets
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


module.exports = {
  messagesNoti,
  roomJoin,
};
