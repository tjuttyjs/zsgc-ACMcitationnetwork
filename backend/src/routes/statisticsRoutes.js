const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

// 获取系统统计信息
router.get('/overview', async (req, res) => {
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (p:Paper)
      WITH count(p) as totalPapers
      MATCH (a:Author)
      WITH totalPapers, count(a) as totalAuthors
      MATCH (v:Venue)
      WITH totalPapers, totalAuthors, count(v) as totalVenues
      MATCH ()-[r:CITES]->()
      RETURN totalPapers, totalAuthors, totalVenues, count(r) as totalCitations
    `);
    
    const stats = result.records[0];
    res.json({
      papers: stats.get('totalPapers').low,
      authors: stats.get('totalAuthors').low,
      venues: stats.get('totalVenues').low,
      citations: stats.get('totalCitations').low
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 获取年度论文统计
router.get('/yearly', async (req, res) => {
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (p:Paper)
      WHERE p.year IS NOT NULL
      RETURN p.year as year, count(p) as count
      ORDER BY year
    `);
    
    const yearlyStats = result.records.map(record => ({
      year: record.get('year'),
      count: record.get('count').low
    }));
    
    res.json(yearlyStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;