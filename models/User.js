// 文件路径: DaChuang-backend/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // ... (id, username, password, points 保持不变) ...
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // (!!! 这是唯一的修改 !!!)
  lastCheckIn: {
    type: DataTypes.DATEONLY, // 从 DATETIME 改为 DATEONLY
    allowNull: true
  }
});

module.exports = User;