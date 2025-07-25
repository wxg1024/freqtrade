import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Activity, BarChart3, Settings, Wifi, WifiOff } from 'lucide-react';
import TradingViewChart from '../components/TradingViewChart';
import { ChartDataPoint, IndicatorData, ScoringData } from '../types';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: 'candle_update' | 'indicator_update' | 'scoring_update';
  data: any;
}

export const Charts: React.FC = () => {
  const [candleData, setCandleData] = useState<ChartDataPoint[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [scoringData, setScoringData] = useState<ScoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // 可用的交易对和时间周期
  const availablePairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'DOT/USDT'];
  const availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  
  // 合并数据函数
  const mergeChartData = useCallback((candles: ChartDataPoint[], indicators: IndicatorData[], scoring: ScoringData[]) => {
    // 确保参数都是数组类型
    const safeCandles = Array.isArray(candles) ? candles : [];
    const safeIndicators = Array.isArray(indicators) ? indicators : [];
    const safeScoring = Array.isArray(scoring) ? scoring : [];
    
    const indicatorMap = new Map(safeIndicators.map(ind => [ind.timestamp.toString(), ind]));
    const scoringMap = new Map(safeScoring.map(score => [score.timestamp.toString(), score]));
    
    return safeCandles.map(candle => {
      const indicator = indicatorMap.get(candle.timestamp.toString());
      const score = scoringMap.get(candle.timestamp.toString());
      
      return {
        ...candle,
        // 技术指标数据
        ema_12: indicator?.ema_12,
        ema_26: indicator?.ema_26,
        macd: indicator?.macd,
        macd_signal: indicator?.macd_signal,
        macd_hist: indicator?.macd_histogram,
        rsi: indicator?.rsi,
        bb_upper: indicator?.bb_upper,
        bb_middle: indicator?.bb_middle,
        bb_lower: indicator?.bb_lower,
        stoch_k: indicator?.stoch_k,
        stoch_d: indicator?.stoch_d,
        williams_r: indicator?.williams_r,
        cci: indicator?.cci,
        atr: indicator?.atr,
        adx: indicator?.adx,
        // SCORE数据 - 多时间周期
        score_5m: score?.timeframe_5m,
        score_15m: score?.timeframe_15m,
        score_1h: score?.timeframe_1h,
        score_4h: score?.timeframe_4h,
        score_1d: score?.timeframe_1d,
        total_score: score?.total_score,
        signal: score?.signal,
      };
    });
  }, []);
  
  // 获取数据函数
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [candleResponse, indicatorResponse, scoringResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/candles?pair=${encodeURIComponent(selectedPair)}&timeframe=${selectedTimeframe}&limit=500`),
        fetch(`http://localhost:3001/api/indicators?pair=${encodeURIComponent(selectedPair)}&timeframe=${selectedTimeframe}&limit=500`),
        fetch(`http://localhost:3001/api/scoring/trends?pair=${encodeURIComponent(selectedPair)}&days=30`)
      ]);
      
      if (!candleResponse.ok || !indicatorResponse.ok || !scoringResponse.ok) {
        throw new Error('获取数据失败');
      }
      
      const [candlesResult, indicatorsResult, scoringResult] = await Promise.all([
        candleResponse.json(),
        indicatorResponse.json(),
        scoringResponse.json()
      ]);
      
      // 提取数据并确保格式正确
      const candles = candlesResult?.data || candlesResult || [];
      const indicators = indicatorsResult?.data || indicatorsResult || [];
      const scoring = scoringResult?.data || scoringResult || [];
      
      const safeCandles = Array.isArray(candles) ? candles : [];
      const safeIndicators = Array.isArray(indicators) ? indicators : [];
      const safeScoring = Array.isArray(scoring) ? scoring : [];
      
      setCandleData(safeCandles);
      setIndicatorData(safeIndicators);
      setScoringData(safeScoring);
      setLastUpdate(new Date());
      
      toast.success(`数据更新成功 - ${candles.length} 条K线数据`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedPair, selectedTimeframe]);
  
  // 定期轮询数据更新（替代WebSocket）
  useEffect(() => {
    let pollTimer: NodeJS.Timeout;
    
    if (autoRefresh) {
      // 设置定期轮询，每30秒刷新一次数据
      pollTimer = setInterval(() => {
        console.log('定期轮询更新数据...');
        fetchData();
        setLastUpdate(new Date());
      }, 30000); // 30秒间隔
      
      console.log('已启用定期数据轮询（30秒间隔）');
      setIsConnected(true); // 模拟连接状态
    } else {
      setIsConnected(false);
    }
    
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [selectedPair, selectedTimeframe, autoRefresh, fetchData]);
  
  // 初始数据加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 处理交易对变化
  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    toast.info(`切换到 ${pair}`);
  };
  
  // 处理时间周期变化
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    toast.info(`切换到 ${timeframe} 周期`);
  };
  
  // 手动刷新
  const handleRefresh = () => {
    fetchData();
  };
  
  // 切换自动刷新
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    toast.info(autoRefresh ? '已关闭自动刷新' : '已开启自动刷新');
  };
  
  // 合并后的图表数据
  const chartData = mergeChartData(candleData, indicatorData, scoringData);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  专业交易图表
                </h1>
              </div>
              
              {/* 连接状态指示器 */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">实时连接</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">连接断开</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 交易对选择 */}
              <select
                value={selectedPair}
                onChange={(e) => handlePairChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availablePairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              
              {/* 时间周期选择 */}
              <select
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableTimeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
              
              {/* 自动刷新切换 */}
              <button
                onClick={toggleAutoRefresh}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-1" />
                {autoRefresh ? '自动' : '手动'}
              </button>
              
              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 统计信息栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">数据点数</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {chartData.length.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">最新价格</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {chartData.length > 0 ? chartData[chartData.length - 1].close.toFixed(6) : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">24h最高</p>
              <p className="text-lg font-semibold text-green-600">
                {chartData.length > 0 ? Math.max(...chartData.map(d => d.high)).toFixed(6) : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">24h最低</p>
              <p className="text-lg font-semibold text-red-600">
                {chartData.length > 0 ? Math.min(...chartData.map(d => d.low)).toFixed(6) : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">总成交量</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.volume, 0).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">最后更新</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  数据加载错误
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading && chartData.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">正在加载交易数据...</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {selectedPair} - {selectedTimeframe}
              </p>
            </div>
          </div>
        ) : (
          <TradingViewChart
            data={chartData}
            height={800}
            showVolume={true}
            showIndicators={true}
            autoUpdate={autoRefresh}
            pair={selectedPair}
          />
        )}
      </div>
    </div>
  );
};