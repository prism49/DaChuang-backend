// 文件路径: DaChuang-backend/routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyQuizLog = require('../models/DailyQuizLog');
const Question = require('../models/Question');
const CheckInLog = require('../models/CheckInLog'); // <-- 引入签到日志模型
const authMiddleware = require('../middleware/authMiddleware');
const { Op } = require('sequelize');
const sequelize = require('../config/database'); // 引入 sequelize 实例用于事务

// 辅助函数：获取目标时区的日期字符串 (YYYY-MM-DD)
function getTargetDateString(targetTimezoneOffsetHours = 8) {
  const now = new Date();
  const targetOffsetMinutes = targetTimezoneOffsetHours * 60;
  const localOffsetMinutes = now.getTimezoneOffset();
  const totalOffsetMinutes = targetOffsetMinutes + localOffsetMinutes;
  const targetDate = new Date(now.getTime() + totalOffsetMinutes * 60000);
  return targetDate.toISOString().split('T')[0];
}

// --- 签到 API (!!! 重构逻辑 !!!) ---
router.post('/checkin', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const todayString = getTargetDateString();
  console.log(`[POST /checkin] User ${userId} attempting check-in for date: ${todayString}`); // 日志

  // 使用数据库事务确保原子性
  const t = await sequelize.transaction();

  try {
    // 1. 检查 CheckInLog 表今天是否已经签到
    const existingLog = await CheckInLog.findOne({
      where: {
        userId: userId,
        check_in_date: todayString
      },
      transaction: t // 在事务中查询
    });

    if (existingLog) {
      console.log(`  User ${userId} already checked in today.`); // 日志
      await t.rollback(); // 回滚事务
      return res.status(400).json({ message: '今天已经签到过了' });
    }

    // 2. 插入新的签到记录到 CheckInLog
    const pointsEarned = 1; // 本次签到获得的点数
    const newLog = await CheckInLog.create({
      userId: userId,
      check_in_date: todayString,
      points_earned: pointsEarned // 明确记录获得的积分
    }, { transaction: t });
    console.log(`  Created CheckInLog entry with ID: ${newLog.id}`); // 日志

    // 3. 更新 User 表的总积分 和 最后签到日期
    await User.update(
      {
        points: sequelize.literal(`points + ${pointsEarned}`), // 原子增加积分
        lastCheckIn: todayString // 仍然更新 User 表的 lastCheckIn，方便快速判断今日是否签到
      },
      {
        where: { id: userId },
        transaction: t // 在事务中更新
      }
    );
    console.log(`  Updated user ${userId} points and lastCheckIn.`); // 日志

    // 4. 提交事务
    await t.commit();
    console.log(`  Transaction committed successfully for user ${userId}.`); // 日志

    // 5. 获取更新后的用户总积分 (可选，如果前端需要立即显示最新总分)
    const updatedUser = await User.findByPk(userId, { attributes: ['points'] });

    // 6. 返回成功信息
    res.json({
      message: '签到成功！',
      points: updatedUser ? updatedUser.points : (req.user.points || 0) + pointsEarned, // Handle potential undefined points
      lastCheckIn: todayString
    });

  } catch (error) {
    // 如果发生任何错误，回滚事务
    await t.rollback();
    console.error(`[POST /checkin] Error for user ${userId}:`, error);
    // 检查是否是唯一约束错误 (重复签到)
    if (error.name === 'SequelizeUniqueConstraintError') {
         return res.status(400).json({ message: '今天已经签到过了 (并发冲突)' });
    }
    res.status(500).json({ message: '签到时服务器错误', error: error.message });
  }
});


