import React, { useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { ChartDataPoint } from '../types';

interface CandlestickChartProps {
  data: ChartDataPoint[];
  height?: number;
  showVolume?: boolean;
  showEMA?: boolean;
}

// 自定义K线柱状图组件
const CandleBar: React.FC<any> = (props) => {
  const { payload, x, y, width, height } = props;
  
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';
  
  // 计算实体和影线的位置
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);
  
  // 影线宽度
  const wickWidth = 1;
  const wickX = x + width / 2 - wickWidth / 2;
  
  // 实体宽度
  const bodyWidth = Math.max(width * 0.6, 1);
  const bodyX = x + (width - bodyWidth) / 2;
  
  return (
    <g>
      {/* 上影线 */}
      <line
        x1={x + width / 2}
        y1={y + (1 - (high - low) / (high - low)) * height}
        x2={x + width / 2}
        y2={y + (1 - (bodyTop - low) / (high - low)) * height}
        stroke={color}
        strokeWidth={wickWidth}
      />
      
      {/* 下影线 */}
      <line
        x1={x + width / 2}
        y1={y + (1 - (bodyBottom - low) / (high - low)) * height}
        x2={x + width / 2}
        y2={y + (1 - (low - low) / (high - low)) * height}
        stroke={color}
        strokeWidth={wickWidth}
      />
      
      {/* K线实体 */}
      <rect
        x={bodyX}
        y={y + (1 - (bodyTop - low) / (high - low)) * height}
        width={bodyWidth}
        height={Math.max((bodyHeight / (high - low)) * height, 1)}
        fill={isGreen ? color : 'transparent'}
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
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {format(new Date(label), 'yyyy-MM-dd HH:mm')}
        </p>
        <div className="mt-2 space-y-1 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            开盘: <span className="font-medium">{data.open?.toFixed(4)}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            最高: <span className="font-medium">{data.high?.toFixed(4)}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            最低: <span className="font-medium">{data.low?.toFixed(4)}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            收盘: <span className="font-medium">{data.close?.toFixed(4)}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            成交量: <span className="font-medium">{data.volume?.toFixed(2)}</span>
          </p>
          {data.ema_12 && (
            <p className="text-blue-600 dark:text-blue-400">
              EMA12: <span className="font-medium">{data.ema_12.toFixed(4)}</span>
            </p>
          )}
          {data.ema_26 && (
            <p className="text-purple-600 dark:text-purple-400">
              EMA26: <span className="font-medium">{data.ema_26.toFixed(4)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  height = 400,
  showVolume = true,
  showEMA = true,
}) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).getTime(),
    }));
  }, [data]);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">暂无K线数据</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'MM-dd HH:mm')}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            domain={['dataMin - 0.001', 'dataMax + 0.001']}
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(4)}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* K线图 */}
          <Bar
            dataKey="close"
            shape={<CandleBar />}
            fill="transparent"
          />
          
          {/* EMA线 */}
          {showEMA && (
            <>
              <Line
                type="monotone"
                dataKey="ema_12"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="ema_26"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 成交量图表 */}
      {showVolume && (
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => format(new Date(value), 'MM-dd')}
              stroke="#6b7280"
              fontSize={10}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toFixed(0);
              }}
            />
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString(),
                '成交量'
              ]}
              labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
            />
            <Bar
              dataKey="volume"
              fill="#6b7280"
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CandlestickChart;