const { DataTypes } = require('sequelize');
const db = require('../config/database');

const User = db.sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }, 
  actived: {
    type: DataTypes.TINYINT
  },
  avatar: {
    type: DataTypes.INTEGER,
  }
}, {
  tableName: 'users'
});

module.exports = User;
