const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Room = db.sequelize.define('Room', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  groups: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  tableName: 'rooms'
});

module.exports = Room;

