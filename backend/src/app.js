// backend/src/app.js
const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');
require('dotenv').config();

// 1. 首先创建 Express 应用
const app = express();

// 2. 然后配置中间件
app.use(cors());
app.use(express.json());

// 3. 创建数据库连接
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'neo4j'
  ),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 120000
  }
);

// 4. 然后导入路由
const paperRoutes = require('./routes/paperRoutes');
const authorRoutes = require('./routes/authorRoutes');
const venueRoutes = require('./routes/venueRoutes');
const citationRoutes = require('./routes/citationRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

// 5. 最后注册路由
app.use('/api/papers', paperRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/statistics', statisticsRoutes);

// 6. 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    await session.close();
    
    res.json({ 
      status: 'OK', 
      message: 'Knowledge Graph API is running',
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// 7. 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 8. 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 9. 优雅关闭
process.on('SIGINT', async () => {
  await driver.close();
  process.exit(0);
});