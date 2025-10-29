// 文件路径: DaChuang-backend/models/Question.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  // id (主键) 会被 Sequelize 自动创建
  
  question_text: {
    type: DataTypes.TEXT, // 使用 TEXT 类型以容纳较长的问题
    allowNull: false
  },
  
  options: {
    type: DataTypes.TEXT,
    allowNull: false,
    // 我们将把选项数组 ["A", "B", "C", "D"] 
    // 转换为 JSON 字符串 '["A", "B", "C", "D"]' 再存入
    get() {
      const rawValue = this.getDataValue('options');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },

  correct_answer: {
    type: DataTypes.INTEGER, // 存储正确选项的索引 (0, 1, 2, 3)
    allowNull: false
  },

  analysis: {
    type: DataTypes.TEXT, // 答案解析
    allowNull: true
  }
  
  // createdAt 和 updatedAt 会被自动添加
});

module.exports = Question;