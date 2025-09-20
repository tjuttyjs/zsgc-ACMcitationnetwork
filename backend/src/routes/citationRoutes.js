const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

// 获取论文的引用关系
router.get('/paper/:id', async (req, res) => {
  const { id } = req.params;
  const session = driver.session();
  
  try {
    // 获取被引用的论文（参考文献）
    const citedResult = await session.run(`
      MATCH (p:Paper {id: $id})-[:CITES]->(cited:Paper)
      RETURN cited
      LIMIT 20
    `, { id });
    
    // 获取引用的论文（被谁引用）
    const citingResult = await session.run(`
      MATCH (citing:Paper)-[:CITES]->(p:Paper {id: $id})
      RETURN citing
      LIMIT 20
    `, { id });
    
    res.json({
      references: citedResult.records.map(record => record.get('cited').properties),
      citations: citingResult.records.map(record => record.get('citing').properties)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;