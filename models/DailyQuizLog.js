// 文件路径: DaChuang-backend/models/DailyQuizLog.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Question = require('./Question');

const DailyQuizLog = sequelize.define('DailyQuizLog', {
  // id (主键) 会被 Sequelize 自动创建
  
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // 关联到 User 模型
      key: 'id'
    }
  },

  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Question, // 关联到 Question 模型
      key: 'id'
    }
  },

  date_answered: {
    type: DataTypes.DATEONLY, // 只存储日期 (YYYY-MM-DD)，忽略时间
    allowNull: false
  },

  was_correct: {
    type: DataTypes.BOOLEAN, // true 或 false
    allowNull: false
  }
  
  // createdAt 和 updatedAt 会被自动添加
});

// 设置模型间的关联关系
// 一个 User 可以有多个 DailyQuizLog
User.hasMany(DailyQuizLog, { foreignKey: 'userId' });
DailyQuizLog.belongsTo(User, { foreignKey: 'userId' });

// 一个 Question 可以出现在多个 DailyQuizLog 中
Question.hasMany(DailyQuizLog, { foreignKey: 'questionId' });
DailyQuizLog.belongsTo(Question, { foreignKey: 'questionId' });

module.exports = DailyQuizLog;