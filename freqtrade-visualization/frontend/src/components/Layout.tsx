import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Menu,
  X,
  Wifi,
  WifiOff,
  Settings,
  Home,
} from 'lucide-react';
import { useAppStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isConnected } = useAppStore();

  const navigation = [
    {
      name: '仪表板',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: '图表分析',
      href: '/charts',
      icon: BarChart3,
      current: location.pathname === '/charts',
    },
  ];

  const NavLink: React.FC<{
    item: typeof navigation[0];
    mobile?: boolean;
  }> = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const baseClasses = mobile
      ? 'group flex items-center px-2 py-2 text-base font-medium rounded-md'
      : 'group flex items-center px-2 py-2 text-sm font-medium rounded-md';
    
    const activeClasses = item.current
      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white';

    return (
      <Link
        to={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => mobile && setSidebarOpen(false)}
      >
        <Icon
          className={`mr-3 flex-shrink-0 h-6 w-6 ${
            item.current
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
          }`}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* 移动端侧边栏覆盖层 */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* 移动端侧边栏 */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  FreqTrade
                </span>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} mobile />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  FreqTrade
                </span>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </nav>
            </div>
            
            {/* 连接状态指示器 */}
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                {isConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      已连接
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                      连接断开
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* 顶部导航栏 */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.current)?.name || 'FreqTrade 可视化分析'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* 连接状态 - 移动端 */}
              <div className="flex items-center md:hidden">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {/* 设置按钮 */}
              <button
                type="button"
                className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;