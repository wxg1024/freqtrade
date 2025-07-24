import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ScoreDataPoint } from '../types';

interface ScoringChartProps {
  data: ScoreDataPoint[];
  type: 'trend' | 'breakdown';
  height?: number;
}

// 评分趋势图表
const ScoreTrendChart: React.FC<{ data: ScoreDataPoint[]; height: number }> = ({ data, height }) => {
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
          domain={[-5, 5]}
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'yyyy-MM-dd HH:mm')}
          formatter={(value: number, name: string) => {
            const nameMap: { [key: string]: string } = {
              total_score: '总评分',
              timeframe_5m: '5分钟',
              timeframe_15m: '15分钟',
              timeframe_1h: '1小时',
              timeframe_4h: '4小时',
              timeframe_1d: '日线',
            };
            return [value, nameMap[name] || name];
          }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        
        {/* 中性线 */}
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        
        {/* 多空分界线 */}
        <ReferenceLine y={2} stroke="#10b981" strokeDasharray="1 1" opacity={0.5} />
        <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="1 1" opacity={0.5} />
        
        {/* 总评分线 */}
        <Line
          type="monotone"
          dataKey="total_score"
          stroke="#1f2937"
          strokeWidth={3}
          dot={{ fill: '#1f2937', strokeWidth: 2, r: 4 }}
          name="总评分"
        />
        
        {/* 各时间周期评分线 */}
        <Line
          type="monotone"
          dataKey="timeframe_5m"
          stroke="#ef4444"
          strokeWidth={1.5}
          dot={false}
          name="5分钟"
        />
        <Line
          type="monotone"
          dataKey="timeframe_15m"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
          name="15分钟"
        />
        <Line
          type="monotone"
          dataKey="timeframe_1h"
          stroke="#3b82f6"
          strokeWidth={1.5}
          dot={false}
          name="1小时"
        />
        <Line
          type="monotone"
          dataKey="timeframe_4h"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          dot={false}
          name="4小时"
        />
        <Line
          type="monotone"
          dataKey="timeframe_1d"
          stroke="#10b981"
          strokeWidth={1.5}
          dot={false}
          name="日线"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// 评分分解图表
const ScoreBreakdownChart: React.FC<{ data: ScoreDataPoint[]; height: number }> = ({ data, height }) => {
  // 取最新的数据点进行分解显示
  const latestData = data[data.length - 1];
  
  if (!latestData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">暂无数据</p>
      </div>
    );
  }

  const breakdownData = [
    { timeframe: '5分钟', score: latestData.timeframe_5m, color: '#ef4444' },
    { timeframe: '15分钟', score: latestData.timeframe_15m, color: '#f59e0b' },
    { timeframe: '1小时', score: latestData.timeframe_1h, color: '#3b82f6' },
    { timeframe: '4小时', score: latestData.timeframe_4h, color: '#8b5cf6' },
    { timeframe: '日线', score: latestData.timeframe_1d, color: '#10b981' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          当前评分分解
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {format(new Date(latestData.timestamp), 'yyyy-MM-dd HH:mm')}
        </p>
        <div className="mt-2">
          <span className="text-2xl font-bold">
            总评分: 
            <span className={`${
              latestData.total_score > 0 ? 'text-green-600' : 
              latestData.total_score < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {latestData.total_score}
            </span>
          </span>
          <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
            latestData.signal === 'BUY' ? 'bg-green-100 text-green-800' :
            latestData.signal === 'SELL' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {latestData.signal}
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height - 100}>
        <BarChart data={breakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="timeframe"
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            domain={[-1, 1]}
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number) => [value, '评分']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          <Bar
            dataKey="score"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* 评分说明 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h5 className="font-medium text-gray-900 dark:text-gray-100">评分说明</h5>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <p>+1: 多头信号</p>
            <p>0: 中性信号</p>
            <p>-1: 空头信号</p>
          </div>
        </div>
        <div className="space-y-2">
          <h5 className="font-medium text-gray-900 dark:text-gray-100">信号强度</h5>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <p>&gt;= 3: 强多头</p>
            <p>1-2: 弱多头</p>
            <p>-1--2: 弱空头</p>
            <p>&lt;= -3: 强空头</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScoringChart: React.FC<ScoringChartProps> = ({
  data,
  type,
  height = 400,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">暂无评分数据</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {type === 'trend' ? '评分趋势' : '评分分解'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {type === 'trend'
            ? '多时间周期评分变化趋势'
            : '当前各时间周期评分详情'
          }
        </p>
      </div>
      
      {type === 'trend' ? (
        <ScoreTrendChart data={data} height={height} />
      ) : (
        <ScoreBreakdownChart data={data} height={height} />
      )}
    </div>
  );
};

export default ScoringChart;