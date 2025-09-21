import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Alert, 
  Typography, 
  message, 
  Tag 
} from 'antd';
import { 
  SearchOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  StarOutlined, 
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { searchPapers, getStatistics, getPaperCitations, getVenues } from '../services/api';
import SearchResults from '../components/SearchResults';
import PaperDetail from '../components/PaperDetail';
import AdminPanel from '../components/AdminPanel';
import AdvancedFilter from '../components/AdvancedFilter';
import KnowledgeGraph from '../components/KnowledgeGraph';

const { Title } = Typography;

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('search');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [paperCitations, setPaperCitations] = useState({ references: [], citations: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  const [venues, setVenues] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [showGraph, setShowGraph] = useState(false);
  const [graphCenterNode, setGraphCenterNode] = useState(null);

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      message.info('请输入搜索关键词或设置筛选条件');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await searchPapers(searchQuery, filters, page, pagination.limit);
      setSearchResults(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('搜索失败:', error);
      setError('搜索失败，请检查后端服务是否正常运行');
    }
    setLoading(false);
  };

  const handleFilterSearch = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    handleSearch(1);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    handleSearch(page);
  };

  const handleViewPaperDetail = async (paper) => {
    setDetailLoading(true);
    setSelectedPaper(paper);
    try {
      const response = await getPaperCitations(paper.id);
      setPaperCitations(response.data);
      setCurrentView('detail');
      setShowGraph(false); // 进入详情页时关闭图谱
    } catch (error) {
      console.error('获取引用关系失败:', error);
      setError('获取引用关系失败');
    }
    setDetailLoading(false);
  };

  const handleBackToSearch = () => {
    setCurrentView('search');
    setSelectedPaper(null);
    setPaperCitations({ references: [], citations: [] });
    setShowGraph(false); // 返回搜索时关闭图谱
  };

  // 打开知识图谱
  const handleOpenGraph = (paper = null) => {
    if (paper) {
      setGraphCenterNode({
        id: paper.id,
        name: paper.title,
        type: 'Paper'
      });
    } else {
      setGraphCenterNode(null);
    }
    setShowGraph(true);
    setCurrentView('graph');
  };

  // 处理图谱节点点击
  const handleGraphNodeClick = (node) => {
    if (node.type === 'Paper') {
      // 如果是论文节点，查找并显示详情
      const paper = searchResults.find(p => p.id === node.id);
      if (paper) {
        handleViewPaperDetail(paper);
      } else {
        // 如果不在当前搜索结果中，可以尝试搜索该论文
        message.info(`正在加载论文: ${node.name}`);
        // 这里可以添加加载特定论文的逻辑
      }
    } else if (node.type === 'Author') {
      message.info(`作者: ${node.name}`);
      // 可以添加跳转到作者页面的逻辑
    } else if (node.type === 'Venue') {
      message.info(`会议/期刊: ${node.name}`);
      // 可以添加跳转到会议页面的逻辑
    }
  };

  useEffect(() => {
    // 获取统计信息
    getStatistics()
      .then(response => {
        setStats(response.data);
      })
      .catch(error => {
        console.error('获取统计信息失败:', error);
      });

    // 获取会议列表
    getVenues()
      .then(data => {
        setVenues(data.map(venue => ({ id: venue, name: venue })));
      })
      .catch(error => {
        console.error('获取会议列表失败:', error);
      });
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      
      <Button 
        type="dashed" 
        onClick={() => setAdminVisible(true)}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}
      >
        管理面板
      </Button>

      <AdminPanel
        visible={adminVisible}
        onClose={() => setAdminVisible(false)}
        onRefresh={() => {
          if (currentView === 'detail') {
            handleViewPaperDetail(selectedPaper);
          }
        }}
      />

      <Title level={1} style={{ textAlign: 'center', marginBottom: 32, color: '#1890ff' }}>
        📚 学术知识图谱系统
      </Title>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: 24 }} />
      )}

      {currentView === 'detail' ? (
        <PaperDetail
          paper={selectedPaper}
          citations={paperCitations}
          onBack={handleBackToSearch}
          loading={detailLoading}
          onViewGraph={() => handleOpenGraph(selectedPaper)}
        />
      ) : currentView === 'graph' ? (
        <KnowledgeGraph
          centerNode={graphCenterNode}
          onNodeClick={handleGraphNodeClick}
          onClose={() => {
            setShowGraph(false);
            setCurrentView('search');
          }}
        />
      ) : (
        <>
          {/* 搜索框 */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Input.Search
              placeholder="输入论文关键词，如：security, database, 人工智能..."
              enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => handleSearch(1)}
              style={{ maxWidth: '600px', margin: '0 auto' }}
              disabled={loading}
            />
          </div>

          {/* 可视化入口 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={() => handleOpenGraph()}
              style={{ marginRight: 16 }}
            >
              探索知识图谱
            </Button>
            <Button 
              type="default"
              onClick={() => {
                if (searchResults.length > 0) {
                  handleOpenGraph(searchResults[0]);
                } else {
                  message.info('请先搜索一些论文再查看图谱');
                }
              }}
            >
              从搜索结果查看图谱
            </Button>
          </div>

          {/* 高级筛选 */}
          <AdvancedFilter
            venues={venues}
            onSearch={handleFilterSearch}
            initialValues={filters}
          />

          {/* 筛选状态显示 */}
          {Object.keys(filters).length > 0 && (
            <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f8ff', borderRadius: 6 }}>
              <FilterOutlined style={{ marginRight: 8 }} />
              <span>当前筛选: </span>
              {filters.venue && <Tag color="blue">会议: {filters.venue}</Tag>}
              {filters.yearFrom && filters.yearTo && (
                <Tag color="green">年份: {filters.yearFrom}-{filters.yearTo}</Tag>
              )}
              {filters.citationsMin && <Tag color="orange">最小引用: {filters.citationsMin}</Tag>}
              <Button 
                type="link" 
                size="small" 
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                清除筛选
              </Button>
            </div>
          )}

          {/* 统计信息 */}
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="总论文数" 
                  value={stats.papers} 
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="总作者数" 
                  value={stats.authors} 
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="总引用数" 
                  value={stats.citations} 
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="会议/期刊数" 
                  value={stats.venues} 
                  prefix={<DatabaseOutlined />}
                />
              </Col>
            </Row>
          )}

          {/* 搜索结果 */}
          <SearchResults
            results={searchResults}
            onPaperClick={handleViewPaperDetail}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewGraph={handleOpenGraph}
          />
        </>
      )}
    </div>
  );
};

export default Home;