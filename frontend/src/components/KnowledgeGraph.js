import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card, Modal, Spin, Button, Typography, Empty, Alert } from 'antd';
import { UndoOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const KnowledgeGraph = ({ centerNode, onNodeClick, onClose }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // 获取图谱数据
  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo('开始获取数据...');
      try {
        const params = new URLSearchParams();
        if (centerNode?.id) {
          params.append('centerId', centerNode.id);
        }
        params.append('limit', '50');
        params.append('depth', '2');

        const apiUrl = `/api/visualization?${params}`;
        setDebugInfo(`请求URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const graphData = await response.json();
        setDebugInfo(`获取到数据: ${JSON.stringify({
          nodes: graphData.nodes?.length || 0,
          links: graphData.links?.length || 0
        })}`);
        
        // 检查数据是否有效
        if (graphData.nodes && graphData.nodes.length > 0) {
          setData(graphData);
          setHasData(true);
          setDebugInfo('数据有效，开始渲染');
        } else {
          setHasData(false);
          setData({ nodes: [], links: [] });
          setDebugInfo('数据为空');
        }
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
        setDebugInfo(`错误: ${error.message}`);
        setHasData(false);
        setError(`获取图谱数据失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [centerNode]);

  // 绘制力导向图
  useEffect(() => {
    if (data.nodes.length === 0) {
      setDebugInfo('没有节点数据可渲染');
      return;
    }

    setDebugInfo(`开始渲染 ${data.nodes.length} 个节点和 ${data.links.length} 条边`);
    
    const width = containerRef.current?.clientWidth || 800;
    const height = 600;

    // 清除现有内容
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('background', '#fafafa')
      .style('border-radius', '8px')
      .style('border', '1px solid #d9d9d9');

    const g = svg.append('g');

    // 创建箭头标记
    svg.append('defs').selectAll('marker')
      .data(['CITES']) // 只保留CITES关系
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // 节点样式配置
    const nodeConfig = {
  Paper: { color: '#1890ff', size: 10 },
  default: { color: '#722ed1', size: 8 }
};

    // 确保数据格式正确
    const validNodes = data.nodes.filter(node => node && node.id);
    const validLinks = data.links.filter(link => link && link.source && link.target);

    setDebugInfo(`有效节点: ${validNodes.length}, 有效边: ${validLinks.length}`);

    if (validNodes.length === 0) {
      setDebugInfo('没有有效节点数据');
      return;
    }

    // 创建力导向模拟
    const sim = d3.forceSimulation(validNodes)
      .force('link', d3.forceLink(validLinks).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => nodeConfig[d.type]?.size + 5 || 12));

    // 绘制边
    const link = g.append('g')
      .selectAll('line')
      .data(validLinks)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // 绘制节点
    const node = g.append('g')
      .selectAll('g')
      .data(validNodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // 节点圆圈
    node.append('circle')
      .attr('r', d => nodeConfig[d.type]?.size || 8)
      .attr('fill', d => nodeConfig[d.type]?.color || '#722ed1')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // 节点文字
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => {
        const name = d.name || d.properties?.title || d.properties?.name || d.id;
        return name && name.length > 20 ? name.substring(0, 20) + '...' : name;
      });

    // 节点点击事件
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      if (onNodeClick) {
        onNodeClick(d);
      }
    });

    // 力导向图更新
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    setSimulation(sim);
    setDebugInfo('图谱渲染完成');

    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = event.x;
      d.fy = event.y;
    }

    return () => {
      if (sim) sim.stop();
    };
  }, [data]);

  // 重置布局
  const resetLayout = () => {
    if (simulation) {
      simulation.alphaTarget(0.3).restart();
    }
  };

  // 显示调试信息（开发环境）
  const showDebugInfo = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载知识图谱中..." />
        {showDebugInfo && <div style={{ marginTop: 16 }}>{debugInfo}</div>}
      </div>
    );
  }

  if (error) {
    return (
      <Card 
        title="知识图谱可视化" 
        style={{ margin: '20px 0' }}
        extra={onClose && (
          <Button 
            icon={<CloseOutlined />} 
            size="small" 
            type="text" 
            onClick={onClose}
          />
        )}
      >
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
        />
        {showDebugInfo && (
          <div style={{ marginTop: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">调试信息: {debugInfo}</Text>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => window.location.reload()}>
            重新加载页面
          </Button>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card 
        title="知识图谱可视化" 
        style={{ margin: '20px 0' }}
        extra={onClose && (
          <Button 
            icon={<CloseOutlined />} 
            size="small" 
            type="text" 
            onClick={onClose}
          />
        )}
      >
        <Empty
          image={<WarningOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />}
          description={
            <div>
              <div>暂无图谱数据</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                这可能是因为数据库中缺少关系数据
              </Text>
            </div>
          }
        >
          {showDebugInfo && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">调试信息: {debugInfo}</Text>
            </div>
          )}
          <Button type="primary" onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>知识图谱可视化 {centerNode && `- ${centerNode.name}`}</span>
          {onClose && (
            <Button 
              icon={<CloseOutlined />} 
              size="small" 
              type="text" 
              onClick={onClose}
            />
          )}
        </div>
      }
      extra={
        <Button 
          icon={<UndoOutlined />} 
          size="small" 
          onClick={resetLayout}
        >
          重置布局
        </Button>
      }
      style={{ margin: '20px 0' }}
    >
      {showDebugInfo && (
        <Alert
          message="调试信息"
          description={debugInfo}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <div ref={containerRef} style={{ width: '100%', height: '600px' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* 图例 */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#1890ff', borderRadius: '50%', marginRight: '8px' }}></div>
          <Text type="secondary">论文</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', borderRadius: '50%', marginRight: '8px' }}></div>
          <Text type="secondary">作者</Text>
        </div>
      </div>

      {/* 节点详情弹窗 */}
      <Modal
        title={`节点详情 - ${selectedNode?.type}`}
        open={!!selectedNode}
        onCancel={() => setSelectedNode(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedNode(null)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedNode && (
          <div>
            <Title level={5}>{selectedNode.name}</Title>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '6px',
              maxHeight: '300px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(selectedNode.properties, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default KnowledgeGraph;