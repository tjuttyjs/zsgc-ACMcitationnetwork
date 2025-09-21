const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

// 创建节点
router.post('/nodes', async (req, res) => {
  const { label, properties } = req.body;
  const session = driver.session();
  
  try {
    // 构建属性字符串
    const propsString = Object.keys(properties)
      .map(key => `${key}: $${key}`)
      .join(', ');
    
    const result = await session.run(
      `CREATE (n:${label} {${propsString}}) RETURN n`,
      properties
    );
    
    const node = result.records[0].get('n').properties;
    res.json({ message: '节点创建成功', node });
  } catch (error) {
    console.error('创建节点失败:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 更新节点属性
router.put('/nodes/:id', async (req, res) => {
  const { id } = req.params;
  const { properties } = req.body;
  const session = driver.session();
  
  try {
    const setProps = Object.keys(properties)
      .map(key => `n.${key} = $${key}`)
      .join(', ');
    
    const result = await session.run(
      `MATCH (n) WHERE n.id = $id SET ${setProps} RETURN n`,
      { id, ...properties }
    );
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    const node = result.records[0].get('n').properties;
    res.json({ message: '节点更新成功', node });
  } catch (error) {
    console.error('更新节点失败:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 删除节点
router.delete('/nodes/:id', async (req, res) => {
  const { id } = req.params;
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (n {id: $id}) DETACH DELETE n RETURN count(n) as deletedCount',
      { id }
    );
    
    const deletedCount = result.records[0].get('deletedCount').low;
    if (deletedCount === 0) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    res.json({ message: '节点删除成功', deletedCount });
  } catch (error) {
    console.error('删除节点失败:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 创建关系
router.post('/relationships', async (req, res) => {
  const { fromId, toId, type, properties = {} } = req.body;
  const session = driver.session();
  
  try {
    const propsString = Object.keys(properties)
      .map(key => `${key}: $${key}`)
      .join(', ');
    
    const query = `
      MATCH (from {id: $fromId}), (to {id: $toId})
      CREATE (from)-[r:${type} {${propsString}}]->(to)
      RETURN r
    `;
    
    const result = await session.run(query, { fromId, toId, ...properties });
    
    const relationship = result.records[0].get('r');
    res.json({ message: '关系创建成功', relationship: relationship.properties });
  } catch (error) {
    console.error('创建关系失败:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// 删除关系
router.delete('/relationships', async (req, res) => {
  const { fromId, toId, type } = req.body;
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (from {id: $fromId})-[r:${type}]->(to {id: $toId}) DELETE r RETURN count(r) as deletedCount`,
      { fromId, toId }
    );
    
    const deletedCount = result.records[0].get('deletedCount').low;
    if (deletedCount === 0) {
      return res.status(404).json({ error: '关系不存在' });
    }
    
    res.json({ message: '关系删除成功', deletedCount });
  } catch (error) {
    console.error('删除关系失败:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;