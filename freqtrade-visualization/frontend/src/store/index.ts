import { create } from 'zustand';
import { CandleData, IndicatorData, ScoringData, DashboardStats, Timeframe } from '../types';

interface AppState {
  // 当前选中的交易对和时间周期
  selectedPair: string;
  selectedTimeframe: Timeframe;
  
  // 数据状态
  candleData: CandleData[];
  indicatorData: IndicatorData[];
  scoringData: ScoringData[];
  dashboardStats: DashboardStats | null;
  tradingPairs: string[];
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  setSelectedPair: (pair: string) => void;
  setSelectedTimeframe: (timeframe: Timeframe) => void;
  setCandleData: (data: CandleData[]) => void;
  setIndicatorData: (data: IndicatorData[]) => void;
  setScoringData: (data: ScoringData[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setTradingPairs: (pairs: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (connected: boolean) => void;
  
  // 添加新数据（实时更新）
  addCandleData: (data: CandleData) => void;
  addIndicatorData: (data: IndicatorData) => void;
  addScoringData: (data: ScoringData) => void;
  
  // 重置状态
  reset: () => void;
}

const initialState = {
  selectedPair: 'BTC/USDT',
  selectedTimeframe: '1h' as Timeframe,
  candleData: [],
  indicatorData: [],
  scoringData: [],
  dashboardStats: null,
  tradingPairs: [],
  isLoading: false,
  error: null,
  isConnected: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  
  setSelectedPair: (pair: string) => set({ selectedPair: pair }),
  
  setSelectedTimeframe: (timeframe: Timeframe) => set({ selectedTimeframe: timeframe }),
  
  setCandleData: (data: CandleData[]) => set({ candleData: data }),
  
  setIndicatorData: (data: IndicatorData[]) => set({ indicatorData: data }),
  
  setScoringData: (data: ScoringData[]) => set({ scoringData: data }),
  
  setDashboardStats: (stats: DashboardStats) => set({ dashboardStats: stats }),
  
  setTradingPairs: (pairs: string[]) => set({ tradingPairs: pairs }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setConnected: (connected: boolean) => set({ isConnected: connected }),
  
  setConnectionStatus: (connected: boolean) => set({ isConnected: connected }),
  
  addCandleData: (data: CandleData) => {
    const { candleData, selectedPair, selectedTimeframe } = get();
    
    // 只添加当前选中交易对和时间周期的数据
    if (data.pair === selectedPair && data.timeframe === selectedTimeframe) {
      const newData = [...candleData, data]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-200); // 保持最新的200条数据
      
      set({ candleData: newData });
    }
  },
  
  addIndicatorData: (data: IndicatorData) => {
    const { indicatorData, selectedPair, selectedTimeframe } = get();
    
    if (data.pair === selectedPair && data.timeframe === selectedTimeframe) {
      const newData = [...indicatorData, data]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-200);
      
      set({ indicatorData: newData });
    }
  },
  
  addScoringData: (data: ScoringData) => {
    const { scoringData, selectedPair } = get();
    
    if (data.pair === selectedPair) {
      const newData = [...scoringData, data]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-100);
      
      set({ scoringData: newData });
    }
  },
  
  reset: () => set(initialState),
}));

// 选择器函数
export const selectCandleData = (state: AppState) => state.candleData;
export const selectIndicatorData = (state: AppState) => state.indicatorData;
export const selectScoringData = (state: AppState) => state.scoringData;
export const selectDashboardStats = (state: AppState) => state.dashboardStats;
export const selectSelectedPair = (state: AppState) => state.selectedPair;
export const selectSelectedTimeframe = (state: AppState) => state.selectedTimeframe;
export const selectIsLoading = (state: AppState) => state.isLoading;
export const selectError = (state: AppState) => state.error;
export const selectIsConnected = (state: AppState) => state.isConnected;
export const selectTradingPairs = (state: AppState) => state.tradingPairs;