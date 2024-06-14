const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Remember = db.sequelize.define('Remember', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'rooms',
      key: 'id'
    }
  },
  isDelete: {
    type: DataTypes.INTEGER
  },
  deleteAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'remembers'
});

module.exports = Remember;

