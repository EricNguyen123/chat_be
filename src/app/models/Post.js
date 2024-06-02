const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Post = db.sequelize.define('Post', {
  body: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'posts',
      key: 'id'
    }
  }
}, {
  tableName: 'posts'
});

Post.hasMany(Post, { as: 'children', foreignKey: 'parentId' });
Post.belongsTo(Post, { as: 'parent', foreignKey: 'parentId' });

module.exports = Post;

