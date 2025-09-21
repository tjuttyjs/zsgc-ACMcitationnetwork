import React from 'react';
import { Card, Button, List, Spin, Alert, Typography } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PaperDetail = ({ paper, citations, onBack, loading, onViewGraph }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p>加载引用关系...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 操作按钮组 */}
      <div style={{ marginBottom: 24, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={onBack} 
          type="primary"
        >
          返回搜索结果
        </Button>
        <Button 
          icon={<EyeOutlined />}
          onClick={() => onViewGraph && onViewGraph(paper)}
          type="default"
        >
          查看知识图谱
        </Button>
      </div>

      {/* 论文详情 */}
      <Card 
        style={{ marginBottom: 24, borderRadius: 8 }}
        actions={[
          <div key="citations">
            <StarOutlined /> 被引: {citations.citations.length}
          </div>,
          <div key="references">
            <FileTextOutlined /> 参考文献: {citations.references.length}
          </div>
        ]}
      >
        <Title level={2} style={{ color: '#1890ff', marginBottom: 16 }}>
          {paper.title}
        </Title>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>年份: </Text>
          <Text>{paper.year || '未知'}</Text>
          <Text strong style={{ marginLeft: 24 }}>引用数: </Text>
          <Text>{paper.n_citation || 0}</Text>
          {paper.venue && (
            <>
              <Text strong style={{ marginLeft: 24 }}>会议/期刊: </Text>
              <Text>{paper.venue}</Text>
            </>
          )}
        </div>

        {paper.abstract && (
          <div>
            <Title level={4}>摘要</Title>
            <Text>{paper.abstract}</Text>
          </div>
        )}
      </Card>

      {/* 引用关系 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* 参考文献 */}
        <Card 
          title={`参考文献 (${citations.references.length})`} 
          style={{ flex: 1, minWidth: 300, borderRadius: 8 }}
          extra={
            citations.references.length > 0 && (
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  const firstRef = citations.references[0];
                  if (firstRef && onViewGraph) {
                    onViewGraph({
                      id: firstRef.id,
                      title: firstRef.title,
                      type: 'Paper'
                    });
                  }
                }}
              >
                查看图谱
              </Button>
            )
          }
        >
          {citations.references.length > 0 ? (
            <List
              dataSource={citations.references}
              renderItem={ref => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewGraph && onViewGraph({
                        id: ref.id,
                        title: ref.title,
                        type: 'Paper'
                      })}
                    >
                      图谱
                    </Button>
                  ]}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff', cursor: 'pointer' }}>
                      {ref.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      年份: {ref.year || '未知'} | 引用数: {ref.n_citation || 0}
                      {ref.venue && ` | ${ref.venue}`}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
              <FileTextOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>暂无参考文献</div>
            </div>
          )}
        </Card>

        {/* 被引情况 */}
        <Card 
          title={`被引用情况 (${citations.citations.length})`} 
          style={{ flex: 1, minWidth: 300, borderRadius: 8 }}
          extra={
            citations.citations.length > 0 && (
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  const firstCite = citations.citations[0];
                  if (firstCite && onViewGraph) {
                    onViewGraph({
                      id: firstCite.id,
                      title: firstCite.title,
                      type: 'Paper'
                    });
                  }
                }}
              >
                查看图谱
              </Button>
            )
          }
        >
          {citations.citations.length > 0 ? (
            <List
              dataSource={citations.citations}
              renderItem={cite => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewGraph && onViewGraph({
                        id: cite.id,
                        title: cite.title,
                        type: 'Paper'
                      })}
                    >
                      图谱
                    </Button>
                  ]}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff', cursor: 'pointer' }}>
                      {cite.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      年份: {cite.year || '未知'} | 引用数: {cite.n_citation || 0}
                      {cite.venue && ` | ${cite.venue}`}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
              <StarOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div>暂无被引用</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaperDetail;