const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware'); // 引入“保安”
const Question = require('../models/Question');
const DailyQuizLog = require('../models/DailyQuizLog');
const User = require('../models/User');

// 辅助函数：获取今天的日期 (YYYY-MM-DD)
function getTodayDateString() {
  const today = new Date();
  // 转换到东八区（北京时间）
  const offset = today.getTimezoneOffset() + (8 * 60); // 本地时区偏移 + 8小时
  today.setMinutes(today.getMinutes() + offset);
  return today.toISOString().split('T')[0];
}

// 辅助函数：获取今天是今年的第几天 (1-366)
function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// --- API 1: 获取每日一题 ---
// 路径: GET /api/quiz/daily
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString(); // '2025-10-23'

    // 1. 决定今天的题目
    const totalQuestions = await Question.count();
    if (totalQuestions === 0) {
      return res.status(404).json({ message: '题库中没有题目' });
    }
    const dayOfYear = getDayOfYear();
    const questionId = (dayOfYear % totalQuestions) + 1; // 确保 ID 从 1 开始

    // 2. 检查用户今天是否已经答过此题
    const log = await DailyQuizLog.findOne({
      where: {
        userId: userId,
        date_answered: today
        // 我们假设一天只有一题，所以不用检查 questionId
      }
    });

    // 3. 获取题目信息
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: '未找到今日题目' });
    }

    if (log) {
      // --- 3a. 如果今天已经答过 ---
      res.json({
        hasAnswered: true,
        wasCorrect: log.was_correct,
        question: {
          id: question.id,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer, // 答过后，把正确答案发给前端
          analysis: question.analysis
        }
      });
    } else {
      // --- 3b. 如果今天还没答 ---
      res.json({
        hasAnswered: false,
        question: {
          id: question.id,
          question_text: question.question_text,
          options: question.options
          // 注意：不发送 correct_answer 和 analysis
        }
      });
    }

  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// --- API 2: 提交每日一题的答案 ---
// 路径: POST /api/quiz/submit
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId, userAnswerIndex } = req.body; // 前端发来的答案
    const today = getTodayDateString();

    // 1. 再次检查是否已答过 (防止重复提交)
    const existingLog = await DailyQuizLog.findOne({
      where: { userId: userId, date_answered: today }
    });
    if (existingLog) {
      return res.status(400).json({ message: '今天已经回答过了' });
    }

    // 2. 找出正确答案
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }
    
    const isCorrect = (question.correct_answer === userAnswerIndex);
    
    // 使用数据库“事务”来确保两步操作要么都成功，要么都失败
    await sequelize.transaction(async (t) => {
      
      // 3. 记录答题日志
      await DailyQuizLog.create({
        userId: userId,
        questionId: questionId,
        date_answered: today,
        was_correct: isCorrect
      }, { transaction: t });

      let newPoints = req.user.points;

      // 4. 如果答对，给用户加分
      if (isCorrect) {
        newPoints = req.user.points + 1;
        await User.update(
          { points: newPoints },
          { where: { id: userId }, transaction: t }
        );
      }
      
      // 5. 返回成功结果
      res.json({
        correct: isCorrect,
        analysis: question.analysis,
        newPoints: newPoints // 把最新的积分发给前端
      });
    });

  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});


module.exports = router;