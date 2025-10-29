// 文件路径: DaChuang-backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-jwt-32-chars';

module.exports = async (req, res, next) => {
  // 1. 从请求头 'Authorization' 中获取 token
  // 格式通常是 "Bearer eyJhbGciOiJIUzI1NiIsIn..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '认证失败：未提供Token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. 验证 token
    console.log("[authMiddleware] Secret used for VERIFYING:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. 从 token 中提取用户ID，并查找用户
    // 我们将完整的用户信息（不含密码）附加到 req 对象上
    // 这样后续的路由 (比如 checkin) 就能直接使用 req.user
    req.user = await User.findByPk(decoded.user.id, {
      attributes: { exclude: ['password'] } // 确保不泄露密码
    });

    if (!req.user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 4. 一切正常，放行，让请求继续访问下一个路由
    next();

  } catch (error) {
    res.status(401).json({ message: '认证失败：Token 无效' });
  }
};