import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  Time,
  CandlestickData,
  LineData,
  HistogramData,
  CandlestickSeries,
  LineSeries,
  HistogramSeries
} from 'lightweight-charts';
import { format } from 'date-fns';
import { ChartDataPoint } from '../types';
import { Settings, Maximize2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface TradingViewChartProps {
  data: ChartDataPoint[];
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  autoUpdate?: boolean;
  pair?: string;
}

interface ChartSettings {
  showEMA12: boolean;
  showEMA26: boolean;
  showMACD: boolean;
  showRSI: boolean;
  showVolume: boolean;
  showScore: boolean;
  showScore5m: boolean;
  showScore15m: boolean;
  showScore1h: boolean;
  showScore4h: boolean;
  theme: 'light' | 'dark';
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  height = 800,
  showVolume = true,
  showIndicators = true,
  autoUpdate = true,
  pair = 'BTC/USDT',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const scoreChartRef = useRef<IChartApi | null>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const scoreContainerRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<ChartSettings>({
    showEMA12: true,
    showEMA26: true,
    showMACD: true,
    showRSI: true,
    showVolume: true,
    showScore: true,
    showScore5m: true,
    showScore15m: true,
    showScore1h: true,
    showScore4h: true,
    theme: 'light',
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  
  // 转换数据格式
  const convertToCandlestickData = useCallback((data: ChartDataPoint[]): CandlestickData[] => {
    return data.map(item => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
  }, []);
  
  const convertToVolumeData = useCallback((data: ChartDataPoint[]): HistogramData[] => {
    return data.map(item => ({
      time: (new Date(item.timestamp).getTime() / 1000) as Time,
      value: item.volume,
      color: item.close >= item.open ? '#26a69a' : '#ef5350',
    }));
  }, []);
  
  const convertToLineData = useCallback((data: ChartDataPoint[], key: keyof ChartDataPoint): LineData[] => {
    return data
      .filter(item => item[key] !== undefined && item[key] !== null)
      .map(item => ({
        time: (new Date(item.timestamp).getTime() / 1000) as Time,
        value: item[key] as number,
      }));
  }, []);
  
  // 初始化主图表
  const initializeMainChart = useCallback(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: Math.floor(height * 0.6),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    chartRef.current = chart;
    
    // 添加K线系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });
    candlestickSeriesRef.current = candlestickSeries;
    
    // 添加成交量系列
    if (settings.showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      volumeSeriesRef.current = volumeSeries;
      
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }
    
    // 添加EMA线
    if (settings.showEMA12) {
      const ema12Series = chart.addSeries(LineSeries, {
        color: '#2196f3',
        lineWidth: 2,
        title: 'EMA12',
      });
      ema12SeriesRef.current = ema12Series;
    }
    
    if (settings.showEMA26) {
      const ema26Series = chart.addSeries(LineSeries, {
        color: '#9c27b0',
        lineWidth: 2,
        title: 'EMA26',
      });
      ema26SeriesRef.current = ema26Series;
    }
    
    return chart;
  }, [height, settings]);
  
  // MACD系列引用
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  // 初始化MACD图表
  const initializeMACDChart = useCallback(() => {
    if (!macdContainerRef.current || !settings.showMACD) return;
    
    const chart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: Math.floor(height * 0.15),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: false,
      },
    });
    
    macdChartRef.current = chart;
    
    // 添加MACD线
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 2,
      title: 'MACD',
    });
    macdSeriesRef.current = macdSeries;
    
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: 'Signal',
    });
    macdSignalSeriesRef.current = signalSeries;
    
    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      title: 'Histogram',
    });
    macdHistogramSeriesRef.current = histogramSeries;
    
    return { chart, macdSeries, signalSeries, histogramSeries };
  }, [height, settings]);
  
  // RSI系列引用
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // 初始化RSI图表
  const initializeRSIChart = useCallback(() => {
    if (!rsiContainerRef.current || !settings.showRSI) return;
    
    const chart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: Math.floor(height * 0.12),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        visible: false,
      },
    });
    
    rsiChartRef.current = chart;
    
    // 添加RSI线
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: 'RSI',
    });
    rsiSeriesRef.current = rsiSeries;
    
    return { chart, rsiSeries };
  }, [height, settings]);
  
  // SCORE系列引用
  const scoreSeriesRefs = useRef<{
    score5m?: ISeriesApi<'Line'>;
    score15m?: ISeriesApi<'Line'>;
    score1h?: ISeriesApi<'Line'>;
    score4h?: ISeriesApi<'Line'>;
    totalScore?: ISeriesApi<'Line'>;
  }>({});
  
  // 初始化SCORE图表
  const initializeScoreChart = useCallback(() => {
    if (!scoreContainerRef.current || !settings.showScore) return;
    
    const chart = createChart(scoreContainerRef.current, {
      width: scoreContainerRef.current.clientWidth,
      height: Math.floor(height * 0.13),
      layout: {
        background: { color: settings.theme === 'dark' ? '#1f2937' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
        horzLines: { color: settings.theme === 'dark' ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: settings.theme === 'dark' ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    scoreChartRef.current = chart;
    
    const series: any = {};
    
    if (settings.showScore5m) {
      const score5mSeries = chart.addSeries(LineSeries, {
        color: '#2196f3',
        lineWidth: 2,
        title: '5m',
      });
      series.score5m = score5mSeries;
      scoreSeriesRefs.current.score5m = score5mSeries;
    }
    
    if (settings.showScore15m) {
      const score15mSeries = chart.addSeries(LineSeries, {
        color: '#4caf50',
        lineWidth: 2,
        title: '15m',
      });
      series.score15m = score15mSeries;
      scoreSeriesRefs.current.score15m = score15mSeries;
    }
    
    if (settings.showScore1h) {
      const score1hSeries = chart.addSeries(LineSeries, {
        color: '#ff9800',
        lineWidth: 2,
        title: '1h',
      });
      series.score1h = score1hSeries;
      scoreSeriesRefs.current.score1h = score1hSeries;
    }
    
    if (settings.showScore4h) {
      const score4hSeries = chart.addSeries(LineSeries, {
        color: '#f44336',
        lineWidth: 2,
        title: '4h',
      });
      series.score4h = score4hSeries;
      scoreSeriesRefs.current.score4h = score4hSeries;
    }
    
    const totalScoreSeries = chart.addSeries(LineSeries, {
      color: '#9c27b0',
      lineWidth: 3,
      title: 'Total',
    });
    series.totalScore = totalScoreSeries;
    scoreSeriesRefs.current.totalScore = totalScoreSeries;
    
    return { chart, series };
  }, [height, settings]);
  
  // 更新图表数据
  const updateChartData = useCallback(() => {
    if (!data || data.length === 0) return;
    
    const candlestickData = convertToCandlestickData(data);
    const volumeData = convertToVolumeData(data);
    
    // 更新主图表数据
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(candlestickData);
    }
    
    if (volumeSeriesRef.current && settings.showVolume) {
      volumeSeriesRef.current.setData(volumeData);
    }
    
    if (ema12SeriesRef.current && settings.showEMA12) {
      const ema12Data = convertToLineData(data, 'ema_12');
      ema12SeriesRef.current.setData(ema12Data);
    }
    
    if (ema26SeriesRef.current && settings.showEMA26) {
      const ema26Data = convertToLineData(data, 'ema_26');
      ema26SeriesRef.current.setData(ema26Data);
    }
    
    // 更新MACD数据
    if (settings.showMACD) {
      if (macdSeriesRef.current) {
        const macdData = convertToLineData(data, 'macd');
        macdSeriesRef.current.setData(macdData);
      }
      
      if (macdSignalSeriesRef.current) {
        const signalData = convertToLineData(data, 'macd_signal');
        macdSignalSeriesRef.current.setData(signalData);
      }
      
      if (macdHistogramSeriesRef.current) {
        const histData = data
          .filter(item => item.macd_hist !== undefined && item.macd_hist !== null)
          .map(item => ({
            time: (new Date(item.timestamp).getTime() / 1000) as Time,
            value: item.macd_hist as number,
            color: (item.macd_hist as number) >= 0 ? '#26a69a' : '#ef5350',
          }));
        macdHistogramSeriesRef.current.setData(histData);
      }
    }
    
    // 更新RSI数据
    if (settings.showRSI && rsiSeriesRef.current) {
      const rsiData = convertToLineData(data, 'rsi');
      rsiSeriesRef.current.setData(rsiData);
    }
    
    // 更新SCORE数据
    if (settings.showScore) {
      if (settings.showScore5m && scoreSeriesRefs.current.score5m) {
        const score5mData = convertToLineData(data, 'score_5m');
        scoreSeriesRefs.current.score5m.setData(score5mData);
      }
      
      if (settings.showScore15m && scoreSeriesRefs.current.score15m) {
        const score15mData = convertToLineData(data, 'score_15m');
        scoreSeriesRefs.current.score15m.setData(score15mData);
      }
      
      if (settings.showScore1h && scoreSeriesRefs.current.score1h) {
        const score1hData = convertToLineData(data, 'score_1h');
        scoreSeriesRefs.current.score1h.setData(score1hData);
      }
      
      if (settings.showScore4h && scoreSeriesRefs.current.score4h) {
        const score4hData = convertToLineData(data, 'score_4h');
        scoreSeriesRefs.current.score4h.setData(score4hData);
      }
      
      if (scoreSeriesRefs.current.totalScore) {
        const totalScoreData = convertToLineData(data, 'total_score');
        scoreSeriesRefs.current.totalScore.setData(totalScoreData);
      }
    }
  }, [data, settings, convertToCandlestickData, convertToVolumeData, convertToLineData]);
  
  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // 初始化图表
  useEffect(() => {
    initializeMainChart();
    initializeMACDChart();
    initializeRSIChart();
    initializeScoreChart();
    
    return () => {
      chartRef.current?.remove();
      macdChartRef.current?.remove();
      rsiChartRef.current?.remove();
      scoreChartRef.current?.remove();
    };
  }, [initializeMainChart, initializeMACDChart, initializeRSIChart, initializeScoreChart]);
  
  // 更新数据
  useEffect(() => {
    updateChartData();
  }, [updateChartData]);
  
  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
      if (macdChartRef.current && macdContainerRef.current) {
        macdChartRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth,
        });
      }
      if (rsiChartRef.current && rsiContainerRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
        });
      }
      if (scoreChartRef.current && scoreContainerRef.current) {
        scoreChartRef.current.applyOptions({
          width: scoreContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无交易数据</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">请选择交易对并等待数据加载</p>
        </div>
      </div>
    );
  }
  
  const latestData = data[data.length - 1];
  const prevData = data[data.length - 2];
  const priceChange = latestData && prevData ? latestData.close - prevData.close : 0;
  const priceChangePercent = prevData ? (priceChange / prevData.close) * 100 : 0;
  
  return (
    <div className={`w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 图表头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pair}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">TradingView专业图表</p>
          </div>
          
          {latestData && (
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {latestData.close.toFixed(6)}
                </p>
                <p className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">24h最高</p>
                  <p className="font-medium">{Math.max(...data.map(d => d.high)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h最低</p>
                  <p className="font-medium">{Math.min(...data.map(d => d.low)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h成交量</p>
                  <p className="font-medium">{data.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">数据点</p>
                  <p className="font-medium">{data.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* 技术指标 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">技术指标</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showEMA12}
                    onChange={(e) => setSettings(prev => ({ ...prev, showEMA12: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">EMA12</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showEMA26}
                    onChange={(e) => setSettings(prev => ({ ...prev, showEMA26: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">EMA26</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showMACD}
                    onChange={(e) => setSettings(prev => ({ ...prev, showMACD: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">MACD</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showRSI}
                    onChange={(e) => setSettings(prev => ({ ...prev, showRSI: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">RSI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showVolume}
                    onChange={(e) => setSettings(prev => ({ ...prev, showVolume: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">成交量</span>
                </label>
              </div>
            </div>
            
            {/* SCORE指标 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SCORE指标</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">SCORE图表</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore5m}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore5m: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-blue-600">5分钟</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore15m}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore15m: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-green-600">15分钟</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore1h}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore1h: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-orange-600">1小时</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.showScore4h}
                    onChange={(e) => setSettings(prev => ({ ...prev, showScore4h: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-red-600">4小时</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 图表区域 */}
      <div className="p-4 space-y-2">
        {/* 主K线图 */}
        <div className="relative">
          <div className="absolute top-2 left-4 z-10">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
              价格图表 (TradingView)
            </span>
          </div>
          <div ref={chartContainerRef} className="w-full" />
        </div>
        
        {/* MACD图表 */}
        {settings.showMACD && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                MACD
              </span>
            </div>
            <div ref={macdContainerRef} className="w-full" />
          </div>
        )}
        
        {/* RSI图表 */}
        {settings.showRSI && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                RSI
              </span>
            </div>
            <div ref={rsiContainerRef} className="w-full" />
          </div>
        )}
        
        {/* SCORE图表 */}
        {settings.showScore && (
          <div className="relative">
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                SCORE指标
              </span>
            </div>
            <div className="absolute top-2 right-4 z-10 flex space-x-2">
              <span className="text-xs text-blue-600">●5m</span>
              <span className="text-xs text-green-600">●15m</span>
              <span className="text-xs text-orange-600">●1h</span>
              <span className="text-xs text-red-600">●4h</span>
              <span className="text-xs text-purple-600">●总分</span>
            </div>
            <div ref={scoreContainerRef} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;