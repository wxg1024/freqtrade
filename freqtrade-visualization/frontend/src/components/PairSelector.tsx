import React, { useState } from 'react';
import { ChevronDown, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Timeframe } from '../types';
import { useAppStore } from '../store';

interface PairSelectorProps {
  pairs: string[];
  selectedPair: string;
  selectedTimeframe: Timeframe;
  onPairChange: (pair: string) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  latestScores?: { [pair: string]: number };
}

const timeframes: { value: Timeframe; label: string; description: string }[] = [
  { value: '5m', label: '5分钟', description: '短期交易' },
  { value: '15m', label: '15分钟', description: '短期趋势' },
  { value: '1h', label: '1小时', description: '中期趋势' },
  { value: '4h', label: '4小时', description: '日内趋势' },
  { value: '1d', label: '日线', description: '长期趋势' },
];

export const PairSelector: React.FC<PairSelectorProps> = ({
  pairs,
  selectedPair,
  selectedTimeframe,
  onPairChange,
  onTimeframeChange,
  latestScores = {},
}) => {
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPairs = pairs.filter(pair =>
    pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreIcon = (score: number) => {
    if (score > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 3) return 'text-green-600 bg-green-50';
    if (score > 0) return 'text-green-500 bg-green-50';
    if (score <= -3) return 'text-red-600 bg-red-50';
    if (score < 0) return 'text-red-500 bg-red-50';
    return 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* 交易对选择器 */}
      <div className="relative flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          交易对
        </label>
        <div className="relative">
          <button
            onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {selectedPair}
              </span>
              {latestScores[selectedPair] !== undefined && (
                <div className="flex items-center space-x-1">
                  {getScoreIcon(latestScores[selectedPair])}
                  <span className={`text-xs px-2 py-1 rounded ${getScoreColor(latestScores[selectedPair])}`}>
                    {latestScores[selectedPair]}
                  </span>
                </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              isPairDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isPairDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* 搜索框 */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索交易对..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* 交易对列表 */}
              <div className="max-h-48 overflow-y-auto">
                {filteredPairs.length > 0 ? (
                  filteredPairs.map((pair) => (
                    <button
                      key={pair}
                      onClick={() => {
                        onPairChange(pair);
                        setIsPairDropdownOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 ${
                        selectedPair === pair ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {pair}
                      </span>
                      {latestScores[pair] !== undefined && (
                        <div className="flex items-center space-x-1">
                          {getScoreIcon(latestScores[pair])}
                          <span className={`text-xs px-2 py-1 rounded ${getScoreColor(latestScores[pair])}`}>
                            {latestScores[pair]}
                          </span>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    未找到匹配的交易对
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 时间周期选择器 */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          时间周期
        </label>
        <div className="relative">
          <button
            onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
            className="w-full sm:w-40 flex items-center justify-between px-4 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {timeframes.find(tf => tf.value === selectedTimeframe)?.label}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              isTimeframeDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isTimeframeDropdownOpen && (
            <div className="absolute z-10 w-full sm:w-48 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe.value}
                  onClick={() => {
                    onTimeframeChange(timeframe.value);
                    setIsTimeframeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 ${
                    selectedTimeframe === timeframe.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {timeframe.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {timeframe.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速操作按钮 */}
      <div className="flex items-end">
        <div className="flex space-x-2">
          {timeframes.slice(0, 3).map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => onTimeframeChange(timeframe.value)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                selectedTimeframe === timeframe.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              {timeframe.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PairSelector;