const { DataTypes } = require('sequelize');
const db = require('../config/database');

const User = db.sequelize.define('user', {
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
  }
});

module.exports = User;
