const { Sequelize } = require('sequelize');
require('dotenv').config(); // 加载 .env 文件中的环境变量

const sequelize = new Sequelize(
  process.env.DB_NAME,  // 数据库名 (dachuangDB)
  process.env.DB_USER,  // 用户名 (root)
  process.env.DB_PASS,  // 你的密码
  {
    host: process.env.DB_HOST, // 主机 (localhost)
    dialect: 'postgres'           // 告诉 Sequelize 我们用的是 MySQL
  }
);

module.exports = sequelize;