import axios from 'axios';
import { processPaperData, processStatisticsData } from '../utils/neo4jUtils';

const API_BASE = 'http://localhost:5000/api';

// 论文搜索
export const searchPapers = async (query, filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('page', page);
    params.append('limit', limit);
    
    // 添加筛选参数
    if (filters.venue) params.append('venue', filters.venue);
    if (filters.yearFrom) params.append('yearFrom', filters.yearFrom);
    if (filters.yearTo) params.append('yearTo', filters.yearTo);
    if (filters.citationsMin) params.append('citationsMin', filters.citationsMin);

    const response = await axios.get(`${API_BASE}/papers/search?${params.toString()}`);
    const processedData = {
      ...response.data,
      papers: response.data.papers.map(processPaperData)
    };
    return { data: processedData };
  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }
};


// 获取论文引用关系
export const getPaperCitations = async (paperId) => {
  try {
    const response = await axios.get(`${API_BASE}/citations/paper/${paperId}`);
    const processedData = {
      references: response.data.references?.map(processPaperData) || [],
      citations: response.data.citations?.map(processPaperData) || []
    };
    return { data: processedData };
  } catch (error) {
    console.error('获取引用关系失败:', error);
    throw error;
  }
};

// 获取统计信息
export const getStatistics = async () => {
  try {
    const response = await axios.get(`${API_BASE}/statistics/overview`);
    return { data: processStatisticsData(response.data) };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    throw error;
  }
};

// 获取会议列表
export const getVenues = async () => {
  try {
    const response = await axios.get(`${API_BASE}/venues`);
    return response;
  } catch (error) {
    console.error('获取会议列表失败:', error);
    throw error;
  }
};

// 添加管理API函数
// 节点管理
export const createNode = async (label, properties) => {
  try {
    const response = await axios.post(`${API_BASE}/admin/nodes`, { label, properties });
    return response.data;
  } catch (error) {
    console.error('创建节点失败:', error);
    throw error;
  }
};

export const updateNode = async (id, properties) => {
  try {
    const response = await axios.put(`${API_BASE}/admin/nodes/${id}`, { properties });
    return response.data;
  } catch (error) {
    console.error('更新节点失败:', error);
    throw error;
  }
};

export const deleteNode = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE}/admin/nodes/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除节点失败:', error);
    throw error;
  }
};

// 关系管理
export const createRelationship = async (fromId, toId, type, properties = {}) => {
  try {
    const response = await axios.post(`${API_BASE}/admin/relationships`, {
      fromId,
      toId,
      type,
      properties
    });
    return response.data;
  } catch (error) {
    console.error('创建关系失败:', error);
    throw error;
  }
};

export const deleteRelationship = async (fromId, toId, type) => {
  try {
    const response = await axios.delete(`${API_BASE}/admin/relationships`, {
      data: { fromId, toId, type }
    });
    return response.data;
  } catch (error) {
    console.error('删除关系失败:', error);
    throw error;
  }
};



// 作者搜索（暂缓）
export const searchAuthors = async (name) => {
  return Promise.resolve({ data: [] });
};