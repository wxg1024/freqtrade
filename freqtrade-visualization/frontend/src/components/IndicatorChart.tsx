import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { ChartDataPoint } from '../types';

interface IndicatorChartProps {
  data: ChartDataPoint[];
  type: 'macd' | 'rsi';
  height?: number;
}

// MACD图表组件
const MACDChart: React.FC<{ data: ChartDataPoint[]; height: number }> = ({ data, height }) => {
  const chartData = data.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp).getTime(),
  }));

  return (
    <div className="space-y-4">
      {/* MACD线图 */}
      <ResponsiveContainer width="100%" height={height * 0.7}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(4)}
          />
          <Tooltip
            labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
            formatter={(value: number, name: string) => [
              value?.toFixed(4) || 'N/A',
              name === 'macd' ? 'MACD' : name === 'macd_signal' ? 'Signal' : 'Histogram'
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="macd_signal"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* MACD柱状图 */}
      <ResponsiveContainer width="100%" height={height * 0.3}>
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
            tickFormatter={(value) => value.toFixed(4)}
          />
          <Tooltip
            labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
            formatter={(value: number) => [value?.toFixed(4) || 'N/A', 'MACD Histogram']}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          <Bar
            dataKey="macd_hist"
            fill="#6b7280"
            opacity={0.7}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// RSI图表组件
const RSIChart: React.FC<{ data: ChartDataPoint[]; height: number }> = ({ data, height }) => {
  const chartData = data.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp).getTime(),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          domain={[0, 100]}
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
          formatter={(value: number) => [value?.toFixed(2) || 'N/A', 'RSI']}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        
        {/* RSI超买超卖线 */}
        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="2 2" label="超买" />
        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="2 2" label="超卖" />
        <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="1 1" opacity={0.5} />
        
        <Line
          type="monotone"
          dataKey="rsi"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const IndicatorChart: React.FC<IndicatorChartProps> = ({
  data,
  type,
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          暂无{type === 'macd' ? 'MACD' : 'RSI'}数据
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {type === 'macd' ? 'MACD指标' : 'RSI指标'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {type === 'macd'
            ? '移动平均收敛散度指标，用于判断趋势变化'
            : '相对强弱指标，用于判断超买超卖状态'
          }
        </p>
      </div>
      
      {type === 'macd' ? (
        <MACDChart data={data} height={height} />
      ) : (
        <RSIChart data={data} height={height} />
      )}
    </div>
  );
};

export default IndicatorChart;