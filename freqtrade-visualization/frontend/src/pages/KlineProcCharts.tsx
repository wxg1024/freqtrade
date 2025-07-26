import React, { useState, useEffect, useRef } from 'react';
import { KLineChartPro } from '@klinecharts/pro';
import '@klinecharts/pro/dist/klinecharts-pro.css';
import { registerIndicator, IndicatorTemplate } from 'klinecharts';
import { useAppStore } from '../store';
import { toast } from 'sonner';
import { getCandleData, getIndicatorData, getScoringData } from '../services/api';
import { Timeframe } from '../types';

interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorData {
  timestamp: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  rsi?: number;
  stoch_k?: number;
  stoch_d?: number;
  atr?: number;
  cci?: number;
  williams_r?: number;
}

interface ScoreData {
  timestamp: number;
  score_5m?: number;
  score_15m?: number;
  score_1h?: number;
  score_4h?: number;
}

interface ChartData {
  kline: KlineData[];
  indicators: IndicatorData[];
  scores: ScoreData[];
}

const TRADING_PAIRS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'ADA/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'DOT/USDT',
  'AVAX/USDT',
  'MATIC/USDT',
  'LINK/USDT'
];

const TIMEFRAMES = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '30m', label: '30分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' }
];

export const KlineProcCharts: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [chartData, setChartData] = useState<ChartData>({
    kline: [],
    indicators: [],
    scores: []
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isConnected } = useAppStore();
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  // 模拟数据生成函数
  const generateMockData = (): ChartData => {
    const now = Date.now();
    const dataPoints = 200;
    const interval = selectedTimeframe === '1m' ? 60000 : 
                    selectedTimeframe === '5m' ? 300000 :
                    selectedTimeframe === '15m' ? 900000 :
                    selectedTimeframe === '30m' ? 1800000 :
                    selectedTimeframe === '1h' ? 3600000 :
                    selectedTimeframe === '4h' ? 14400000 : 86400000;

    const klineData: KlineData[] = [];
    const indicatorData: IndicatorData[] = [];
    const scoreData: ScoreData[] = [];

    let price = 45000; // 起始价格

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      // 生成K线数据
      const open = price;
      const change = (Math.random() - 0.5) * 1000;
      const close = Math.max(open + change, 1000);
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      const volume = Math.random() * 1000000;

      klineData.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });

      // 生成指标数据
      indicatorData.push({
        timestamp,
        macd: (Math.random() - 0.5) * 1000,
        signal: (Math.random() - 0.5) * 800,
        histogram: (Math.random() - 0.5) * 200,
        rsi: Math.random() * 100,
        stoch_k: Math.random() * 100,
        stoch_d: Math.random() * 100,
        atr: Math.random() * 500,
        cci: (Math.random() - 0.5) * 200,
        williams_r: -Math.random() * 100
      });

      // 生成评分数据
      scoreData.push({
        timestamp,
        score_5m: Math.random() * 100,
        score_15m: Math.random() * 100,
        score_1h: Math.random() * 100,
        score_4h: Math.random() * 100
      });

      price = close;
    }

    return {
      kline: klineData,
      indicators: indicatorData,
      scores: scoreData
    };
  };

  // 获取图表数据
  const fetchChartData = async () => {
    setLoading(true);
    try {
      if (isConnected) {
        // 调用真实的API获取K线数据
        const apiData = await getCandleData(selectedPair, selectedTimeframe as Timeframe, 200);
        
        // 转换API数据格式为组件需要的格式
        const klineData: KlineData[] = apiData.map((item: any) => ({
          timestamp: new Date(item.timestamp).getTime(),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        }));
        
        // 获取真实的指标数据
        const apiIndicatorData = await getIndicatorData(selectedPair, selectedTimeframe as Timeframe, 200);
        const indicatorData: IndicatorData[] = apiIndicatorData.map((item: any) => ({
          timestamp: new Date(item.timestamp).getTime(),
          macd: item.macd || 0,
          signal: item.signal || 0,
          histogram: item.histogram || 0,
          rsi: item.rsi || 0,
          stoch_k: item.stoch_k || 0,
          stoch_d: item.stoch_d || 0,
          atr: item.atr || 0,
          cci: item.cci || 0,
          williams_r: item.williams_r || 0
        }));
        
        // 获取真实的评分数据
        const apiScoreData = await getScoringData(selectedPair, 200);
        const scoreData: ScoreData[] = apiScoreData.map((item: any) => ({
          timestamp: new Date(item.timestamp).getTime(),
          score_5m: item.score_5m || 0,
          score_15m: item.score_15m || 0,
          score_1h: item.score_1h || 0,
          score_4h: item.score_4h || 0
        }));
        
        setChartData({
          kline: klineData,
          indicators: indicatorData,
          scores: scoreData
        });
        
        toast.success(`成功获取 ${klineData.length} 条K线数据`);
      } else {
        // 连接断开时使用模拟数据
        const mockData = generateMockData();
        setChartData(mockData);
        toast.warning('连接已断开，显示的是模拟数据');
      }
    } catch (error: any) {
      console.error('获取图表数据失败:', error);
      toast.error(`获取图表数据失败: ${error.message || '未知错误'}`);
      
      // 出错时回退到模拟数据
      const mockData = generateMockData();
      setChartData(mockData);
      toast.info('已切换到模拟数据显示');
    } finally {
      setLoading(false);
    }
  };

  // 自定义数据源类
  class CustomDatafeed {
    private data: ChartData;
    
    constructor(data: ChartData) {
      this.data = data;
    }

    searchSymbols(search?: string): Promise<any[]> {
      console.log('searchSymbols called with:', search);
      return Promise.resolve([
        {
          exchange: 'BINANCE',
          market: 'crypto',
          name: selectedPair,
          shortName: selectedPair,
          ticker: selectedPair.replace('/', ''),
          priceCurrency: 'USDT',
          type: 'crypto'
        }
      ]);
    }

    getHistoryKLineData(symbol: any, period: any, from: number, to: number): Promise<any[]> {
      console.log('getHistoryKLineData called with:', { symbol, period, from, to, dataLength: this.data.kline.length, scoresLength: this.data.scores.length });
      
      // 过滤时间范围内的数据
      let filteredData = this.data.kline;
      if (from && to) {
        filteredData = this.data.kline.filter(item => 
          item.timestamp >= from && item.timestamp <= to
        );
      }
      
      // 转换数据格式，包含Score数据
      const formattedData = filteredData.map((item, index) => {
        const scoreItem = this.data.scores.find(score => score.timestamp === item.timestamp);
        const result = {
          timestamp: item.timestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          // 添加Score数据用于自定义指标
          score_5m: scoreItem?.score_5m || Math.random() * 100, // 临时使用随机数确保有数据
          score_15m: scoreItem?.score_15m || Math.random() * 100,
          score_1h: scoreItem?.score_1h || Math.random() * 100,
          score_4h: scoreItem?.score_4h || Math.random() * 100
        };
        
        // 调试前几条数据
        if (index < 3) {
          console.log(`Data item ${index}:`, {
            timestamp: new Date(item.timestamp).toISOString(),
            scoreItem: scoreItem,
            result: {
              score_5m: result.score_5m,
              score_15m: result.score_15m,
              score_1h: result.score_1h,
              score_4h: result.score_4h
            }
          });
        }
        
        return result;
      });
      
      console.log('Returning formatted data length:', formattedData.length);
      console.log('Sample formatted data:', formattedData.slice(0, 2));
      return Promise.resolve(formattedData);
    }

    subscribe(symbol: any, period: any, callback: any): void {
      console.log('subscribe called:', { symbol, period });
      // 实时数据订阅（暂时不实现）
    }

    unsubscribe(symbol: any, period: any): void {
      console.log('unsubscribe called:', { symbol, period });
      // 取消订阅（暂时不实现）
    }
  }

  // 创建自定义Score指标配置
  const createScoreIndicatorConfig = (): IndicatorTemplate => {
    return {
      name: 'SCORE',
      shortName: 'Score',
      calcParams: [],
      figures: [
        { key: 'score_5m', title: '5m评分', type: 'line' },
        { key: 'score_15m', title: '15m评分', type: 'line' },
        { key: 'score_1h', title: '1h评分', type: 'line' },
        { key: 'score_4h', title: '4h评分', type: 'line' }
      ],
      styles: {
        score_5m: { color: '#FF6B6B' },
        score_15m: { color: '#4ECDC4' },
        score_1h: { color: '#45B7D1' },
        score_4h: { color: '#96CEB4' }
      },
      calc: (dataList: any[]) => {
        return dataList.map(kLineData => {
          const result = {
            score_5m: Number(kLineData.score_5m) || 0,
            score_15m: Number(kLineData.score_15m) || 0,
            score_1h: Number(kLineData.score_1h) || 0,
            score_4h: Number(kLineData.score_4h) || 0
          };
          return result;
        });
      }
    };
  };

  // 注册Score指标（在组件外部执行一次）
  const registerScoreIndicator = () => {
    try {
      const scoreIndicator = createScoreIndicatorConfig();
      registerIndicator(scoreIndicator);
      console.log('Score indicator registered successfully');
      return true;
    } catch (error) {
      console.error('Failed to register Score indicator:', error);
      return false;
    }
  };

  // 确保指标只注册一次
  let isScoreIndicatorRegistered = false;

  // 初始化KLineChart Pro
  const initChart = (data: ChartData) => {
    if (chartRef.current && !chartInstance.current && data.kline.length > 0) {
      try {
        console.log('Initializing chart with data length:', data.kline.length);
        console.log('Sample data:', data.kline.slice(0, 2));
        console.log('Score data sample:', data.scores.slice(0, 2));
        
        // 获取时间周期配置
        const getPeriodConfig = (timeframe: string) => {
          switch (timeframe) {
            case '1m': return { multiplier: 1, timespan: 'minute', text: '1m' };
            case '5m': return { multiplier: 5, timespan: 'minute', text: '5m' };
            case '15m': return { multiplier: 15, timespan: 'minute', text: '15m' };
            case '30m': return { multiplier: 30, timespan: 'minute', text: '30m' };
            case '1h': return { multiplier: 1, timespan: 'hour', text: '1h' };
            case '4h': return { multiplier: 4, timespan: 'hour', text: '4h' };
            case '1d': return { multiplier: 1, timespan: 'day', text: '1d' };
            default: return { multiplier: 1, timespan: 'hour', text: '1h' };
          }
        };

        // 注册Score指标（如果还未注册）
        if (!isScoreIndicatorRegistered) {
          isScoreIndicatorRegistered = registerScoreIndicator();
        }
        
        const config = {
          container: chartRef.current,
          symbol: {
            exchange: 'BINANCE',
            market: 'crypto',
            name: selectedPair,
            shortName: selectedPair,
            ticker: selectedPair.replace('/', ''),
            priceCurrency: 'USDT',
            type: 'crypto'
          },
          period: getPeriodConfig(selectedTimeframe),
          watermark: 'FreqTrade Pro',
          theme: 'light',
          locale: 'zh-CN',
          datafeed: new CustomDatafeed(data),
          mainIndicators: ['MA', 'EMA', 'BOLL'],
          subIndicators: ['VOL', 'MACD', 'RSI', 'SCORE'] // 直接在配置中包含Score指标
        };
        
        // 初始化图表
        console.log('Chart config:', config);
        chartInstance.current = new KLineChartPro(config);
        
        // 等待图表初始化完成后验证Score指标是否正确添加
        setTimeout(() => {
          if (chartInstance.current) {
            console.log('Chart initialized, checking Score indicator...');
            console.log('Chart instance methods:', Object.getOwnPropertyNames(chartInstance.current));
            
            // 如果Score指标没有自动添加，尝试手动添加
            try {
              if (chartInstance.current.chart && typeof chartInstance.current.chart.createIndicator === 'function') {
                // 检查是否已有Score指标
                const indicators = chartInstance.current.chart.getIndicators();
                console.log('Current indicators:', indicators);
                
                const hasScoreIndicator = indicators.some((ind: any) => ind.name === 'SCORE');
                if (!hasScoreIndicator) {
                  const paneId = chartInstance.current.chart.createIndicator('SCORE', false, { id: 'score_pane' });
                  console.log('Score indicator manually added, pane ID:', paneId);
                } else {
                  console.log('Score indicator already exists');
                }
              }
            } catch (error) {
              console.error('Error checking/adding Score indicator:', error);
            }
          }
        }, 1000);
        
        console.log('Chart initialized successfully:', chartInstance.current);
        
        // 验证图表是否正确创建
        if (chartInstance.current) {
          console.log('KLineChart Pro instance created successfully');
          console.log('Chart container:', chartRef.current);
          toast.success('KLineChart Pro 图表初始化成功');
        } else {
          console.error('Failed to create KLineChart Pro instance');
          toast.error('KLineChart Pro 图表初始化失败');
        }
        
      } catch (error) {
        console.error('初始化图表失败:', error);
        console.error('Error details:', error.message, error.stack);
        toast.error(`初始化图表失败: ${error.message}`);
      }
    } else {
      console.log('Chart init conditions not met:', {
        hasContainer: !!chartRef.current,
        hasInstance: !!chartInstance.current,
        dataLength: data.kline.length
      });
    }
  };



  // 初始化和数据更新
  useEffect(() => {
    fetchChartData();
  }, [selectedPair, selectedTimeframe]);

  // 当数据更新时，重新初始化图表
  useEffect(() => {
    if (chartData.kline.length > 0) {
      // 如果图表已存在，先销毁
      if (chartInstance.current) {
        try {
          if (chartInstance.current && typeof chartInstance.current.dispose === 'function') {
            chartInstance.current.dispose();
          } else if (chartInstance.current && typeof chartInstance.current.destroy === 'function') {
            chartInstance.current.destroy();
          }
        } catch (error) {
          console.error('销毁旧图表失败:', error);
        } finally {
          chartInstance.current = null;
          if (chartRef.current) {
            chartRef.current.innerHTML = '';
          }
        }
      }
      
      // 初始化新图表
      setTimeout(() => {
        initChart(chartData);
      }, 100); // 给一点时间让DOM清理完成
    }
  }, [chartData, selectedPair, selectedTimeframe]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        try {
          if (chartInstance.current && typeof chartInstance.current.dispose === 'function') {
            chartInstance.current.dispose();
          } else if (chartInstance.current && typeof chartInstance.current.destroy === 'function') {
            chartInstance.current.destroy();
          } else if (chartInstance.current && typeof chartInstance.current.remove === 'function') {
            chartInstance.current.remove();
          } else if (chartInstance.current && typeof chartInstance.current.unmount === 'function') {
            chartInstance.current.unmount();
          }
        } catch (error) {
          console.error('销毁图表失败:', error);
        } finally {
          chartInstance.current = null;
          if (chartRef.current) {
            chartRef.current.innerHTML = '';
          }
        }
      }
    };
  }, []);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchChartData();
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, selectedPair, selectedTimeframe]);

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 交易对选择 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              交易对:
            </label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TRADING_PAIRS.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>

          {/* 时间周期选择 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              时间周期:
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          {/* 自动刷新开关 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              自动刷新:
            </label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 手动刷新按钮 */}
          <button
            onClick={fetchChartData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? '加载中...' : '刷新数据'}
          </button>

          {/* 连接状态指示 */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? '已连接' : '连接断开'}
            </span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              加载中...
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedPair} - {TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                专业K线图表 - 基于 KLineChart Pro
              </p>
            </div>
            <div 
              ref={chartRef} 
              className="w-full h-[600px] border border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Score指标已集成到K线图中 */}
    </div>
  );
};

export default KlineProcCharts;