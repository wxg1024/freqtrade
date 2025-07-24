import axios from 'axios';
import { CandleData, IndicatorData, ScoringData, DashboardStats, ApiResponse, Timeframe } from '../types';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 获取仪表板统计数据
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return response.data.data;
};

// 获取K线数据
export const getCandleData = async (
  pair: string,
  timeframe: Timeframe,
  limit: number = 100
): Promise<CandleData[]> => {
  const response = await api.get<ApiResponse<CandleData[]>>('/candles', {
    params: { pair, timeframe, limit },
  });
  return response.data.data;
};

// 获取指标数据
export const getIndicatorData = async (
  pair: string,
  timeframe: Timeframe,
  limit: number = 100
): Promise<IndicatorData[]> => {
  const response = await api.get<ApiResponse<IndicatorData[]>>('/indicators', {
    params: { pair, timeframe, limit },
  });
  return response.data.data;
};

// 获取评分数据
export const getScoringData = async (
  pair: string,
  limit: number = 100
): Promise<ScoringData[]> => {
  const response = await api.get<ApiResponse<ScoringData[]>>('/scoring', {
    params: { pair, limit },
  });
  return response.data.data;
};

// 获取所有交易对列表
export const getTradingPairs = async (): Promise<string[]> => {
  const response = await api.get<ApiResponse<string[]>>('/pairs');
  return response.data.data;
};

// 获取最新评分数据
export const getLatestScores = async (): Promise<ScoringData[]> => {
  const response = await api.get<ApiResponse<ScoringData[]>>('/scoring/latest');
  return response.data.data;
};

// 获取历史评分趋势
export const getScoreTrends = async (
  pair: string,
  days: number = 7
): Promise<ScoringData[]> => {
  const response = await api.get<ApiResponse<ScoringData[]>>('/scoring/trends', {
    params: { pair, days },
  });
  return response.data.data;
};

export default api;