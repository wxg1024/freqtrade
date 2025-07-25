// 数据类型定义
export interface CandleData {
  id: number;
  pair: string;
  timeframe: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at: Date;
}

export interface IndicatorData {
  id: number;
  pair: string;
  timeframe: string;
  timestamp: Date;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  macd_histogram: number | null;
  ema_12: number | null;
  ema_26: number | null;
  rsi: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  stoch_k: number | null;
  stoch_d: number | null;
  williams_r: number | null;
  cci: number | null;
  atr: number | null;
  adx: number | null;
  created_at: Date;
}

export interface ScoringData {
  id: number;
  pair: string;
  timestamp: Date;
  timeframe_5m: number;
  timeframe_15m: number;
  timeframe_1h: number;
  timeframe_4h: number;
  timeframe_1d: number;
  total_score: number;
  signal: string;
  created_at: Date;
}

export interface ChartDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  ema_12?: number;
  ema_26?: number;
  rsi?: number;
  // SCORE数据 - 多时间周期
  score_5m?: number;
  score_15m?: number;
  score_1h?: number;
  score_4h?: number;
  score_1d?: number;
  total_score?: number;
  signal?: string;
}

export interface ScoreDataPoint {
  timestamp: string;
  timeframe_5m: number;
  timeframe_15m: number;
  timeframe_1h: number;
  timeframe_4h: number;
  timeframe_1d: number;
  total_score: number;
  signal: string;
}

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  totalPairs: number;
  activeSignals: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  lastUpdate: Date;
}