import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../store';
import { StatsCard, MarketOverviewCard } from '../components/StatsCard';
import { ScoringChart } from '../components/ScoringChart';
import { getDashboardStats, getLatestScores } from '../services/api';
import websocketService from '../services/websocket';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const {
    dashboardStats,
    isLoading,
    error,
    isConnected,
    setDashboardStats,
    setLoading,
    setError,
    setConnected,
  } = useAppStore();

  const [latestScores, setLatestScores] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 加载仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [stats, scores] = await Promise.all([
        getDashboardStats(),
        getLatestScores(),
      ]);
      
      setDashboardStats(stats);
      setLatestScores(scores);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('数据已刷新');
  };

  // 初始化WebSocket连接
  useEffect(() => {
    // 连接WebSocket
    websocketService.connect();
    
    // 监听连接状态
    const socket = websocketService.getSocket();
    if (socket) {
      socket.on('connect', () => {
        setConnected(true);
        toast.success('实时连接已建立');
      });
      
      socket.on('disconnect', () => {
        setConnected(false);
        toast.error('实时连接已断开');
      });
      
      socket.on('connect_error', () => {
        setConnected(false);
      });
    }
    
    // 订阅实时数据更新
    websocketService.onNewScoringData((data) => {
      // 更新最新评分数据
      setLatestScores(prev => {
        const updated = prev.filter(item => item.pair !== data.pair);
        return [...updated, data].sort((a, b) => a.pair.localeCompare(b.pair));
      });
    });
    
    // 加载初始数据
    loadDashboardData();
    
    // 设置定时刷新
    const interval = setInterval(loadDashboardData, 30000); // 30秒刷新一次
    
    return () => {
      clearInterval(interval);
      websocketService.disconnect();
    };
  }, []);

  // 转换评分数据为图表格式
  const chartData = latestScores.map(score => ({
    timestamp: score.timestamp,
    timeframe_5m: score.timeframe_5m,
    timeframe_15m: score.timeframe_15m,
    timeframe_1h: score.timeframe_1h,
    timeframe_4h: score.timeframe_4h,
    timeframe_1d: score.timeframe_1d,
    total_score: score.total_score,
    signal: score.signal,
  }));

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">加载仪表板数据...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            实时仪表板
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            freqtrade多空评分系统概览
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 连接状态指示器 */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  实时连接
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  连接断开
                </span>
              </>
            )}
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {dashboardStats && (
        <StatsCard stats={dashboardStats} />
      )}

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 市场概览 */}
        <div className="lg:col-span-1">
          {dashboardStats && (
            <MarketOverviewCard stats={dashboardStats} />
          )}
        </div>
        
        {/* 评分趋势图表 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <ScoringChart
              data={chartData}
              type="breakdown"
              height={400}
            />
          </div>
        </div>
      </div>

      {/* 最新评分列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            最新评分
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            各交易对的最新多空评分情况
          </p>
        </div>
        
        <div className="p-6">
          {latestScores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      交易对
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      5分钟
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      15分钟
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      1小时
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      4小时
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      日线
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      总评分
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      信号
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latestScores.slice(0, 10).map((score, index) => (
                    <tr key={`${score.pair}-${score.timestamp || index}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {score.pair}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                          score.timeframe_5m > 0 ? 'bg-green-100 text-green-800' :
                          score.timeframe_5m < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.timeframe_5m}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                          score.timeframe_15m > 0 ? 'bg-green-100 text-green-800' :
                          score.timeframe_15m < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.timeframe_15m}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                          score.timeframe_1h > 0 ? 'bg-green-100 text-green-800' :
                          score.timeframe_1h < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.timeframe_1h}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                          score.timeframe_4h > 0 ? 'bg-green-100 text-green-800' :
                          score.timeframe_4h < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.timeframe_4h}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center ${
                          score.timeframe_1d > 0 ? 'bg-green-100 text-green-800' :
                          score.timeframe_1d < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.timeframe_1d}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          score.total_score >= 3 ? 'bg-green-100 text-green-800' :
                          score.total_score > 0 ? 'bg-green-50 text-green-600' :
                          score.total_score <= -3 ? 'bg-red-100 text-red-800' :
                          score.total_score < 0 ? 'bg-red-50 text-red-600' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.total_score}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          score.signal === 'BUY' ? 'bg-green-100 text-green-800' :
                          score.signal === 'SELL' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {score.signal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">暂无评分数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;