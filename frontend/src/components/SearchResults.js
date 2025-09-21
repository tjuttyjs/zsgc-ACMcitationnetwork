import React from 'react';
import { Card, List, Empty, Pagination, Button } from 'antd';
import { FileTextOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';

const SearchResults = ({ results, onPaperClick, loading, pagination, onPageChange, onViewGraph }) => {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>搜索中...</div>;
  }

  if (results.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无搜索结果"
      />
    );
  }

  return (
    <div>
      <List
        dataSource={results}
        renderItem={paper => (
          <List.Item>
            <Card
              style={{ width: '100%', cursor: 'pointer', borderRadius: 8 }}
              hoverable
              actions={[
                <Button 
                  key="view-detail" 
                  type="link" 
                  icon={<FileTextOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaperClick(paper);
                  }}
                >
                  查看详情
                </Button>,
                <Button 
                  key="view-graph" 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewGraph && onViewGraph(paper);
                  }}
                >
                  查看图谱
                </Button>
              ]}
              onClick={() => onPaperClick(paper)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#1890ff', marginBottom: 8, marginTop: 0 }}>
                    {paper.title}
                  </h3>
                  <div style={{ color: '#666', marginBottom: 8 }}>
                    <span>年份: {paper.year || '未知'}</span>
                    <span style={{ marginLeft: 16 }}>
                      <StarOutlined /> 引用数: {paper.n_citation || 0}
                    </span>
                    {paper.venue && (
                      <span style={{ marginLeft: 16 }}>
                        <FileTextOutlined /> {paper.venue}
                      </span>
                    )}
                  </div>
                  {paper.abstract && (
                    <p style={{ color: '#333', margin: 0 }}>
                      {paper.abstract.length > 150 ? 
                        paper.abstract.substring(0, 150) + '...' : 
                        paper.abstract
                      }
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
      
      {/* 分页控件 */}
      {pagination.total > pagination.limit && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={onPageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条结果`
            }
          />
        </div>
      )}
    </div>
  );
};

export default SearchResults;