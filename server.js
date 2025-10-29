// 文件路径: DaChuang-backend/server.js (带题库填充功能)

require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// --- 1. 引入所有模型 ---
const User = require('./models/User');
const Question = require('./models/Question');
const DailyQuizLog = require('./models/DailyQuizLog');
const CheckInLog = require('./models/CheckInLog');

// --- 2. 题库数据 (我们设计好的10道题) ---
const quizBank = [
  {
    question_text: "孔子在《论语》中强调的核心道德概念“仁” (rén)，其内涵（如“克己复礼”、“爱人”）与古希腊哲学中哪个概念最能进行对比，两者都探讨“人的卓越与美德”？",
    options: ["Logos (逻各斯 - 逻辑/道)", "Arete (阿瑞忒 - 卓越/美德)", "Eros (爱若斯 - 爱欲)", "Atom (原子)"],
    correct_answer: 1, // B 是索引 1
    analysis: "“仁”是儒家伦理的最高境界，指个体道德的完善。古希腊的 “Arete” (阿瑞忒) 也指一种“卓越”，即人（或物）能达到的最佳状态或功能，苏格拉底和柏拉图都将其引申为灵魂的美德。"
  },
  {
    question_text: "老子在《道德经》中描述的“道” (Dao) 是万物的本源和法则，古希腊哲学家赫拉克利特 (Heraclitus) 也提出了一个相似的概念，指代宇宙中永恒的秩序和法则，这个概念是？",
    options: ["Eudaimonia (幸福)", "Logos (逻各斯)", "Chaos (混沌)", "Techne (技艺)"],
    correct_answer: 1, // B 是索引 1
    analysis: "赫拉克利特提出的 “Logos” (逻各斯) 是一种理性的、统一的宇宙法则，它支配着万物的变化（如“人不能两次踏入同一条河流”），这与“道”作为宇宙终极规律的思想有很强的可比性。"
  },
  {
    question_text: "柏拉图在《理想国》(Republic) 中提出的“哲学王” (Philosopher King) 统治理念，与中国先秦哪位思想家的“圣人”或“君子”治国理念最为相似？",
    options: ["韩非子 (法家)", "墨子 (墨家)", "孔子 (儒家)", "孙子 (兵家)"],
    correct_answer: 2, // C 是索引 2
    analysis: "柏拉图的“哲学王”是指最有智慧、最富德性的哲学家来统治城邦。这与儒家（孔子、孟子）主张应由具备高度道德修养的“圣人”或“君子”来治理国家的思想（德治）高度一致。"
  },
  {
    question_text: "荷马史诗（如《伊利亚特》）主要描绘了英雄的愤怒、战争与荣誉，而中国最早的诗歌总集《诗经》则更多关注？",
    options: ["众神的谱系与战争", "创世神话与洪水", "民间生活、劳动、婚丧与情感", "抽象的哲学辩论"],
    correct_answer: 2, // C 是索引 2
    analysis: "《诗经》中的“风”部分包含了大量源于民间的现实主义诗歌，反映了周朝的社会生活和普通人的情感，而荷马史诗则聚焦于超凡的英雄及其悲剧命运。"
  },
  {
    question_text: "（灵感源于《会饮篇》）柏拉图在《会饮篇》(Symposium) 中，通过苏格拉底之口阐述的“爱” (Eros) 是一种精神的阶梯，其最终目的是为了导向什么？",
    options: ["政治权力的获取", "财富与名誉", "对“美本身” (理念) 的沉思", "身体的欢愉与繁衍"],
    correct_answer: 2, // C 是索引 2
    analysis: "在《会饮篇》中，爱（Eros）被描述为一个梯子：从爱一个美的身体，到爱所有美的身体，再到爱美的心灵、美的制度，最终达到对“美本身”（即美的理念/The Form of Beauty）的哲学沉思。"
  },
  {
    question_text: "孟子 (Mencius) 提出了“性善论”，认为人生来就有“四端”。与他相反，哪位儒家思想家提出了“性恶论”，主张“化性起伪”（通过后天教化改变本性）？",
    options: ["荀子 (Xunzi)", "董仲舒 (Dong Zhongshu)", "朱熹 (Zhu Xi)", "王阳明 (Wang Yangming)"],
    correct_answer: 0, // A 是索引 0
    analysis: "荀子是先秦儒家另一位大师，他认为人性本“恶”（即带有原始欲望），必须通过后天的礼义和教育（“伪”）来加以改造和约束，这与孟子的观点形成了儒家内部的经典对比。"
  },
  {
    question_text: "被称为“西方逻辑学之父”的亚里士多德 (Aristotle) 以其三段论 (Syllogism) 著称。在中国先秦时期，哪个学派也发展了复杂的逻辑学、认识论和论辩术（如“辩”与“故”）？",
    options: ["儒家 (Confucianism)", "法家 (Legalism)", "墨家 (Mohism)", "阴阳家 (Yin-Yang School)"],
    correct_answer: 2, // C 是索引 2
    analysis: "墨家后期的《墨经》中包含了大量关于逻辑学、几何学和物理学的论述，其对“故”（原因）、“类”（归纳/类比）的探讨，被认为是可与亚里士多德逻辑学相媲美的古代逻辑体系。"
  },
  {
    question_text: "古希腊悲剧（如索福克勒斯的《俄狄浦斯王》）的核心在于探讨人与“命运”(Fate) 的抗争与必然的毁灭。而中国古典戏曲（如元杂剧《窦娥冤》）在结局上更倾向于？",
    options: ["英雄在抗争中光荣毁灭", "众神降临解决一切冲突", "善恶有报与大团圆", "开放式结局，引人深思"],
    correct_answer: 2, // C 是索引 2
    analysis: "西方古典悲剧强调命运的不可违抗性。而中国古典戏曲深受儒家和民间伦理影响，强调“善有善报，恶有恶报”，即使主角在生前蒙冤（如窦娥），最终也必须通过超自然力量（如清官、神仙）实现正义，达成一个道德上的大团圆。"
  },
  {
    question_text: "中国先秦的“法家”（Legalism）思想强调法律是君主加强统治、富国强兵的工具。而古罗马法（Roman Law）对世界最大的贡献在于它最终发展为一种？",
    options: ["仅适用于贵族的法律", "基于神启的宗教法律", "强调程序正义和保护私有财产权的法律体系", "仅用于军事管理的法律"],
    correct_answer: 2, // C 是索引 2
    analysis: "法家是“Rule *by* Law”（君主利用法律），而罗马法是“Rule *of* Law”（法律至上）的雏形。罗马法（尤其是《查士丁尼法典》）系统地确立了私有财产权、契约精神和法律程序，成为后世大陆法系的基石。"
  },
  {
    question_text: "“认识你自己” (Know thyself) 是镌刻在古希腊德尔菲神庙上的箴言，也是哪位哲学家思想的核心出发点？",
    options: ["赫拉克利特 (Heraclitus)", "德谟克利特 (Democritus)", "苏格拉底 (Socrates)", "庄子 (Zhuangzi)"],
    correct_answer: 2, // C 是索引 2
    analysis: "苏格拉底常引用这句箴言，他认为哲学的首要任务不是研究自然，而是通过反思来审视自己的灵魂和知识，即“未经审视的人生是不值得过的”。"
  }
];

