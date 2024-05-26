const User = require('./User');
const Relationship = require('./Relationship');
const ActiveStorageBlob = require('./ActiveStorageBlob');
const MediaItem = require('./MediaItem');
const ActiveStorageAttachment = require('./ActiveStorageAttachment');

MediaItem.associate = function(models) {
  this.hasMany(models.ActiveStorageAttachment, { foreignKey: 'mediaItemId' });
};

ActiveStorageBlob.associate = function(models) {
  this.hasMany(models.ActiveStorageAttachment, { foreignKey: 'blobId' });
};

ActiveStorageAttachment.associate = function(models) {
  this.belongsTo(models.MediaItem, { foreignKey: 'mediaItemId' });
  this.belongsTo(models.ActiveStorageBlob, { foreignKey: 'blobId' });
};

User.associate = function(models) {
  this.hasMany(models.MediaItem, { foreignKey: 'resourceId' });
};


MediaItem.associate = function(models) {
  this.belongsTo(models.User, { foreignKey: 'resourceId' });
};

module.exports = {
  User,
  Relationship,
  MediaItem,
  ActiveStorageBlob,
  ActiveStorageAttachment,
};
