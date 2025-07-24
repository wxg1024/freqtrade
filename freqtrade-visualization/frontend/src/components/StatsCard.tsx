import React from 'react';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { DashboardStats } from '../types';
import { format } from 'date-fns';

interface StatsCardProps {
  stats: DashboardStats;
}

interface StatItemProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

const StatItem: React.FC<StatItemProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  };

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    neutral: <Activity className="w-4 h-4 text-gray-500" />,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            {trend && trendIcon[trend]}
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const getBullishTrend = () => {
    const total = stats.bullishCount + stats.bearishCount + stats.neutralCount;
    if (total === 0) return 'neutral';
    const bullishRatio = stats.bullishCount / total;
    return bullishRatio > 0.5 ? 'up' : bullishRatio < 0.3 ? 'down' : 'neutral';
  };

  const getBearishTrend = () => {
    const total = stats.bullishCount + stats.bearishCount + stats.neutralCount;
    if (total === 0) return 'neutral';
    const bearishRatio = stats.bearishCount / total;
    return bearishRatio > 0.5 ? 'up' : bearishRatio < 0.3 ? 'down' : 'neutral';
  };

  const getSignalStrength = () => {
    const total = stats.bullishCount + stats.bearishCount + stats.neutralCount;
    if (total === 0) return '无信号';
    
    const bullishRatio = stats.bullishCount / total;
    const bearishRatio = stats.bearishCount / total;
    
    if (bullishRatio > 0.6) return '强多头市场';
    if (bearishRatio > 0.6) return '强空头市场';
    if (bullishRatio > 0.4) return '偏多头市场';
    if (bearishRatio > 0.4) return '偏空头市场';
    return '震荡市场';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatItem
        title="监控交易对"
        value={stats.totalPairs}
        icon={<Activity className="w-5 h-5" />}
        subtitle="总数量"
        color="blue"
      />
      
      <StatItem
        title="活跃信号"
        value={stats.activeSignals}
        icon={<TrendingUp className="w-5 h-5" />}
        subtitle={getSignalStrength()}
        color="green"
      />
      
      <StatItem
        title="多头信号"
        value={stats.bullishCount}
        icon={<TrendingUp className="w-5 h-5" />}
        trend={getBullishTrend()}
        subtitle={`${((stats.bullishCount / Math.max(stats.totalPairs, 1)) * 100).toFixed(1)}%`}
        color="green"
      />
      
      <StatItem
        title="空头信号"
        value={stats.bearishCount}
        icon={<TrendingDown className="w-5 h-5" />}
        trend={getBearishTrend()}
        subtitle={`${((stats.bearishCount / Math.max(stats.totalPairs, 1)) * 100).toFixed(1)}%`}
        color="red"
      />
    </div>
  );
};

// 市场概览卡片
export const MarketOverviewCard: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const total = stats.bullishCount + stats.bearishCount + stats.neutralCount;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          市场概览
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          {stats.lastUpdate ? (
            (() => {
              try {
                const date = new Date(stats.lastUpdate);
                return isNaN(date.getTime()) ? '无效时间' : format(date, 'HH:mm:ss');
              } catch {
                return '无效时间';
              }
            })()
          ) : (
            '未更新'
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {/* 信号分布 */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>信号分布</span>
            <span>{total} 个交易对</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="flex h-full rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${total > 0 ? (stats.bullishCount / total) * 100 : 0}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${total > 0 ? (stats.bearishCount / total) * 100 : 0}%` }}
              />
              <div
                className="bg-gray-400"
                style={{ width: `${total > 0 ? (stats.neutralCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>多头 {stats.bullishCount}</span>
            <span>空头 {stats.bearishCount}</span>
            <span>中性 {stats.neutralCount}</span>
          </div>
        </div>
        
        {/* 市场情绪 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">市场情绪</div>
          <div className="text-lg font-semibold">
            {(() => {
              if (total === 0) return <span className="text-gray-500">无数据</span>;
              
              const bullishRatio = stats.bullishCount / total;
              const bearishRatio = stats.bearishCount / total;
              
              if (bullishRatio > 0.6) {
                return <span className="text-green-600">🚀 强烈看多</span>;
              } else if (bearishRatio > 0.6) {
                return <span className="text-red-600">📉 强烈看空</span>;
              } else if (bullishRatio > 0.4) {
                return <span className="text-green-500">📈 偏向看多</span>;
              } else if (bearishRatio > 0.4) {
                return <span className="text-red-500">📉 偏向看空</span>;
              } else {
                return <span className="text-yellow-500">⚖️ 震荡整理</span>;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;