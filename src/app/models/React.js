const { DataTypes } = require('sequelize');
const db = require('../config/database');

const React = db.sequelize.define('React', {
  action: {
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
  postId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'posts',
      key: 'id'
    }
  }
}, {
  tableName: 'reacts'
});

module.exports = React;
