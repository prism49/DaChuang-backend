// 文件路径: DaChuang-backend/models/CheckInLog.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // 需要关联 User

const CheckInLog = sequelize.define('CheckInLog', {
  // id (主键) 会被 Sequelize 自动创建

  check_in_date: {
    type: DataTypes.DATEONLY, // 只存储日期 'YYYY-MM-DD'
    allowNull: false
  },

  points_earned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // 每次签到固定得 1 分
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // 关联到 User 模型
      key: 'id'
    }
  }

  // createdAt 和 updatedAt 会被自动添加 (记录签到的具体时间)
}, {
    // 添加复合唯一索引，确保一个用户一天只能签到一次
    indexes: [
        {
            unique: true,
            fields: ['userId', 'check_in_date']
        }
    ]
});

// 设置模型关联：一个 User 可以有多个 CheckInLog
User.hasMany(CheckInLog, { foreignKey: 'userId' });
CheckInLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = CheckInLog;