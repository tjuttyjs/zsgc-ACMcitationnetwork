// backend/src/utils/neo4j.js
const neo4j = require('neo4j-driver');

class Neo4jConnection {
  constructor() {
    this.driver = null;
    this.connect(); // 确保在构造函数中调用连接
  }

  connect() {
    try {
      this.driver = neo4j.driver(
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
      console.log('✅ Neo4j connected successfully');
      return this.driver;
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw error;
    }
  }

  getSession() {
    if (!this.driver) {
      this.connect();
    }
    return this.driver.session();
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log('✅ Neo4j connection closed');
    }
  }
}

// 确保正确导出实例
module.exports = new Neo4jConnection();