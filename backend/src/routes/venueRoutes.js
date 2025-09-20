const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

// 获取所有会议/期刊
router.get('/', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (v:Venue)
      RETURN v.name as venue, count{(v)<-[:PUBLISHED_IN]-()} as paperCount
      ORDER BY paperCount DESC
      LIMIT 50
    `);
    
    const venues = result.records.map(record => ({
      name: record.get('venue'),
      paperCount: record.get('paperCount').low
    }));
    
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 获取特定会议的论文
router.get('/:name/papers', async (req, res) => {
  const { name } = req.params;
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (p:Paper)-[:PUBLISHED_IN]->(v:Venue {name: $name})
      RETURN p
      ORDER BY p.year DESC
      LIMIT 50
    `, { name });
    
    const papers = result.records.map(record => record.get('p').properties);
    res.json(papers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;