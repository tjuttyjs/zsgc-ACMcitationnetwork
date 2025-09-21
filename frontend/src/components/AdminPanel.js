import React, { useState } from 'react';
import { Modal, Form, Input, Button, Select, message, Card, Tabs, List, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { createNode, updateNode, deleteNode, createRelationship, deleteRelationship } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const AdminPanel = ({ visible, onClose, onRefresh }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('createNode');
  const [loading, setLoading] = useState(false);

  // 创建节点
  const handleCreateNode = async (values) => {
    setLoading(true);
    try {
      await createNode(values.label, JSON.parse(values.properties));
      message.success('节点创建成功');
      form.resetFields();
      onRefresh();
    } catch (error) {
      message.error('创建节点失败');
    }
    setLoading(false);
  };

  // 更新节点
  const handleUpdateNode = async (values) => {
    setLoading(true);
    try {
      await updateNode(values.nodeId, JSON.parse(values.properties));
      message.success('节点更新成功');
      form.resetFields();
      onRefresh();
    } catch (error) {
      message.error('更新节点失败');
    }
    setLoading(false);
  };

  // 删除节点
  const handleDeleteNode = async (values) => {
    setLoading(true);
    try {
      await deleteNode(values.nodeId);
      message.success('节点删除成功');
      form.resetFields();
      onRefresh();
    } catch (error) {
      message.error('删除节点失败');
    }
    setLoading(false);
  };

  // 创建关系
  const handleCreateRelationship = async (values) => {
    setLoading(true);
    try {
      await createRelationship(values.fromId, values.toId, values.relType);
      message.success('关系创建成功');
      form.resetFields();
      onRefresh();
    } catch (error) {
      message.error('创建关系失败');
    }
    setLoading(false);
  };

  // 删除关系
  const handleDeleteRelationship = async (values) => {
    setLoading(true);
    try {
      await deleteRelationship(values.fromId, values.toId, values.relType);
      message.success('关系删除成功');
      form.resetFields();
      onRefresh();
    } catch (error) {
      message.error('删除关系失败');
    }
    setLoading(false);
  };

  return (
    <Modal
      title="知识图谱管理面板"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 创建节点 */}
        <TabPane tab="创建节点" key="createNode">
          <Form form={form} onFinish={handleCreateNode} layout="vertical">
            <Form.Item name="label" label="节点标签" rules={[{ required: true }]}>
              <Select placeholder="选择节点类型">
                <Option value="Paper">论文</Option>
                <Option value="Author">作者</Option>
                <Option value="Venue">会议/期刊</Option>
              </Select>
            </Form.Item>
            <Form.Item name="properties" label="属性（JSON格式）" rules={[{ required: true }]}>
              <Input.TextArea
                placeholder='{"id": "unique-id", "title": "节点标题", "year": 2023}'
                rows={6}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
              创建节点
            </Button>
          </Form>
        </TabPane>

        {/* 更新节点 */}
        <TabPane tab="更新节点" key="updateNode">
          <Form form={form} onFinish={handleUpdateNode} layout="vertical">
            <Form.Item name="nodeId" label="节点ID" rules={[{ required: true }]}>
              <Input placeholder="输入要更新的节点ID" />
            </Form.Item>
            <Form.Item name="properties" label="新属性（JSON格式）" rules={[{ required: true }]}>
              <Input.TextArea
                placeholder='{"title": "新标题", "year": 2024}'
                rows={6}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
              更新节点
            </Button>
          </Form>
        </TabPane>

        {/* 删除节点 */}
        <TabPane tab="删除节点" key="deleteNode">
          <Form form={form} onFinish={handleDeleteNode} layout="vertical">
            <Form.Item name="nodeId" label="节点ID" rules={[{ required: true }]}>
              <Input placeholder="输入要删除的节点ID" />
            </Form.Item>
            <Button type="danger" htmlType="submit" loading={loading} icon={<DeleteOutlined />}>
              删除节点
            </Button>
          </Form>
        </TabPane>

        {/* 创建关系 */}
        <TabPane tab="创建关系" key="createRelationship">
          <Form form={form} onFinish={handleCreateRelationship} layout="vertical">
            <Form.Item name="fromId" label="起始节点ID" rules={[{ required: true }]}>
              <Input placeholder="起始节点ID" />
            </Form.Item>
            <Form.Item name="toId" label="目标节点ID" rules={[{ required: true }]}>
              <Input placeholder="目标节点ID" />
            </Form.Item>
            <Form.Item name="relType" label="关系类型" rules={[{ required: true }]}>
              <Select placeholder="选择关系类型">
                <Option value="CITES">引用</Option>
                <Option value="WROTE">撰写</Option>
                <Option value="PUBLISHED_IN">发表于</Option>
              </Select>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
              创建关系
            </Button>
          </Form>
        </TabPane>

        {/* 删除关系 */}
        <TabPane tab="删除关系" key="deleteRelationship">
          <Form form={form} onFinish={handleDeleteRelationship} layout="vertical">
            <Form.Item name="fromId" label="起始节点ID" rules={[{ required: true }]}>
              <Input placeholder="起始节点ID" />
            </Form.Item>
            <Form.Item name="toId" label="目标节点ID" rules={[{ required: true }]}>
              <Input placeholder="目标节点ID" />
            </Form.Item>
            <Form.Item name="relType" label="关系类型" rules={[{ required: true }]}>
              <Select placeholder="选择关系类型">
                <Option value="CITES">引用</Option>
                <Option value="WROTE">撰写</Option>
                <Option value="PUBLISHED_IN">发表于</Option>
              </Select>
            </Form.Item>
            <Button type="danger" htmlType="submit" loading={loading} icon={<DeleteOutlined />}>
              删除关系
            </Button>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AdminPanel;