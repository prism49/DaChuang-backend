// 文件路径: DaChuang-backend/routes/test.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const TestResult = require('../models/TestResult');
const { Op, fn, col } = require('sequelize');

// --- 1. 我们的 12 道测试题 (硬编码在后端) ---
const questions = [
  { id: 1, text: "相比于个体的自由表达，我认为维护一个和谐有序的社会秩序更为重要。", type: "H" },
  { id: 2, text: "只要是客观真理，哪怕它会冒犯到他人或打破传统，也应该被公开辩论和追求。", type: "R" },
  { id: 3, text: "“我”的价值主要体现在我对家庭、朋友和所属群体履行的责任中。", type: "H" },
  { id: 4, text: "“我”的价值主要体现在我独立的思考能力和不受他人干涉的自由选择中。", type: "R" },
  { id: 5, text: "面对自然（如高山流水），我更倾向于“顺应”和“融入”，感受其内在的“道”与“气韵”。", type: "H" },
  { id: 6, text: "面对自然，我更倾向于“分析”和“理解”，探究其背后的数学和物理规律。", type: "R" },
  { id: 7, text: "艺术的最高境界是捕捉无形的“神韵”与“意境”，引发观者的情感共鸣。", type: "H" },
  { id: 8, text: "艺术的最高境界是展现完美的“形式”与“比例”，带给观者理性的“美感”。", type: "R" },
  { id: 9, text: "教育的首要目的是培养一个有高尚品德和责任感的“君子”。", type: "H" },
  { id: 10, text: "教育的首要目的是培养一个有批判性思维和逻辑能力的“哲人”。", type: "R" },
  { id: 11, text: "面对人际冲突，最好的方式是寻求“中庸之道”，照顾各方情面，达成都能接受的妥协。", type: "H" },
  { id: 12, text: "面对人际冲突，最好的方式是进行彻底的“辩论”，明确分清事实对错，并依此做出裁决。", type: "R" },
];

// --- 2. 我们的 5 种分析结果 (硬编码) ---
const resultTypes = {
  "The Sage": { title: "儒道圣贤 (The Sage)", analysis: "“天行健，君子以自强不息；地势坤，君子以厚德载物。”\n\n你的灵魂深深植根于东方的智慧。你高度重视和谐 (Harmony)、人伦 (Relationship) 和责任 (Duty)。你相信个体的价值在于他对群体的贡献，而最高的善（“仁”）体现在对家庭的“孝”和对社会的“义”之中。\n\n你倾向于“修身”，通过道德自省来完善自我。你尊重传统与秩序，相信“中庸之道”是解决冲突的最佳途径。你欣赏写意的、蕴含“神韵”的艺术，并寻求“天人合一”的境界。\n\n关键词：仁爱、责任、秩序、和谐、修身、中庸。" },
  "The Philosopher": { title: "希腊哲人 (The Philosopher)", analysis: "“我唯一知道的，就是我一无所知。”\n\n你是希腊精神的继承者。你崇尚理性 (Logos)、真理 (Truth) 和个体 (Individual)。你坚信“未经审视的人生是不值得过的”，并把运用逻辑和思辨探求事物本质作为最高的德行。\n\n你强调个体的独立与自由，倾向于通过公开辩论和清晰的法律来追求正义。你欣赏精确的、符合“黄金比例”的形式美。面对命运，你更欣赏悲剧英雄式的抗争，以此彰显人的意志与尊严。\n\n关键词：理性、真理、个体、逻辑、辩论、形式美。" },
  "The Humanist Thinker": { title: "仁爱的智者 (The Humanist Thinker)", analysis: "“和而不同，周而不比。”\n\n你是罕见的融合体，是连接两座思想高峰的桥梁。你既有儒者的“仁心”和对社群的责任感，也有哲人的“理性”和对真理的执着追求。\n\n你能在“人情”与“法理”间游刃有余；既能理解“修身”的内省，也能实践“思辨”的外求。你既能欣赏《兰亭集序》的“神韵”，也能分析帕特农神庙的“比例”。你是一个真正的人本主义者，既关心人的道德完善，也关心人的思想解放。\n\n关键词：融合、人本、思辨、同理心、知行合一。" },
  "The Pragmatist": { title: "务实的行者 (The Pragmatist)", analysis: "“不管黑猫白猫，能抓到老鼠就是好猫。”\n\n你对宏大的抽象理论（无论是东方的“道”还是西方的“理念”）都持有一种务实的怀疑态度。你既不认为“和谐秩序”是最高追求，也不认为“抽象真理”有什么终极价值。\n\n你更相信眼前的经验、实际的效果和个人的直觉。你倾向于具体问题具体分析，而不是套用某个宏大的框架。你可能认为 H 题和 R 题的陈述都“过于理想化”或“太极端”，现实世界远比这复杂。\n\n关键词：务实、经验、怀疑、灵活、结果导向。" },
  "The Balanced Mediator": { title: "平衡的调停者 (The Balanced Mediator)", analysis: "（此类型与“仁爱的智者”相似，但倾向不明显）\n\n你没有表现出对任何一方的强烈偏好，你更像一个中立的观察者或调停者。你理解两种文化的价值，但不会全盘接受任何一方。你善于在两种思想中汲取养分，根据具体情境灵活运用。\n\n关键词：中立、灵活、适应性强、情境主义。" }
};

