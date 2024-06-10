const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Message = db.sequelize.define('Message', {
  messages: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'rooms',
      key: 'id'
    }
  }
}, {
  tableName: 'messages'
});

module.exports = Message;

