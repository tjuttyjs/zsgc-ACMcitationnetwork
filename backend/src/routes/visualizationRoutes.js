const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = require('../utils/neo4j').driver;

// 知识图谱可视化数据接口（只处理CITES关系）
router.get('/', async (req, res) => {
  const { centerId, depth = 2, limit = 50 } = req.query;
  const session = driver.session();
  
  console.log('收到可视化请求:', { centerId, depth, limit });

  try {
    let nodes = [];
    let links = [];

    if (centerId) {
      console.log('查询中心节点:', centerId);
      // 以特定论文为中心查询引用网络
      const result = await session.run(`
        MATCH path = (start:Paper {id: $centerId})-[r:CITES*1..${depth}]-(related:Paper)
        UNWIND nodes(path) as node
        UNWIND relationships(path) as rel
        WITH 
          COLLECT(DISTINCT node) as allNodes,
          COLLECT(DISTINCT rel) as allRels
        LIMIT $limit
        
        RETURN allNodes, allRels
      `, { 
        centerId: centerId,
        limit: neo4j.int(parseInt(limit)) 
      });

      console.log('中心节点查询结果:', result.records.length, '条记录');

      if (result.records.length > 0) {
        const record = result.records[0];
        const allNodes = record.get('allNodes');
        const allRels = record.get('allRels');

        nodes = allNodes.map(node => ({
          id: node.properties.id || node.identity.toString(),
          name: getNodeName(node),
          type: node.labels[0],
          properties: node.properties
        }));

        links = allRels.map(rel => ({
          source: rel.start.toString(),
          target: rel.end.toString(),
          type: rel.type,
          name: '引用'
        }));
      }
    } else {
      console.log('查询随机引用关系数据');
      // 随机采样一些引用关系
      const result = await session.run(`
        // 获取一些引用关系
        MATCH (p1:Paper)-[r:CITES]->(p2:Paper)
        WHERE p1.title IS NOT NULL AND p2.title IS NOT NULL
        WITH p1, r, p2
        LIMIT ${limit}
        
        RETURN p1, r, p2
      `);

      console.log('随机引用查询结果:', result.records.length, '条记录');

      const nodeMap = new Map();
      
      result.records.forEach(record => {
        const paper1 = record.get('p1');
        const paper2 = record.get('p2');
        const rel = record.get('r');

        // 处理论文节点1
        if (paper1) {
          nodeMap.set(paper1.identity.toString(), {
            id: paper1.properties.id || paper1.identity.toString(),
            name: getNodeName(paper1),
            type: 'Paper',
            properties: paper1.properties
          });
        }

        // 处理论文节点2
        if (paper2) {
          nodeMap.set(paper2.identity.toString(), {
            id: paper2.properties.id || paper2.identity.toString(),
            name: getNodeName(paper2),
            type: 'Paper',
            properties: paper2.properties
          });
        }

        // 处理引用关系
        if (rel && paper1 && paper2) {
          links.push({
            source: paper1.identity.toString(),
            target: paper2.identity.toString(),
            type: 'CITES',
            name: '引用'
          });
        }
      });

      nodes = Array.from(nodeMap.values());
    }

    console.log('最终数据:', { 
      nodes: nodes.length, 
      links: links.length 
    });

    // 如果数据为空，返回测试数据
    if (nodes.length === 0) {
      console.log('无真实数据，返回测试数据');
      nodes = [
        { id: '1', name: '论文A', type: 'Paper', properties: { title: '论文A', id: '1' } },
        { id: '2', name: '论文B', type: 'Paper', properties: { title: '论文B', id: '2' } },
        { id: '3', name: '论文C', type: 'Paper', properties: { title: '论文C', id: '3' } }
      ];
      links = [
        { source: '1', target: '2', type: 'CITES', name: '引用' },
        { source: '2', target: '3', type: 'CITES', name: '引用' }
      ];
    }

    // 返回JSON数据
    res.json({ nodes, links });

  } catch (error) {
    console.error('可视化数据获取失败:', error);
    // 返回JSON格式的错误信息
    res.status(500).json({ 
      error: '获取数据失败',
      message: error.message,
      details: '请检查Neo4j连接和数据库状态'
    });
  } finally {
    await session.close();
  }
});

// 辅助函数：获取节点显示名称
function getNodeName(node) {
  if (node.labels.includes('Paper')) {
    return node.properties.title || `论文 ${node.identity}`;
  }
  return `节点 ${node.identity}`;
}

// 测试连接的路由
router.get('/test', async (req, res) => {
  const session = driver.session();
  try {
    // 简单的测试查询
    const result = await session.run(`
      MATCH (p:Paper) RETURN count(p) as paperCount
      UNION
      MATCH ()-[r:CITES]->() RETURN count(r) as citationCount
    `);
    
    const paperCount = result.records[0]?.get('paperCount')?.low || 0;
    const citationCount = result.records[1]?.get('citationCount')?.low || 0;
    
    res.json({ 
      status: 'success',
      paperCount,
      citationCount,
      message: `数据库中有 ${paperCount} 篇论文和 ${citationCount} 条引用关系`
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;