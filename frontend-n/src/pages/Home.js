// frontend/src/pages/Home.js
import React, { useState } from 'react';
import { searchPapers, getStatistics } from '../services/api';
import { Input, Button, Card, Row, Col, Statistic, Spin, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await searchPapers(searchQuery);
      setSearchResults(response.data.papers);
    } catch (error) {
      console.error('搜索失败:', error);
      setError('搜索失败，请检查后端服务是否正常运行');
    }
    setLoading(false);
  };

  // 加载统计信息
  React.useEffect(() => {
    getStatistics()
      .then(response => {
        setStats(response.data);
      })
      .catch(error => {
        console.error('获取统计信息失败:', error);
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>学术知识图谱系统</h1>
      
      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '20px' }} />
      )}

      {/* 搜索框 */}
      <Input.Search
        placeholder="输入论文关键词，如：security, database, 人工智能..."
        enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
        size="large"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onSearch={handleSearch}
        style={{ marginBottom: '20px' }}
        disabled={loading}
      />

      {loading && <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />}

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={6}>
            <Statistic title="总论文数" value={stats.papers} />
          </Col>
          <Col span={6}>
            <Statistic title="总作者数" value={stats.authors} />
          </Col>
          <Col span={6}>
            <Statistic title="总引用数" value={stats.citations} />
          </Col>
          <Col span={6}>
            <Statistic title="会议/期刊数" value={stats.venues} />
          </Col>
        </Row>
      )}

      {/* 搜索结果 */}
      <div>
        {searchResults.map(paper => (
          <Card 
            key={paper.id} 
            style={{ marginBottom: '16px', borderRadius: '8px' }}
            hoverable
          >
            <h3 style={{ color: '#1890ff', marginBottom: '8px' }}>{paper.title}</h3>
            <p style={{ color: '#666', marginBottom: '8px' }}>
              <strong>年份:</strong> {paper.year || '未知'} | 
              <strong> 引用数:</strong> {paper.n_citation || 0}
              {paper.venue && <span> | <strong>会议:</strong> {paper.venue}</span>}
            </p>
            {paper.abstract && (
              <p style={{ color: '#333' }}>
                {paper.abstract.length > 200 ? paper.abstract.substring(0, 200) + '...' : paper.abstract}
              </p>
            )}
          </Card>
        ))}
      </div>

      {searchResults.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <SearchOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>请输入关键词搜索论文，如：security, database, machine learning</p>
        </div>
      )}
    </div>
  );
};

export default Home;