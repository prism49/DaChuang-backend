// 文件路径: DaChuang-backend/config/database.js (最终 Postgres 版)

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
    }
  });
} else {
  // 本地开发环境：使用 .env 文件
  // (如果你也在本地装了 Postgres, 就可以用这些设置)
  console.log("Connecting to local development database...");
  sequelize = new Sequelize(
    process.env.DB_NAME || 'dachuangDB',    // 数据库名
    process.env.DB_USER || 'root',          // 用户名
    process.env.DB_PASS || '你的本地密码',  // 密码
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres' // 确保本地也是 postgres
    }
  );
}

module.exports = sequelize;