// --- 3. 计分与分析的辅助函数 ---
function calculateScores(answers) { // Removed type hint for JS compatibility
  let h_score = 0;
  let r_score = 0;
  answers.forEach((score, index) => {
    // Ensure index is within bounds and score is a number
    if (index < questions.length && typeof score === 'number') {
        const questionType = questions[index].type;
        if (questionType === 'H') {
            h_score += score;
        } else if (questionType === 'R') {
            r_score += score;
        }
    } else {
        console.warn(`Invalid answer at index ${index}:`, score);
    }
  });
  return { h_score, r_score };
}
function determineResultType(h_score, r_score) { // Removed type hints for JS compatibility
  const H_HIGH = 5, H_LOW = -5, R_HIGH = 5, R_LOW = -5;
  if (h_score > H_HIGH && r_score > R_HIGH) return "The Humanist Thinker";
  if (h_score > H_HIGH && r_score <= R_HIGH) return "The Sage";
  if (r_score > R_HIGH && h_score <= R_HIGH) return "The Philosopher";
  if (h_score < H_LOW && r_score < R_LOW) return "The Pragmatist";
  return "The Balanced Mediator";
}

// --- 4. API 路由定义 ---

// API 1: 获取题目
router.get('/questions', authMiddleware, (req, res) => {
  res.json(questions.map(q => ({ id: q.id, text: q.text })));
});

