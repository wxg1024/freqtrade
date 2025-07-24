const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据生成函数
function generateCandleData(pair, timeframe, limit = 100) {
  const data = [];
  const now = new Date();
  const timeframeMs = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }[timeframe] || 5 * 60 * 1000;

  let price = 50000 + Math.random() * 10000; // 基础价格
  
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * timeframeMs);
    const open = price;
    const change = (Math.random() - 0.5) * price * 0.02; // 2% 变化
    const close = Math.max(open + change, 1000);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000;
    
    data.push({
      pair,
      timeframe,
      timestamp: timestamp.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2))
    });
    
    price = close;
  }
  
  return data;
}

function generateIndicatorData(pair, timeframe, limit = 100) {
  const data = [];
  const now = new Date();
  const timeframeMs = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }[timeframe] || 5 * 60 * 1000;
  
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * timeframeMs);
    
    data.push({
      pair,
      timeframe,
      timestamp: timestamp.toISOString(),
      macd: (Math.random() - 0.5) * 1000,
      macd_signal: (Math.random() - 0.5) * 800,
      macd_hist: (Math.random() - 0.5) * 200,
      ema_12: 50000 + Math.random() * 5000,
      ema_26: 50000 + Math.random() * 5000,
      rsi: Math.random() * 100
    });
  }
  
  return data;
}

function generateScoringData(pair, limit = 100) {
  const data = [];
  const now = new Date();
  
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5分钟间隔
    const timeframe_5m = Math.random() * 200 - 100;
    const timeframe_15m = Math.random() * 200 - 100;
    const timeframe_1h = Math.random() * 200 - 100;
    const timeframe_4h = Math.random() * 200 - 100;
    const timeframe_1d = Math.random() * 200 - 100;
    const total_score = (timeframe_5m + timeframe_15m + timeframe_1h + timeframe_4h + timeframe_1d) / 5;
    
    let signal = 'NEUTRAL';
    if (total_score > 50) signal = 'STRONG_BUY';
    else if (total_score > 20) signal = 'BUY';
    else if (total_score < -50) signal = 'STRONG_SELL';
    else if (total_score < -20) signal = 'SELL';
    
    data.push({
      pair,
      timestamp: timestamp.toISOString(),
      timeframe_5m: parseFloat(timeframe_5m.toFixed(2)),
      timeframe_15m: parseFloat(timeframe_15m.toFixed(2)),
      timeframe_1h: parseFloat(timeframe_1h.toFixed(2)),
      timeframe_4h: parseFloat(timeframe_4h.toFixed(2)),
      timeframe_1d: parseFloat(timeframe_1d.toFixed(2)),
      total_score: parseFloat(total_score.toFixed(2)),
      signal
    });
  }
  
  return data;
}

// API 路由
app.get('/api/candles', (req, res) => {
  const { pair, timeframe } = req.query;
  const limit = parseInt(req.query.limit) || 100;
  
  if (!pair || !timeframe) {
    return res.status(400).json({ success: false, error: 'Missing pair or timeframe parameter' });
  }
  
  const data = generateCandleData(pair, timeframe, limit);
  res.json({ success: true, data });
});

app.get('/api/indicators', (req, res) => {
  const { pair, timeframe } = req.query;
  const limit = parseInt(req.query.limit) || 100;
  
  if (!pair || !timeframe) {
    return res.status(400).json({ success: false, error: 'Missing pair or timeframe parameter' });
  }
  
  const data = generateIndicatorData(pair, timeframe, limit);
  res.json({ success: true, data });
});

app.get('/api/scoring', (req, res) => {
  const { pair } = req.query;
  const limit = parseInt(req.query.limit) || 100;
  
  if (!pair) {
    return res.status(400).json({ success: false, error: 'Missing pair parameter' });
  }
  
  const data = generateScoringData(pair, limit);
  res.json({ success: true, data });
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total_pairs: 25,
      active_signals: 12,
      bullish_signals: 8,
      bearish_signals: 4,
      last_updated: new Date().toISOString()
    }
  });
});

app.get('/api/pairs', (req, res) => {
  const pairs = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT',
    'SOL/USDT', 'DOT/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LUNA/USDT'
  ];
  res.json({ success: true, data: pairs });
});

app.get('/api/scoring/latest', (req, res) => {
  const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT'];
  const data = pairs.map(pair => {
    const total_score = Math.random() * 200 - 100;
    let signal = 'NEUTRAL';
    if (total_score > 50) signal = 'STRONG_BUY';
    else if (total_score > 20) signal = 'BUY';
    else if (total_score < -50) signal = 'STRONG_SELL';
    else if (total_score < -20) signal = 'SELL';
    
    return {
      pair,
      timestamp: new Date().toISOString(),
      timeframe_5m: parseFloat((Math.random() * 200 - 100).toFixed(2)),
      timeframe_15m: parseFloat((Math.random() * 200 - 100).toFixed(2)),
      timeframe_1h: parseFloat((Math.random() * 200 - 100).toFixed(2)),
      timeframe_4h: parseFloat((Math.random() * 200 - 100).toFixed(2)),
      timeframe_1d: parseFloat((Math.random() * 200 - 100).toFixed(2)),
      total_score: parseFloat(total_score.toFixed(2)),
      signal
    };
  });
  
  res.json({ success: true, data });
});

app.get('/api/scoring/trends', (req, res) => {
  const { pair, days } = req.query;
  const limit = parseInt(days) * 288 || 50; // 288 = 24*60/5 (5分钟间隔)
  
  if (!pair) {
    return res.status(400).json({ success: false, error: 'Missing pair parameter' });
  }
  
  const data = generateScoringData(pair, limit);
  res.json({ success: true, data });
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);
  
  socket.on('subscribe_pair', (pair) => {
    console.log(`订阅交易对: ${pair}`);
    socket.join(pair);
    
    // 模拟实时数据推送
    const interval = setInterval(() => {
      // 推送新的K线数据
      const candleData = generateCandleData(pair, '5m', 1)[0];
      socket.emit('new_candle_data', candleData);
      
      // 推送新的指标数据
      const indicatorData = generateIndicatorData(pair, '5m', 1)[0];
      socket.emit('new_indicator_data', indicatorData);
      
      // 推送新的评分数据
      const scoringData = generateScoringData(pair, 1)[0];
      socket.emit('new_scoring_data', scoringData);
    }, 5000); // 每5秒推送一次
    
    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  });
  
  socket.on('unsubscribe_pair', (pair) => {
    console.log(`取消订阅交易对: ${pair}`);
    socket.leave(pair);
  });
  
  socket.on('disconnect', () => {
    console.log('客户端已断开连接:', socket.id);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});