// --- 获取最近活动记录 API (!!! 重构逻辑 !!!) ---
router.get('/activities', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const limit = 15; // 可以获取更多记录
  console.log(`[GET /activities] Request received for user ID: ${userId}, limit: ${limit}`);

  try {
    // 1. 获取最近的答题记录
    console.log(`  Fetching quiz logs for user ${userId}...`);
    const quizLogs = await DailyQuizLog.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']], // 按创建时间排序更精确
      limit: limit,
      include: [{ model: Question, attributes: ['question_text'] }]
    });
    console.log(`  Found ${quizLogs.length} quiz logs.`);

    // 2. 获取最近的签到记录
    console.log(`  Fetching check-in logs for user ${userId}...`);
    const checkInLogs = await CheckInLog.findAll({
        where: { userId: userId },
        order: [['createdAt', 'DESC']], // 按创建时间排序
        limit: limit // 也限制签到记录数量
    });
    console.log(`  Found ${checkInLogs.length} check-in logs.`);

    // 3. 格式化并合并记录
    const formattedQuizLogs = quizLogs.map(log => ({
      id: `quiz-${log.id}`,
      type: '答题',
      date: log.date_answered,
      points: log.was_correct ? '+1' : '+0',
      correct: log.was_correct,
      question: log.Question ? log.Question.question_text.substring(0, 30) + '...' : '题目详情加载失败',
      timestamp: log.createdAt.getTime() // 使用精确的创建时间戳
    }));

    const formattedCheckInLogs = checkInLogs.map(log => ({
        id: `checkin-${log.id}`,
        type: '签到',
        date: log.check_in_date,
        points: `+${log.points_earned}`,
        timestamp: log.createdAt.getTime() // 使用精确的创建时间戳
    }));

    let allActivities = [...formattedQuizLogs, ...formattedCheckInLogs];
    console.log(`  Total activities before sorting: ${allActivities.length}`);

    // 4. 按时间戳降序排序
    allActivities.sort((a, b) => b.timestamp - a.timestamp);

    // 5. 截取最终需要的数量 (例如最近 15 条混合记录)
    const finalActivities = allActivities.slice(0, limit);
    console.log(`  Sending ${finalActivities.length} activities.`);
    res.json(finalActivities);

  } catch (error) {
      console.error(`[GET /activities] Error for user ${userId}:`, error);
      res.status(500).json({ message: '获取活动记录失败', error: error.message });
  }
});


// --- (!!! 新增 API: 获取指定月份的签到记录 !!!) ---
// 路径: GET /api/user/checkins/:year/:month  (例如 /api/user/checkins/2025/10)
router.get('/checkins/:year/:month', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10); // 前端传过来的是 1-12
    
    console.log(`[GET /checkins] Request received for user ${userId}, year: ${year}, month: ${month}`); // 日志

    // 1. 输入验证
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 1970 || year > 2100) {
        console.warn(`  Invalid year/month provided: ${req.params.year}/${req.params.month}`); // 日志
        return res.status(400).json({ message: '无效的年份或月份' });
    }

    // 2. 构造查询月份的起始和结束日期 (YYYY-MM-DD)
    // 月份需要减 1 来构造 Date 对象 (0-11)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // 获取下个月的第一天，然后回退一天得到本月最后一天
    const nextMonthDate = new Date(year, month, 1); // JS中 month 是 0-11, 所以 month=10(十月) + 1 = 11(十一月), month=12(十二月) 自动进位到下一年
    nextMonthDate.setDate(nextMonthDate.getDate() - 1); // 回退一天到本月最后一天
    const endDateString = nextMonthDate.toISOString().split('T')[0]; // 获取本月最后一天

    console.log(`  Querying check-ins between ${startDate} and ${endDateString}`); // 日志

    try {
        // 3. 查询 CheckInLog 表
        const checkIns = await CheckInLog.findAll({
            where: {
                userId: userId,
                check_in_date: {
                    [Op.gte]: startDate, // 大于等于月初
                    [Op.lte]: endDateString  // 小于等于月末
                }
            },
            attributes: ['check_in_date'], // 只需要日期
            order: [['check_in_date', 'ASC']] // 按日期升序
        });

        // 4. 提取日期字符串数组
        const checkInDates = checkIns.map(log => log.check_in_date);
        console.log(`  Found ${checkInDates.length} check-in dates for the month.`); // 日志

        res.json(checkInDates); // 返回 ["2025-10-26", "2025-10-27"]

    } catch (error) {
        console.error(`[GET /checkins] Error for user ${userId}, month ${year}-${month}:`, error); // 日志
        res.status(500).json({ message: '查询签到记录失败', error: error.message });
    }
});


module.exports = router;