const { Sequelize } = require('sequelize');
require('dotenv').config(); // 确保 .env 被加载

let sequelize;

// 检查是否在 Render/Supabase 等生产环境
if (process.env.DATABASE_URL) {
  // 生产环境：使用 Supabase 提供的连接字符串
  console.log("Connecting to production database via DATABASE_URL...");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Supabase 需要这个设置
      }
    },
    
    // (!!! 这是解决 ENETUNREACH 错误的关键 !!!)
    family: 4 // 强制 Sequelize/pg 使用 IPv4
    
  });
} else {
  // 本地开发环境：使用 .env 文件
  console.log("Connecting to local development database...");
  sequelize = new Sequelize(
    process.env.DB_NAME || 'dachuangDB',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '你的本地密码',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres'
      // (本地通常不需要 family: 4, 但加上也无妨)
      // family: 4
    }
  );
}

module.exports = sequelize;