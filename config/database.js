const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// 检查是否在 Render/Supabase 等生产环境
if (process.env.DATABASE_URL) {
  // 生产环境：使用 Supabase 提供的连接字符串
  console.log("Connecting to production database via DATABASE_URL...");

  // (!!! 这是关键修改：手动解析 URL !!!)
  const dbUrl = new URL(process.env.DATABASE_URL);

  sequelize = new Sequelize(
    dbUrl.pathname.slice(1), // 数据库名 (e.g., 'postgres')
    dbUrl.username,          // 用户名 (e.g., 'postgres')
    dbUrl.password,          // 密码
    {
      host: dbUrl.hostname,  // 主机名 (e.g., 'db.xxxx.supabase.co')
      port: dbUrl.port,      // 端口 (e.g., 5432)
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Supabase 需要这个设置
        }
      },
      family: 4
    }
  );
  
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
      // family: 4 // 本地通常不需要
    }
  );
}

module.exports = sequelize;