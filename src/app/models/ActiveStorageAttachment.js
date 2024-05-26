const { DataTypes } = require('sequelize');
const db = require('../config/database');

const ActiveStorageAttachment = db.sequelize.define('ActiveStorageAttachment', {
  name: {
    type: DataTypes.STRING
  },
  recordType: {
    type: DataTypes.STRING
  },
  mediaItemId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'media_items',
      key: 'id'
    }
  },
  blobId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'active_storage_blobs',
      key: 'id'
    }
  }
}, {
  tableName: 'active_storage_attachments'
});

module.exports = ActiveStorageAttachment;
