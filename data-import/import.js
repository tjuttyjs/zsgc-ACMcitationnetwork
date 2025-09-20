// data-import/import-acm-v11-fixed.js
const neo4j = require('neo4j-driver');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// 数据库配置
const driver = neo4j.driver(
  "bolt://localhost:7687", 
  neo4j.auth.basic("neo4j", "neo4j"),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 120000
  }
);

class ACMImporter {
  constructor() {
    this.stats = {
      papers: 0,
      authors: 0,
      venues: 0,
      references: 0,
      relationships: 0
    };
    this.batchSize = 1000;
  }

  async importFile(filePath) {
    console.log(`🚀 开始导入 ACM Citation Network V11 数据...`);
    console.log(`文件: ${path.basename(filePath)}`);
    
    const session = driver.session();
    
    try {
      // 创建索引（先创建以提高性能）
      await this.createIndexes(session);
      
      let paperBatch = [];
      let referenceBatch = [];
      
      // 创建读取流
      const fileStream = fs.createReadStream(filePath, { 
        encoding: 'utf8',
        highWaterMark: 1024 * 1024 // 1MB chunks
      });
      
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      // 逐行处理
      for await (const line of rl) {
        if (line.trim()) {
          try {
            const paper = JSON.parse(line);
            paperBatch.push(paper);
            
            // 处理引用关系
            if (paper.references && paper.references.length > 0) {
              paper.references.forEach(refId => {
                referenceBatch.push({
                  sourceId: paper.id,
                  targetId: refId
                });
                this.stats.references++;
              });
            }

            // 批量处理论文
            if (paperBatch.length >= this.batchSize) {
              await this.processPaperBatch(paperBatch, session);
              paperBatch = [];
            }

            // 批量处理引用关系
            if (referenceBatch.length >= this.batchSize * 5) {
              await this.processReferenceBatch(referenceBatch, session);
              referenceBatch = [];
            }

          } catch (parseError) {
            console.warn('JSON解析错误:', parseError.message);
          }
        }
      }

      // 处理剩余批次
      if (paperBatch.length > 0) {
        await this.processPaperBatch(paperBatch, session);
      }
      if (referenceBatch.length > 0) {
        await this.processReferenceBatch(referenceBatch, session);
      }

      // 统计最终数量
      await this.updateFinalStats(session);

      console.log('\n✅ 导入完成！统计信息:');
      console.log(`   论文: ${this.stats.papers}`);
      console.log(`   作者: ${this.stats.authors}`);
      console.log(`   会议/期刊: ${this.stats.venues}`);
      console.log(`   引用关系: ${this.stats.references}`);
      console.log(`   总关系数: ${this.stats.relationships}`);

    } catch (error) {
      console.error('导入过程中出错:', error);
    } finally {
      await session.close();
      await driver.close();
    }
  }

  async processPaperBatch(batch, session) {
    const query = `
      UNWIND $batch AS paper
      
      // 1. 创建或更新论文节点
      MERGE (p:Paper {id: paper.id})
      SET p.title = paper.title,
          p.abstract = paper.abstract,
          p.year = toInteger(paper.year),
          p.keywords = paper.keywords,
          p.n_citation = toInteger(paper.n_citation),
          p.doi = paper.doi,
          p.volume = paper.volume,
          p.issue = paper.issue,
          p.page_start = paper.page_start,
          p.page_end = paper.page_end,
          p.lang = paper.lang,
          p.doc_type = paper.doc_type

      // 2. 处理作者信息
      FOREACH (author IN paper.authors |
        MERGE (a:Author {id: author.id})
        SET a.name = author.name
        MERGE (a)-[w:WROTE]->(p)
        SET w.organization = author.org
      )

      // 3. 处理会议/期刊信息
      FOREACH (ignore IN CASE WHEN paper.venue IS NOT NULL AND paper.venue <> '' THEN [1] ELSE [] END |
        MERGE (v:Venue {name: paper.venue})
        MERGE (p)-[:PUBLISHED_IN]->(v)
      )
    `;

    try {
      const result = await session.run(query, { batch });
      this.stats.papers += batch.length;
      
      if (this.stats.papers % 10000 === 0) {
        console.log(`📊 已处理 ${this.stats.papers} 篇论文...`);
      }
    } catch (error) {
      console.error('处理论文批次时出错:', error);
      // 可以选择跳过错误继续处理，或者抛出错误终止
    }
  }

  async processReferenceBatch(batch, session) {
    const query = `
      UNWIND $batch AS ref
      MERGE (source:Paper {id: ref.sourceId})
      MERGE (target:Paper {id: ref.targetId})
      MERGE (source)-[r:CITES]->(target)
      RETURN count(r) AS relationshipsCreated
    `;

    try {
      const result = await session.run(query, { batch });
      const count = result.records[0]?.get('relationshipsCreated').low || 0;
      this.stats.relationships += count;
      
      if (this.stats.relationships % 50000 === 0) {
        console.log(`🔗 已创建 ${this.stats.relationships} 条关系...`);
      }
    } catch (error) {
      console.error('处理引用关系时出错:', error);
    }
  }

  async updateFinalStats(session) {
    // 获取准确的统计信息
    try {
      const statsResult = await session.run(`
        MATCH (a:Author) RETURN count(a) AS authorCount
        UNION ALL
        MATCH (v:Venue) RETURN count(v) AS venueCount
      `);
      
      if (statsResult.records.length >= 2) {
        this.stats.authors = statsResult.records[0].get('authorCount').low;
        this.stats.venues = statsResult.records[1].get('venueCount').low;
      }
    } catch (error) {
      console.warn('获取统计信息时出错:', error.message);
    }
  }

  async createIndexes(session) {
    console.log('🔧 创建索引...');
    
    const indexes = [
      'CREATE INDEX paper_id_index IF NOT EXISTS FOR (p:Paper) ON (p.id)',
      'CREATE INDEX paper_title_index IF NOT EXISTS FOR (p:Paper) ON (p.title)',
      'CREATE INDEX paper_year_index IF NOT EXISTS FOR (p:Paper) ON (p.year)',
      'CREATE INDEX author_id_index IF NOT EXISTS FOR (a:Author) ON (a.id)',
      'CREATE INDEX author_name_index IF NOT EXISTS FOR (a:Author) ON (a.name)',
      'CREATE INDEX venue_name_index IF NOT EXISTS FOR (v:Venue) ON (v.name)'
    ];

    for (const indexQuery of indexes) {
      try {
        await session.run(indexQuery);
        console.log(`   ✅ ${indexQuery.split('ON')[0]}...`);
      } catch (error) {
        console.warn(`   创建索引警告: ${error.message}`);
      }
    }
  }
}

// 使用示例
async function main() {
  const importer = new ACMImporter();
  
  // 导入文件
  await importer.importFile('C:\\Users\\Liu Qiwei\\Documents\\ACM-Citation-network-V11.json');
  
  console.log('\n🎉 导入完成！你可以在 Neo4j Browser 中查询数据:');
  console.log('   MATCH (p:Paper) RETURN count(p) AS paperCount');
  console.log('   MATCH ()-[r:CITES]->() RETURN count(r) AS citationCount');
  console.log('   MATCH (p:Paper)-[:PUBLISHED_IN]->(v:Venue) RETURN v.name, count(p) LIMIT 10');
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 运行导入
main().catch(console.error);