const { Remember } = require('../models');
const { Op } = require('sequelize');
const db = require('../config/database');

const deleteRoomHandlers = async (io, socket, data, roomSockets) => {
  try {
    const { userId, roomId } = data;
    const remmember = await Remember.findOne({
      where: {
        userId: userId,
        roomId: roomId,
      }
    })

    if (remmember) {
      await remmember.update({
        isDelete: 1,
        deleteAt: new Date(),
      })

      socket.emit('deleteRoom', { roomId: roomId })
    }

  } catch (error) {
    
  }
}

module.exports = {
  deleteRoomHandlers,
}
