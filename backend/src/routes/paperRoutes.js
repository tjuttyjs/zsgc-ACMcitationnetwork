const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = require('../utils/neo4j').driver;

// 搜索论文（增强筛选功能）
router.get('/search', async (req, res) => {
  const { q, page = 1, limit = 20, venue, yearFrom, yearTo, citationsMin } = req.query;
  const session = driver.session();
  
  try {
    console.log(`执行搜索查询: ${q}, 筛选条件:`, { venue, yearFrom, yearTo, citationsMin });
    
    // 构建筛选条件
    let whereConditions = [];
    let params = { query: q };
    
    if (q) {
      whereConditions.push('(p.title CONTAINS $query OR p.abstract CONTAINS $query)');
    }
    
    if (venue) {
      whereConditions.push('p.venue = $venue');
      params.venue = venue;
    }
    
    if (yearFrom && yearTo) {
      whereConditions.push('p.year >= $yearFrom AND p.year <= $yearTo');
      params.yearFrom = neo4j.int(parseInt(yearFrom));
      params.yearTo = neo4j.int(parseInt(yearTo));
    } else if (yearFrom) {
      whereConditions.push('p.year >= $yearFrom');
      params.yearFrom = neo4j.int(parseInt(yearFrom));
    } else if (yearTo) {
      whereConditions.push('p.year <= $yearTo');
      params.yearTo = neo4j.int(parseInt(yearTo));
    }
    
    if (citationsMin) {
      whereConditions.push('p.n_citation >= $citationsMin');
      params.citationsMin = neo4j.int(parseInt(citationsMin));
    }
    
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 分页参数
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skipNum = (pageNum - 1) * limitNum;

    const result = await session.run(`
      MATCH (p:Paper)
      ${whereClause}
      RETURN p
      ORDER BY p.n_citation DESC, p.year DESC
      SKIP $skip LIMIT $limit
    `, {
      ...params,
      skip: neo4j.int(skipNum),
      limit: neo4j.int(limitNum)
    });

    // 获取总数用于分页
    const countResult = await session.run(`
      MATCH (p:Paper)
      ${whereClause}
      RETURN count(p) as totalCount
    `, params);

    const totalCount = countResult.records[0]?.get('totalCount').low || 0;
    
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
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
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

// 获取所有会议/期刊列表用于筛选
router.get('/venues', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (p:Paper)
      WHERE p.venue IS NOT NULL
      RETURN DISTINCT p.venue as venue
      ORDER BY venue
    `);
    
    const venues = result.records.map(record => record.get('venue'));
    res.json(venues.filter(venue => venue)); // 过滤空值
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;