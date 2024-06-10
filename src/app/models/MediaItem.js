const { DataTypes } = require('sequelize');
const db = require('../config/database');

const MediaItem = db.sequelize.define('MediaItem', {
  resourceId: {
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
  },
  roomId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'rooms',
      key: 'id'
    }
  },
  messageId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  resourceType: {
    type: DataTypes.STRING(255)
  },
  mediaType: {
    type: DataTypes.TINYINT
  },
  mediaUrl: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'media_items'
});

module.exports = MediaItem;
