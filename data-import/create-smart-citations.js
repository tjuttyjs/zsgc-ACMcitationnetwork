// data-import/test-basic-import.js
const neo4j = require('neo4j-driver');

// 创建数据库连接
const driver = neo4j.driver(
  "bolt://localhost:7687", 
  neo4j.auth.basic("neo4j", "neo4j") // 替换为你的密码
);

async function testBasicImport() {
  const session = driver.session();
  
  try {
    console.log('开始测试 Neo4j 基本导入功能...\n');

    // 1. 清空测试数据（可选）
    console.log('1. 清理旧的测试数据...');
    await session.run(`
      MATCH (n:TestNode)
      DETACH DELETE n
    `);
    console.log('✅ 清理完成');

    // 2. 创建一些简单的测试节点
    console.log('\n2. 创建测试节点...');
    const createResult = await session.run(`
      CREATE 
        (n1:TestNode {id: 'test1', name: '测试节点1', value: 100}),
        (n2:TestNode {id: 'test2', name: '测试节点2', value: 200}),
        (n3:TestNode {id: 'test3', name: '测试节点3', value: 300}),
        (n4:TestNode {id: 'test4', name: '测试节点4', value: 400}),
        (n5:TestNode {id: 'test5', name: '测试节点5', value: 500})
      RETURN count(*) AS nodesCreated
    `);
    console.log(`✅ 创建了 ${createResult.records[0].get('nodesCreated').low} 个测试节点`);

    // 3. 创建测试关系
    console.log('\n3. 创建测试关系...');
    const relateResult = await session.run(`
      MATCH (n1:TestNode {id: 'test1'}), (n2:TestNode {id: 'test2'})
      MATCH (n3:TestNode {id: 'test3'}), (n4:TestNode {id: 'test4'})
      MATCH (n5:TestNode {id: 'test5'})
      
      CREATE 
        (n1)-[:CONNECTED_TO {weight: 1.5}]->(n2),
        (n2)-[:CONNECTED_TO {weight: 2.0}]->(n3),
        (n3)-[:CONNECTED_TO {weight: 0.8}]->(n4),
        (n4)-[:CONNECTED_TO {weight: 1.2}]->(n5),
        (n5)-[:CONNECTED_TO {weight: 0.5}]->(n1)
      
      RETURN count(*) AS relationshipsCreated
    `);
    console.log(`✅ 创建了 ${relateResult.records[0].get('relationshipsCreated').low} 条测试关系`);

    // 4. 查询并验证数据
    console.log('\n4. 验证导入的数据...');
    const verifyResult = await session.run(`
      MATCH (n:TestNode)
      RETURN n.id AS id, n.name AS name, n.value AS value
      ORDER BY n.value
    `);

    console.log('📊 节点数据:');
    verifyResult.records.forEach(record => {
      console.log(`   ID: ${record.get('id')}, Name: ${record.get('name')}, Value: ${record.get('value')}`);
    });

    // 5. 验证关系
    const relVerifyResult = await session.run(`
      MATCH (a:TestNode)-[r:CONNECTED_TO]->(b:TestNode)
      RETURN a.id AS from, b.id AS to, r.weight AS weight
    `);

    console.log('\n🔗 关系数据:');
    relVerifyResult.records.forEach(record => {
      console.log(`   ${record.get('from')} -> ${record.get('to')} (权重: ${record.get('weight')})`);
    });

    // 6. 统计总数
    const statsResult = await session.run(`
      MATCH (n:TestNode)
      WITH count(n) AS nodeCount
      MATCH ()-[r]->()
      RETURN nodeCount, count(r) AS relationshipCount
    `);

    const stats = statsResult.records[0];
    console.log(`\n📈 统计: ${stats.get('nodeCount').low} 个节点, ${stats.get('relationshipCount').low} 条关系`);

    console.log('\n🎉 Neo4j 导入功能测试成功！');
    console.log('✅ 数据库连接正常');
    console.log('✅ 数据写入正常');
    console.log('✅ 数据查询正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// 运行测试
testBasicImport()
  .then(() => {
    console.log('\n✨ 测试完成！你可以在 Neo4j Browser 中查看数据：');
    console.log('   运行: MATCH (n:TestNode) RETURN n');
    console.log('   运行: MATCH (a:TestNode)-[r:CONNECTED_TO]->(b:TestNode) RETURN a, r, b');
  })
  .catch(error => {
    console.error('\n💥 测试过程中发生错误:');
    console.error('   请检查:');
    console.error('   1. Neo4j 数据库是否正在运行');
    console.error('   2. 连接密码是否正确');
    console.error('   3. 防火墙是否允许端口 7687');
    process.exit(1);
  });