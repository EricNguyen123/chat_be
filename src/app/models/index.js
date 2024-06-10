const User = require('./User');
const Relationship = require('./Relationship');
const ActiveStorageBlob = require('./ActiveStorageBlob');
const MediaItem = require('./MediaItem');
const ActiveStorageAttachment = require('./ActiveStorageAttachment');
const Post = require('./Post');
const React = require('./React');
const Room = require('./Room');
const Message = require('./Message');
const Remember = require('./Remember');

MediaItem.associate = function(models) {
  this.hasMany(models.ActiveStorageAttachment, { foreignKey: 'mediaItemId' });
  this.belongsTo(models.User, { foreignKey: 'resourceId' });
  this.belongsTo(models.Post, { foreignKey: 'postId' });
  this.belongsTo(models.Message, { foreignKey: 'messageId' });
  this.belongsTo(models.Room, { foreignKey: 'roomId' });
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
  this.hasMany(models.Post, { foreignKey: 'userId' });
  this.hasMany(models.React, { foreignKey: 'userId' });
  this.hasMany(models.Message, { foreignKey: 'userId' });
  this.hasMany(models.Remember, { foreignKey: 'userId' });
};

Post.associate = function(models) {
  this.belongsTo(models.User, { foreignKey: 'userId' });
  this.hasMany(models.MediaItem, { foreignKey: 'postId' });
  this.hasMany(models.React, { foreignKey: 'postId' });
};

React.associate = function(models) {
  this.belongsTo(models.Post, { foreignKey: 'postId' });
  this.belongsTo(models.User, { foreignKey: 'userId' });
};

Room.associate = function(models) {
  this.hasMany(models.Message, { foreignKey: 'roomId' });
  this.hasMany(models.Remember, { foreignKey: 'roomId' });
  this.hasMany(models.MediaItem, { foreignKey: 'roomId' });
}

Message.associate = function(models) {
  this.belongsTo(models.User, { foreignKey: 'userId' });
  this.belongsTo(models.Room, { foreignKey: 'roomId' });
  this.hasMany(models.MediaItem, { foreignKey: 'messageId' });
}

Remember.associate = function(models) {
  this.belongsTo(models.User, { foreignKey: 'userId' });
  this.belongsTo(models.Room, { foreignKey: 'roomId' });
}

module.exports = {
  User,
  Relationship,
  Post,
  MediaItem,
  ActiveStorageBlob,
  ActiveStorageAttachment,
  React,
  Room,
  Message,
  Remember,
};
