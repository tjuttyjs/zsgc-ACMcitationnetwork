// frontend/src/services/api.js
import axios from 'axios';
import { processPaperData, processStatisticsData } from '../utils/neo4jUtils';

const API_BASE = 'http://localhost:5000/api';

// 论文搜索
export const searchPapers = async (query, page = 1, limit = 20) => {
  try {
    const response = await axios.get(`${API_BASE}/papers/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    // 处理Neo4j数字格式
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

// 系统统计
export const getStatistics = async () => {
  try {
    const response = await axios.get(`${API_BASE}/statistics/overview`);
    // 处理Neo4j数字格式
    return { data: processStatisticsData(response.data) };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    throw error;
  }
};

// 会议列表
export const getVenues = async () => {
  try {
    const response = await axios.get(`${API_BASE}/venues`);
    return response;
  } catch (error) {
    console.error('获取会议列表失败:', error);
    throw error;
  }
};

// 作者搜索（暂时返回空数据）
export const searchAuthors = async (name) => {
  return Promise.resolve({ data: [] });
};