// API 2: 获取结果
router.get('/result', authMiddleware, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/test/result - Request received for user ID: ${req.user?.id}`);
  try {
    const userId = req.user?.id;
    if (!userId) {
       console.error("  Error: User ID not found in req.user");
       return res.status(401).json({ message: '无法识别用户 (middleware error?)' });
    }

    console.log(`  Querying database for userId: ${userId}`);
    const existingResult = await TestResult.findOne({ where: { userId: userId } });
    console.log(`  Database query result:`, existingResult ? JSON.stringify(existingResult.toJSON(), null, 2) : null);

    if (existingResult) {
      console.log(`  Result found. Type: ${existingResult.result_type}`);
      const analysis = resultTypes[existingResult.result_type] || { title: "未知类型", analysis: "..." };
      // Ensure all fields are present before sending
      const responsePayload = {
        hasResult: true,
        result: {
          h_score: existingResult.h_score,
          r_score: existingResult.r_score,
          result_type: existingResult.result_type,
          title: analysis.title,
          analysis: analysis.analysis
        }
      };
      console.log(`  Sending response payload:`, JSON.stringify(responsePayload, null, 2));
      res.json(responsePayload);
    } else {
      console.log(`  No result found for user.`);
      res.json({ hasResult: false });
    }
  } catch (error) { // Catch any error
    console.error(`[${new Date().toISOString()}] Error processing GET /api/test/result:`, error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});


// API 3: 提交答案 (!!! 修复版 !!!)
router.post('/submit', authMiddleware, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/test/submit - Request received for user ID: ${req.user?.id}`);
  try {
    const userId = req.user?.id;
    if (!userId) { return res.status(401).json({ message: '无法识别用户' }); }

    const { answers } = req.body;
    console.log(`  Received answers:`, answers);

    if (!Array.isArray(answers) || answers.length !== questions.length) {
        console.warn(`  Validation failed: Expected ${questions.length} answers, got ${answers?.length}`);
        return res.status(400).json({ message: `答案数量必须为 ${questions.length} 个` });
    }
    if (!answers.every(score => typeof score === 'number' && score >= -2 && score <= 2)) {
        console.warn(`  Validation failed: Invalid scores found in answers`);
        return res.status(400).json({ message: '包含无效的答案分数' });
    }


    const existingResult = await TestResult.findOne({ where: { userId: userId } });
    if (existingResult) {
        console.warn(`  Submission failed: User ${userId} already submitted.`);
        return res.status(400).json({ message: '您已经完成过此测试' });
    }

    const { h_score, r_score } = calculateScores(answers);
    console.log(`  Calculated scores: H=${h_score}, R=${r_score}`);

    const result_type = determineResultType(h_score, r_score);
    console.log(`  Determined result type: ${result_type}`);

    const newResult = await TestResult.create({ userId, h_score, r_score, result_type });
    console.log(`  Saved new result to DB with ID: ${newResult.id}`);


    const analysis = resultTypes[newResult.result_type] || { title: "未知类型", analysis: "..." };

    // (!!! 这是修复后的部分 !!!)
    const resultPayload = {
        h_score: newResult.h_score,     // <-- 添加 h_score
        r_score: newResult.r_score,     // <-- 添加 r_score
        result_type: newResult.result_type, // <-- 添加 result_type
        title: analysis.title,
        analysis: analysis.analysis
    };

    console.log("[test.js /submit] Payload being sent to frontend:", JSON.stringify(resultPayload, null, 2));

    res.status(201).json({
      result: resultPayload // <-- 发送完整的对象
    });

  } catch (error) { // Catch any error
    console.error(`[${new Date().toISOString()}] Error processing POST /api/test/submit:`, error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});


// API 4: 删除结果
router.delete('/result', authMiddleware, async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /api/test/result - Request received for user ID: ${req.user?.id}`);
  try {
    const userId = req.user?.id;
    if (!userId) { return res.status(401).json({ message: '无法识别用户' }); }

    const deletedRows = await TestResult.destroy({ where: { userId: userId } });

    if (deletedRows > 0) {
      console.log(`  Successfully deleted result for user ${userId}.`);
      res.status(200).json({ message: '测试结果已重置' });
    } else {
      console.log(`  No result found to delete for user ${userId}.`);
      res.status(404).json({ message: '未找到测试结果' });
    }

  } catch (error) { // Catch any error
    console.error(`[${new Date().toISOString()}] Error processing DELETE /api/test/result:`, error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});


// API 5: 获取统计
router.get('/stats', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/test/stats - Request received`);
  try {
    const stats = await TestResult.findAll({
      attributes: [
        'result_type',
        [fn('COUNT', col('result_type')), 'count']
      ],
      group: ['result_type']
    });

    const totalCount = stats.reduce((sum, item) => sum + (Number(item.get('count')) || 0), 0); // Ensure count is treated as number

    const formattedStats = {};
    stats.forEach(item => {
      // Ensure result_type is a string and count is a number before assigning
      const type = item.get('result_type');
      const count = Number(item.get('count')); // Convert count to number
      if (type && typeof count === 'number') {
           formattedStats[type] = count;
      }
    });
    console.log(`  Sending stats:`, formattedStats, `Total:`, totalCount);

    res.json({
      stats: formattedStats,
      total: totalCount
    });

  } catch (error) { // Catch any error
    console.error(`[${new Date().toISOString()}] Error processing GET /api/test/stats:`, error);
    res.status(500).json({ message: '获取统计数据失败', error: error.message });
  }
});


module.exports = router;