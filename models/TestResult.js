const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const TestResult = sequelize.define('TestResult', {
  // id (主键) 会被 Sequelize 自动创建
  
  h_score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  r_score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  result_type: {
    type: DataTypes.STRING, // 例如: "The Sage", "The Philosopher"
    allowNull: false
  },
  
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // 关键：确保一个用户只有一个测试结果
    references: {
      model: User,
      key: 'id'
    }
  }
  
  // createdAt 和 updatedAt 会被自动添加
});

// --- 建立一对一 (1:1) 关系 ---

// 一个 User 只有一个 TestResult
User.hasOne(TestResult, { foreignKey: 'userId' });
TestResult.belongsTo(User, { foreignKey: 'userId' });

module.exports = TestResult;