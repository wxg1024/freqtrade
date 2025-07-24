import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store';
import { PairSelector } from '../components/PairSelector';
import { CandlestickChart } from '../components/CandlestickChart';
import { IndicatorChart } from '../components/IndicatorChart';
import { ScoringChart } from '../components/ScoringChart';
import { getCandleData, getIndicatorData, getScoringData, getTradingPairs } from '../services/api';
import websocketService from '../services/websocket';
import { ChartDataPoint, ScoreDataPoint } from '../types';
import { toast } from 'sonner';

export const Charts: React.FC = () => {
  const {
    selectedPair,
    selectedTimeframe,
    candleData,
    indicatorData,
    scoringData,
    tradingPairs,
    isLoading,
    error,
    setSelectedPair,
    setSelectedTimeframe,
    setCandleData,
    setIndicatorData,
    setScoringData,
    setTradingPairs,
    setLoading,
    setError,
    addCandleData,
    addIndicatorData,
    addScoringData,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'candles' | 'macd' | 'rsi' | 'scoring'>('candles');
  const [latestScores, setLatestScores] = useState<{ [pair: string]: number }>({});

  // 合并K线和指标数据
  const chartData: ChartDataPoint[] = useMemo(() => {
    const candleMap = new Map(candleData.map(candle => [
      new Date(candle.timestamp).getTime(),
      {
        timestamp: new Date(candle.timestamp).toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      }
    ]));

    const indicatorMap = new Map(indicatorData.map(indicator => [
      new Date(indicator.timestamp).getTime(),
      {
        macd: indicator.macd,
        macd_signal: indicator.macd_signal,
        macd_hist: indicator.macd_hist,
        ema_12: indicator.ema_12,
        ema_26: indicator.ema_26,
        rsi: indicator.rsi,
      }
    ]));

    const combined: ChartDataPoint[] = [];
    
    candleMap.forEach((candle, timestamp) => {
      const indicator = indicatorMap.get(timestamp);
      combined.push({
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        macd: indicator?.macd,
        macd_signal: indicator?.macd_signal,
        macd_hist: indicator?.macd_hist,
        ema_12: indicator?.ema_12,
        ema_26: indicator?.ema_26,
        rsi: indicator?.rsi,
      });
    });

    return combined.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [candleData, indicatorData]);

  // 转换评分数据
  const scoreChartData: ScoreDataPoint[] = useMemo(() => {
    return scoringData.map(score => ({
      timestamp: score.timestamp,
      timeframe_5m: score.timeframe_5m,
      timeframe_15m: score.timeframe_15m,
      timeframe_1h: score.timeframe_1h,
      timeframe_4h: score.timeframe_4h,
      timeframe_1d: score.timeframe_1d,
      total_score: score.total_score,
      signal: score.signal,
    }));
  }, [scoringData]);

  // 加载图表数据
  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [candles, indicators, scores] = await Promise.all([
        getCandleData(selectedPair, selectedTimeframe, 200),
        getIndicatorData(selectedPair, selectedTimeframe, 200),
        getScoringData(selectedPair, 100),
      ]);
      
      setCandleData(candles);
      setIndicatorData(indicators);
      setScoringData(scores);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载图表数据失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 加载交易对列表
  const loadTradingPairs = async () => {
    try {
      const pairs = await getTradingPairs();
      setTradingPairs(pairs);
    } catch (err) {
      console.error('加载交易对失败:', err);
    }
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChartData();
    setRefreshing(false);
    toast.success('图表数据已刷新');
  };

  // 处理交易对变化
  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    // 重新订阅WebSocket数据
    websocketService.unsubscribeAll();
    websocketService.subscribeToPair(pair);
  };

  // 处理时间周期变化
  const handleTimeframeChange = (timeframe: any) => {
    setSelectedTimeframe(timeframe);
  };

  // 初始化
  useEffect(() => {
    loadTradingPairs();
    
    // 设置WebSocket监听
    websocketService.onNewCandleData(addCandleData);
    websocketService.onNewIndicatorData(addIndicatorData);
    websocketService.onNewScoringData(addScoringData);
    
    // 订阅当前交易对
    websocketService.subscribeToPair(selectedPair);
    
    return () => {
      websocketService.unsubscribeAll();
    };
  }, []);

  // 当选中的交易对或时间周期变化时重新加载数据
  useEffect(() => {
    loadChartData();
  }, [selectedPair, selectedTimeframe]);

  const tabs = [
    { id: 'candles', label: 'K线图', icon: BarChart3 },
    { id: 'macd', label: 'MACD', icon: TrendingUp },
    { id: 'rsi', label: 'RSI', icon: TrendingDown },
    { id: 'scoring', label: '评分系统', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            图表分析
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            K线图表和技术指标分析
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {/* 交易对和时间周期选择器 */}
      <PairSelector
        pairs={tradingPairs}
        selectedPair={selectedPair}
        selectedTimeframe={selectedTimeframe}
        onPairChange={handlePairChange}
        onTimeframeChange={handleTimeframeChange}
        latestScores={latestScores}
      />

      {/* 标签页导航 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 图表内容区域 */}
        <div className="p-6">
          {isLoading && chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">加载图表数据...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button
                    onClick={loadChartData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 当前选中交易对信息 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedPair}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    时间周期: {selectedTimeframe} | 数据点: {chartData.length}
                  </p>
                </div>
                
                {chartData.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">最新价格</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {chartData[chartData.length - 1]?.close?.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {/* 图表内容 */}
              {activeTab === 'candles' && (
                <CandlestickChart
                  data={chartData}
                  height={500}
                  showVolume={true}
                  showEMA={true}
                />
              )}
              
              {activeTab === 'macd' && (
                <IndicatorChart
                  data={chartData}
                  type="macd"
                  height={400}
                />
              )}
              
              {activeTab === 'rsi' && (
                <IndicatorChart
                  data={chartData}
                  type="rsi"
                  height={300}
                />
              )}
              
              {activeTab === 'scoring' && (
                <div className="space-y-6">
                  <ScoringChart
                    data={scoreChartData}
                    type="trend"
                    height={300}
                  />
                  <ScoringChart
                    data={scoreChartData}
                    type="breakdown"
                    height={400}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;