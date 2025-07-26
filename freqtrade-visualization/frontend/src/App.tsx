import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Charts } from './pages/Charts';
import { KlineProcCharts } from './pages/KlineProcCharts';
import websocketService from './services/websocket';
import { useAppStore } from './store';

function App() {
  const { setConnectionStatus } = useAppStore();

  useEffect(() => {
    // 初始化WebSocket连接
    websocketService.connect();
    
    // 监听连接状态变化
    websocketService.onConnectionChange((connected) => {
      setConnectionStatus(connected);
    });

    // 清理函数
    return () => {
      websocketService.disconnect();
    };
  }, [setConnectionStatus]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/kline-proc" element={<KlineProcCharts />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
        
        {/* Toast 通知 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
