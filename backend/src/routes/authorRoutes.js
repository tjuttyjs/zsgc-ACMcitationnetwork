const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

// 作者搜索
// authorRoutes.js 中 /search 路由示例修改
router.get('/search', async (req, res) => {
  const { name, page = 1, limit = 20 } = req.query; // 从查询字符串获取参数
  const session = driver.session();
  
  try {
    // 确保 page 和 limit 是整数
    const pageNum = Math.max(1, parseInt(page));   // 解析并确保至少为1
    const limitNum = Math.max(1, parseInt(limit)); // 解析并确保至少为1
    const skipNum = (pageNum - 1) * limitNum;      // 计算需要跳过的数量

    const result = await session.run(`
      MATCH (a:Author)
      WHERE a.name CONTAINS $name
      RETURN a, size([(a)-[:WROTE]->(p) | p]) as paperCount
      SKIP $skip LIMIT $limit  // Cypher查询使用 SKIP 和 LIMIT
    `, {
      name: name,
      skip: skipNum,   // 传递整数
      limit: limitNum  // 传递整数
    });

    const authors = result.records.map(record => ({
      ...record.get('a').properties,
      paperCount: record.get('paperCount').low
    }));

    res.json(authors);
  } catch (error) {
    console.error("作者搜索错误:", error.message); // 输出错误信息到服务器控制台
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;