const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = require('../utils/neo4j').driver;

// 搜索论文
router.get('/search', async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const session = driver.session();
  
  try {
    console.log(`执行搜索查询: ${q}`);
    
    // 确保参数是整数 - 使用 Neo4j 的整数类型
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skipNum = (pageNum - 1) * limitNum;

    // 使用 Neo4j 的整数类型
    const result = await session.run(`
      MATCH (p:Paper)
      WHERE p.title CONTAINS $query OR p.abstract CONTAINS $query
      RETURN p
      SKIP $skip LIMIT $limit
    `, {
      query: q,
      skip: neo4j.int(skipNum),    // 使用 neo4j.int()
      limit: neo4j.int(limitNum)   // 使用 neo4j.int()
    });

    console.log(`找到 ${result.records.length} 条结果`);
    
    const papers = result.records.map(record => {
      const paper = record.get('p').properties;
      return {
        id: paper.id,
        title: paper.title,
        year: paper.year,
        abstract: paper.abstract ? paper.abstract.substring(0, 200) + '...' : '',
        venue: paper.venue,
        n_citation: paper.n_citation
      };
    });

    res.json({
      papers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: papers.length
      }
    });
  } catch (error) {
    console.error('搜索错误详情:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message
    });
  } finally {
    await session.close();
  }
});

module.exports = router;