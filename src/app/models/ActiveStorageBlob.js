const { DataTypes } = require('sequelize');
const db = require('../config/database');

const ActiveStorageBlob = db.sequelize.define('ActiveStorageBlob', {
  key: {
    type: DataTypes.STRING
  },
  filename: {
    type: DataTypes.STRING
  },
  contentType: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.TEXT
  },
  byteSize: {
    type: DataTypes.BIGINT
  },
  checksum: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'active_storage_blobs'
});

module.exports = ActiveStorageBlob