// --- 3. 检查并填充题库的函数 ---
async function populateDatabase() {
  try {
    // 检查 Question 表中是否已有数据
    const count = await Question.count();
    
    if (count === 0) {
      // 如果表是空的, 批量插入题库
      await Question.bulkCreate(quizBank);
      console.log('✅ 题库已成功填充 (10 道题目).');
    } else {
      console.log('ℹ️ 题库已有数据, 无需填充.');
    }
  } catch (error) {
    console.error('❌ 填充题库时出错:', error);
  }
}

// --- 4. 启动服务器的主函数 ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- API 路由 ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/test', require('./routes/test'));

app.get('/', (req, res) => {
  res.send('欢迎来到 DaChuang 后端服务器! (使用 MySQL)');
});

async function startServer() {
  try {
    // 1. 连接数据库
    await sequelize.authenticate();
    console.log('✅ MySQL 数据库连接成功.');
    
    // 2. 同步所有模型 (自动创建或更新表)
    //    force: false (默认) : 如果表已存在, 不删除
    //    alter: true : 检查差异并修改表 (更安全, 但可能慢)
    await sequelize.sync({ alter: true }); 
    console.log('🔄 所有模型已成功同步.');

    // 3. 填充题库 (!!! 新增步骤 !!!)
    await populateDatabase();
    
    // 4. 启动 Express 服务器
    app.listen(PORT, () => {
      console.log(`🚀 后端服务器正在 http://localhost:${PORT} 上运行`);
    });
  } catch (error) {
    console.error('❌ 无法启动服务器:', error);
  }
}

// 运行启动函数
startServer();