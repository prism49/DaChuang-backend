const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 引入 Sequelize User 模型
require('dotenv').config(); // 确保能读取 .env 里的 JWT_SECRET

const JWT_SECRET = process.env.JWT_SECRET; // 从 .env 文件读取密钥

// --- 注册 API ---
// 路径: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 检查输入是否为空
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 2. 检查用户是否已存在 (Sequelize 语法)
    const existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 3. 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. 创建新用户 (Sequelize 语法)
    const newUser = await User.create({
      username: username,
      password: hashedPassword,
      points: 0 // 明确设置默认值
    });

    res.status(201).json({ message: '注册成功' });

  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// --- 登录 API ---
// 路径: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 查找用户 (Sequelize 语法)
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 2. 比较密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 3. 登录成功，生成 JWT (令牌)
    const payload = {
      user: {
        id: user.id, // 使用 Sequelize 自动生成的 id
        username: user.username
      }
    };
    console.log("[auth.js /login] Secret used for SIGNING:", process.env.JWT_SECRET);
    // 签名生成 token
    const token = jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: '1h' } // 令牌 1 小时后过期
    ); 

    res.json({
      message: '登录成功',
      token, // 把 token 发给前端
      user: { // 把用户信息（不含密码）发给前端
        id: user.id,
        username: user.username, 
        points: user.points ,
        lastCheckIn: user.lastCheckIn
      }
    });

  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;

