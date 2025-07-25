import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ComposedChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
  ReferenceLine,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { ChartDataPoint } from '../types';
import { TrendingUp, TrendingDown, BarChart3, Settings, Maximize2, GripHorizontal } from 'lucide-react';

interface TradingChartProps {
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
  candleType: 'candle' | 'line';
  theme: 'light' | 'dark';
}

// 标准蜡烛线组件
const CandleBar: React.FC<any> = (props) => {
  const { payload, x, y, width, height, yAxisMap, dataKey } = props;
  
  if (!payload || typeof payload.open !== 'number' || typeof payload.high !== 'number' || 
      typeof payload.low !== 'number' || typeof payload.close !== 'number') {
    return null;
  }
  
  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#00C851' : '#FF4444';
  
  // 获取Y轴比例尺
  const yAxis = yAxisMap && yAxisMap['price'];
  if (!yAxis) return null;
  
  // 计算Y坐标位置
  const highY = yAxis.scale(high);
  const lowY = yAxis.scale(low);
  const openY = yAxis.scale(open);
  const closeY = yAxis.scale(close);
  
  // 实体的上下边界
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  
  // 蜡烛线宽度设置
  const candleWidth = Math.max(width * 0.6, 2);
  const wickWidth = Math.max(1, width * 0.1);
  const centerX = x + width / 2;
  const bodyX = centerX - candleWidth / 2;
  
  return (
    <g>
      {/* 上影线 */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={bodyTop}
        stroke={color}
        strokeWidth={wickWidth}
      />
      
      {/* 下影线 */}
      <line
        x1={centerX}
        y1={bodyBottom}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={wickWidth}
      />
      
      {/* 蜡烛实体 */}
      <rect
        x={bodyX}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={isGreen ? color : '#FFFFFF'}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// 自定义工具提示
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {format(new Date(label), 'yyyy-MM-dd HH:mm:ss')}
        </p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              开盘: <span className="font-medium text-gray-900 dark:text-gray-100">{data.open?.toFixed(6)}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              最高: <span className="font-medium text-green-600">{data.high?.toFixed(6)}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              最低: <span className="font-medium text-red-600">{data.low?.toFixed(6)}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              收盘: <span className="font-medium text-gray-900 dark:text-gray-100">{data.close?.toFixed(6)}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              成交量: <span className="font-medium">{data.volume?.toLocaleString()}</span>
            </p>
            {data.ema_12 && (
              <p className="text-blue-600 dark:text-blue-400">
                EMA12: <span className="font-medium">{data.ema_12.toFixed(6)}</span>
              </p>
            )}
            {data.ema_26 && (
              <p className="text-purple-600 dark:text-purple-400">
                EMA26: <span className="font-medium">{data.ema_26.toFixed(6)}</span>
              </p>
            )}
            {data.rsi && (
              <p className="text-orange-600 dark:text-orange-400">
                RSI: <span className="font-medium">{data.rsi.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
        {data.macd && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <p className="text-blue-600">
                MACD: <span className="font-medium">{data.macd.toFixed(6)}</span>
              </p>
              <p className="text-red-600">
                Signal: <span className="font-medium">{data.macd_signal?.toFixed(6)}</span>
              </p>
              <p className="text-green-600">
                Hist: <span className="font-medium">{data.macd_hist?.toFixed(6)}</span>
              </p>
            </div>
          </div>
        )}
        {(data.score_5m || data.score_15m || data.score_1h || data.score_4h || data.total_score) && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.score_5m && (
                <p className="text-blue-600">
                  5分钟: <span className="font-medium">{data.score_5m.toFixed(1)}</span>
                </p>
              )}
              {data.score_15m && (
                <p className="text-green-600">
                  15分钟: <span className="font-medium">{data.score_15m.toFixed(1)}</span>
                </p>
              )}
              {data.score_1h && (
                <p className="text-orange-600">
                  1小时: <span className="font-medium">{data.score_1h.toFixed(1)}</span>
                </p>
              )}
              {data.score_4h && (
                <p className="text-red-600">
                  4小时: <span className="font-medium">{data.score_4h.toFixed(1)}</span>
                </p>
              )}
              {data.total_score && (
                <p className="text-purple-600">
                  总分: <span className="font-medium">{data.total_score.toFixed(1)}</span>
                </p>
              )}
              {data.signal && (
                <p className="text-gray-600 dark:text-gray-400">
                  信号: <span className="font-medium">{data.signal}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

// 拖拽分隔条组件
const DragHandle: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}> = ({ onMouseDown, className = '' }) => {
  return (
    <div
      className={`group relative flex items-center justify-center h-2 cursor-row-resize hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${className}`}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-center w-full h-full">
        <GripHorizontal className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="absolute inset-0 bg-transparent hover:bg-blue-200 dark:hover:bg-blue-800 opacity-50 transition-colors" />
    </div>
  );
};

export const TradingChart: React.FC<TradingChartProps> = ({
  data,
  height = 800,
  showVolume = true,
  showIndicators = true,
  autoUpdate = true,
  pair = 'BTC/USDT',
}) => {
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
    candleType: 'candle',
    theme: 'light',
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [chartHeights, setChartHeights] = useState({
    main: height * 0.4,
    volume: height * 0.12,
    macd: height * 0.16,
    rsi: height * 0.12,
    score: height * 0.2,
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragChart = useRef<string>('');
  const initialHeight = useRef(0);
  
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).getTime(),
    }));
  }, [data]);
  
  // 计算图表高度分配
  const mainChartHeight = fullscreenChart === 'main' ? window.innerHeight - 200 : chartHeights.main;
  const volumeHeight = fullscreenChart === 'volume' ? window.innerHeight - 200 : (settings.showVolume ? chartHeights.volume : 0);
  const macdHeight = fullscreenChart === 'macd' ? window.innerHeight - 200 : (settings.showMACD ? chartHeights.macd : 0);
  const rsiHeight = fullscreenChart === 'rsi' ? window.innerHeight - 200 : (settings.showRSI ? chartHeights.rsi : 0);
  const scoreHeight = fullscreenChart === 'score' ? window.innerHeight - 200 : (settings.showScore ? chartHeights.score : 0);
  
  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 单个图表全屏切换
  const toggleChartFullscreen = (chartType: string) => {
    if (fullscreenChart === chartType) {
      setFullscreenChart(null);
    } else {
      setFullscreenChart(chartType);
    }
  };

  // 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent, chartType: string) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragChart.current = chartType;
    initialHeight.current = chartHeights[chartType as keyof typeof chartHeights];
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chartHeights]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaY = e.clientY - dragStartY.current;
    const newHeight = Math.max(100, initialHeight.current + deltaY);
    
    setChartHeights(prev => ({
      ...prev,
      [dragChart.current]: newHeight,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragChart.current = '';
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // 清理事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
  
  const latestData = chartData[chartData.length - 1];
  const prevData = chartData[chartData.length - 2];
  const priceChange = latestData && prevData ? latestData.close - prevData.close : 0;
  const priceChangePercent = prevData ? (priceChange / prevData.close) * 100 : 0;
  
  return (
    <div 
      ref={chartRef}
      className={`w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* 图表头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pair}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">5分钟K线</p>
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
                  <p className="font-medium">{Math.max(...chartData.map(d => d.high)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h最低</p>
                  <p className="font-medium">{Math.min(...chartData.map(d => d.low)).toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500">24h成交量</p>
                  <p className="font-medium">{chartData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">数据点</p>
                  <p className="font-medium">{chartData.length}</p>
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
      
      {/* 图表区域 - AICoin风格统一时间轴 */}
      <div className="p-4">
        <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* 主K线图 */}
          <div 
            className={`relative border-b border-gray-200 dark:border-gray-600 ${fullscreenChart === 'main' ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl' : ''}`}
            onDoubleClick={() => toggleChartFullscreen('main')}
          >
            <div className="absolute top-2 left-4 z-10">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">价格 {fullscreenChart === 'main' ? '(双击退出全屏)' : '(双击全屏)'}</span>
            </div>
            <ResponsiveContainer width="100%" height={mainChartHeight}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  domain={[(dataMin: number) => Math.max(0, dataMin * 0.999), (dataMax: number) => dataMax * 1.001]}
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(value) => {
                    if (value >= 100000) return value.toFixed(0);
                    if (value >= 1000) return value.toFixed(2);
                    if (value >= 1) return value.toFixed(4);
                    return value.toFixed(6);
                  }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* K线图 */}
                <Bar
                  yAxisId="price"
                  dataKey="open"
                  shape={(props: any) => <CandleBar {...props} />}
                  fill="transparent"
                />
                
                {/* EMA线 */}
                {settings.showEMA12 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema_12"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                )}
                {settings.showEMA26 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema_26"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                )}
                
                {/* SCORE线条已移至独立的SCORE图表中，不在价格图表上显示 */}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* 主图表拖拽分隔条 */}
          {!fullscreenChart && settings.showVolume && (
            <DragHandle onMouseDown={(e) => handleMouseDown(e, 'main')} />
          )}
          
          {/* 成交量图表 */}
          {settings.showVolume && (
            <div 
              className={`relative border-b border-gray-200 dark:border-gray-600 ${fullscreenChart === 'volume' ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl' : ''}`}
              onDoubleClick={() => toggleChartFullscreen('volume')}
            >
              <div className="absolute top-2 left-4 z-10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">成交量 {fullscreenChart === 'volume' ? '(双击退出全屏)' : '(双击全屏)'}</span>
              </div>
              <ResponsiveContainer width="100%" height={volumeHeight}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={10}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value.toFixed(0);
                    }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), '成交量']}
                    labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
                  />
                  <Bar
                    yAxisId="volume"
                    dataKey="volume"
                    fill="#6b7280"
                    opacity={0.6}
                  />
                </ComposedChart>
            </ResponsiveContainer>
          </div>
          )}
          
          {/* 成交量图表拖拽分隔条 */}
          {!fullscreenChart && settings.showVolume && settings.showMACD && (
            <DragHandle onMouseDown={(e) => handleMouseDown(e, 'volume')} />
          )}
          
          {/* MACD指标 */}
          {settings.showMACD && (
            <div 
              className={`relative border-b border-gray-200 dark:border-gray-600 ${fullscreenChart === 'macd' ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl' : ''}`}
              onDoubleClick={() => toggleChartFullscreen('macd')}
            >
              <div className="absolute top-2 left-4 z-10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">MACD {fullscreenChart === 'macd' ? '(双击退出全屏)' : '(双击全屏)'}</span>
              </div>
              <ResponsiveContainer width="100%" height={macdHeight}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    yAxisId="macd"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={10}
                    tickFormatter={(value) => value.toFixed(4)}
                    width={50}
                  />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
                    formatter={(value: number, name: string) => [
                      value?.toFixed(4) || 'N/A',
                      name === 'macd' ? 'MACD' : name === 'macd_signal' ? 'Signal' : 'Histogram'
                    ]}
                  />
                  <ReferenceLine yAxisId="macd" y={0} stroke="#6b7280" strokeDasharray="2 2" />
                  <Line
                    yAxisId="macd"
                    type="monotone"
                    dataKey="macd"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="macd"
                    type="monotone"
                    dataKey="macd_signal"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Bar
                    yAxisId="macd"
                    dataKey="macd_hist"
                    fill="#6b7280"
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* MACD图表拖拽分隔条 */}
          {!fullscreenChart && settings.showMACD && settings.showRSI && (
            <DragHandle onMouseDown={(e) => handleMouseDown(e, 'macd')} />
          )}
          
          {/* RSI指标 */}
          {settings.showRSI && (
            <div 
              className={`relative border-b border-gray-200 dark:border-gray-600 ${fullscreenChart === 'rsi' ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl' : ''}`}
              onDoubleClick={() => toggleChartFullscreen('rsi')}
            >
              <div className="absolute top-2 left-4 z-10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">RSI {fullscreenChart === 'rsi' ? '(双击退出全屏)' : '(双击全屏)'}</span>
              </div>
              <ResponsiveContainer width="100%" height={rsiHeight}>
                <LineChart data={chartData} margin={{ top: 10, right: 60, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    yAxisId="rsi"
                    orientation="right"
                    domain={[0, 100]}
                    stroke="#6b7280"
                    fontSize={10}
                    width={50}
                  />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
                    formatter={(value: number) => [value?.toFixed(2) || 'N/A', 'RSI']}
                  />
                  
                  {/* RSI超买超卖线 */}
                  <ReferenceLine yAxisId="rsi" y={70} stroke="#ef4444" strokeDasharray="2 2" label="超买" />
                  <ReferenceLine yAxisId="rsi" y={30} stroke="#10b981" strokeDasharray="2 2" label="超卖" />
                  <ReferenceLine yAxisId="rsi" y={50} stroke="#6b7280" strokeDasharray="1 1" opacity={0.5} />
                  
                  <Line
                    yAxisId="rsi"
                    type="monotone"
                    dataKey="rsi"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* RSI图表拖拽分隔条 */}
          {!fullscreenChart && settings.showRSI && settings.showScore && (
            <DragHandle onMouseDown={(e) => handleMouseDown(e, 'rsi')} />
          )}
          
          {/* SCORE指标图表 */}
          {settings.showScore && (
            <div 
              className={`relative border-b border-gray-200 dark:border-gray-600 ${fullscreenChart === 'score' ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl' : ''}`}
              onDoubleClick={() => toggleChartFullscreen('score')}
            >
              <div className="absolute top-2 left-4 z-10">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">SCORE指标 {fullscreenChart === 'score' ? '(双击退出全屏)' : '(双击全屏)'}</span>
              </div>
              <div className="absolute top-2 right-4 z-10 flex space-x-2">
                <span className="text-xs text-blue-600">●5m</span>
                <span className="text-xs text-green-600">●15m</span>
                <span className="text-xs text-orange-600">●1h</span>
                <span className="text-xs text-red-600">●4h</span>
                <span className="text-xs text-purple-600">●总分</span>
              </div>
              <ResponsiveContainer width="100%" height={scoreHeight}>
                <LineChart data={chartData} margin={{ top: 10, right: 60, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    yAxisId="score"
                    orientation="right"
                    domain={[-5, 5]}
                    stroke="#6b7280"
                    fontSize={10}
                    width={50}
                    tickFormatter={(value) => value.toFixed(0)}
                  />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
                    formatter={(value: number, name: string) => {
                      const nameMap: { [key: string]: string } = {
                        'score_5m': '5分钟',
                        'score_15m': '15分钟',
                        'score_1h': '1小时',
                        'score_4h': '4小时',
                        'total_score': '总分'
                      };
                      return [value?.toFixed(1) || 'N/A', nameMap[name] || name];
                    }}
                  />
                  
                  {/* SCORE参考线 */}
                  <ReferenceLine yAxisId="score" y={80} stroke="#10b981" strokeDasharray="2 2" label="强买" />
                  <ReferenceLine yAxisId="score" y={20} stroke="#3b82f6" strokeDasharray="2 2" label="买入" />
                  <ReferenceLine yAxisId="score" y={0} stroke="#6b7280" strokeDasharray="1 1" label="中性" />
                  <ReferenceLine yAxisId="score" y={-20} stroke="#f59e0b" strokeDasharray="2 2" label="卖出" />
                  <ReferenceLine yAxisId="score" y={-80} stroke="#ef4444" strokeDasharray="2 2" label="强卖" />
                  
                  {/* 多时间周期SCORE线条 */}
                  {settings.showScore5m && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="score_5m"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {settings.showScore15m && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="score_15m"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {settings.showScore1h && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="score_1h"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {settings.showScore4h && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="score_4h"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="total_score"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* 统一时间轴 - 只在最底部显示 */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={60}>
              <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 60, bottom: 20 }}>
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => format(new Date(value), 'MM-dd HH:mm')}
                  stroke="#6b7280"
                  fontSize={11}
                  axisLine={true}
                  tickLine={true}
                />
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="#8884d8"
                  tickFormatter={(value) => format(new Date(value), 'MM-dd')}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;