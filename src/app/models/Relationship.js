const { DataTypes } = require('sequelize');
const db = require('../config/database');

const User = require('./User');

const Relationship = db.sequelize.define('relationship', {
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  followedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  }
});

User.belongsToMany(User, {
  through: Relationship,
  foreignKey: 'followerId',
  otherKey: 'followedId',
  as: 'following',
});

User.belongsToMany(User, {
  through: Relationship,
  foreignKey: 'followedId',
  otherKey: 'followerId',
  as: 'followers',
});

module.exports = Relationship;
