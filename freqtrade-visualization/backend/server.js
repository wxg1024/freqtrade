const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// PostgreSQL 连接配置
const pool = new Pool({
  user: 'freqtrader',
  host: 'localhost',
  database: 'freqtrader',
  password: 'Aa123456',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('已连接到PostgreSQL数据库');
});

pool.on('error', (err) => {
  console.error('PostgreSQL连接错误:', err);
});

// 中间件
app.use(cors());
app.use(express.json());

// 数据库查询辅助函数
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  } finally {
    client.release();
  }
}

// API 路由
app.get('/api/candles', async (req, res) => {
  try {
    const { pair, timeframe } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    
    if (!pair || !timeframe) {
      return res.status(400).json({ success: false, error: 'Missing pair or timeframe parameter' });
    }
    
    const query = `
      SELECT pair, timeframe, date, open, high, low, close, volume
      FROM candle_data 
      WHERE pair = $1 AND timeframe = $2 
      ORDER BY date DESC 
      LIMIT $3
    `;
    
    const data = await executeQuery(query, [pair, timeframe, limit]);
    
    // 转换数据格式
    const formattedData = data.map(row => ({
      pair: row.pair,
      timeframe: row.timeframe,
      timestamp: row.date.toISOString(),
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseFloat(row.volume)
    })).reverse(); // 按时间正序排列
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取K线数据错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/indicators', async (req, res) => {
  try {
    const { pair, timeframe } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    
    if (!pair || !timeframe) {
      return res.status(400).json({ success: false, error: 'Missing pair or timeframe parameter' });
    }
    
    // 获取指定交易对和时间框架的所有指标数据
    const query = `
      SELECT date, indicator_name, value
      FROM indicator_data 
      WHERE pair = $1 AND timeframe = $2 
      ORDER BY date DESC 
      LIMIT $3
    `;
    
    const data = await executeQuery(query, [pair, timeframe, limit * 10]); // 获取更多数据以便分组
    
    // 按日期分组指标数据
    const groupedData = {};
    data.forEach(row => {
      const dateKey = row.date.toISOString();
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          pair,
          timeframe,
          timestamp: dateKey,
          macd: null,
          macd_signal: null,
          macd_hist: null,
          ema_12: null,
          ema_26: null,
          rsi: null
        };
      }
      
      // 根据指标名称映射到对应字段
      const indicatorMap = {
        'macd': 'macd',
        'macd_signal': 'macd_signal',
        'macd_histogram': 'macd_hist',
        'ema_12': 'ema_12',
        'ema_26': 'ema_26',
        'rsi': 'rsi'
      };
      
      const fieldName = indicatorMap[row.indicator_name];
      if (fieldName && row.value !== null) {
        groupedData[dateKey][fieldName] = parseFloat(row.value);
      }
    });
    
    // 转换为数组并限制数量
    const formattedData = Object.values(groupedData)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取指标数据错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/scoring', async (req, res) => {
  try {
    const { pair } = req.query;
    const limit = parseInt(req.query.limit) || 100;
    
    if (!pair) {
      return res.status(400).json({ success: false, error: 'Missing pair parameter' });
    }
    
    // 获取指定交易对的评分数据
    const query = `
      SELECT date, timeframe, indicator, score
      FROM scoring_data 
      WHERE pair = $1 
      ORDER BY date DESC 
      LIMIT $2
    `;
    
    const data = await executeQuery(query, [pair, limit * 10]); // 获取更多数据以便分组
    
    // 按日期分组评分数据
    const groupedData = {};
    data.forEach(row => {
      const dateKey = row.date.toISOString();
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          pair,
          timestamp: dateKey,
          timeframe_5m: 0,
          timeframe_15m: 0,
          timeframe_1h: 0,
          timeframe_4h: 0,
          timeframe_1d: 0,
          total_score: 0,
          signal: 'NEUTRAL'
        };
      }
      
      // 根据时间框架映射评分
      const timeframeMap = {
        '5m': 'timeframe_5m',
        '15m': 'timeframe_15m',
        '1h': 'timeframe_1h',
        '4h': 'timeframe_4h',
        '1d': 'timeframe_1d'
      };
      
      const fieldName = timeframeMap[row.timeframe];
      if (fieldName) {
        groupedData[dateKey][fieldName] = parseInt(row.score) || 0;
      }
    });
    
    // 计算总分和信号
    Object.values(groupedData).forEach(item => {
      item.total_score = item.timeframe_5m + item.timeframe_15m + item.timeframe_1h + item.timeframe_4h + item.timeframe_1d;
      
      if (item.total_score > 50) item.signal = 'STRONG_BUY';
      else if (item.total_score > 20) item.signal = 'BUY';
      else if (item.total_score < -50) item.signal = 'STRONG_SELL';
      else if (item.total_score < -20) item.signal = 'SELL';
      else item.signal = 'NEUTRAL';
    });
    
    // 转换为数组并限制数量
    const formattedData = Object.values(groupedData)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取评分数据错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // 获取交易对总数
    const pairsQuery = 'SELECT COUNT(DISTINCT pair) as total_pairs FROM candle_data';
    const pairsResult = await executeQuery(pairsQuery);
    
    // 获取最新评分数据统计
    const scoresQuery = `
      SELECT 
        COUNT(DISTINCT pair) as active_signals,
        COUNT(CASE WHEN score > 0 THEN 1 END) as bullish_signals,
        COUNT(CASE WHEN score < 0 THEN 1 END) as bearish_signals
      FROM (
        SELECT DISTINCT ON (pair) pair, score
        FROM scoring_data 
        ORDER BY pair, date DESC
      ) latest_scores
    `;
    const scoresResult = await executeQuery(scoresQuery);
    
    const stats = {
      total_pairs: parseInt(pairsResult[0]?.total_pairs || 0),
      active_signals: parseInt(scoresResult[0]?.active_signals || 0),
      bullish_signals: parseInt(scoresResult[0]?.bullish_signals || 0),
      bearish_signals: parseInt(scoresResult[0]?.bearish_signals || 0),
      last_updated: new Date().toISOString()
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取仪表板统计错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/pairs', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT pair FROM candle_data ORDER BY pair';
    const data = await executeQuery(query);
    
    const pairs = data.map(row => row.pair);
    res.json({ success: true, data: pairs });
  } catch (error) {
    console.error('获取交易对列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/scoring/latest', async (req, res) => {
  try {
    // 获取每个交易对的最新评分数据
    const query = `
      SELECT DISTINCT ON (pair, date) 
        pair, date, timeframe, indicator, score
      FROM scoring_data 
      ORDER BY pair, date DESC, timeframe
    `;
    
    const data = await executeQuery(query);
    
    // 按交易对分组数据
    const pairGroups = {};
    data.forEach(row => {
      if (!pairGroups[row.pair]) {
        pairGroups[row.pair] = {
          pair: row.pair,
          timestamp: row.date.toISOString(),
          timeframe_5m: 0,
          timeframe_15m: 0,
          timeframe_1h: 0,
          timeframe_4h: 0,
          timeframe_1d: 0,
          total_score: 0,
          signal: 'NEUTRAL'
        };
      }
      
      // 根据时间框架映射评分
      const timeframeMap = {
        '5m': 'timeframe_5m',
        '15m': 'timeframe_15m',
        '1h': 'timeframe_1h',
        '4h': 'timeframe_4h',
        '1d': 'timeframe_1d'
      };
      
      const fieldName = timeframeMap[row.timeframe];
      if (fieldName) {
        pairGroups[row.pair][fieldName] = parseInt(row.score) || 0;
      }
    });
    
    // 计算总分和信号
    const formattedData = Object.values(pairGroups).map(item => {
      item.total_score = item.timeframe_5m + item.timeframe_15m + item.timeframe_1h + item.timeframe_4h + item.timeframe_1d;
      
      if (item.total_score > 50) item.signal = 'STRONG_BUY';
      else if (item.total_score > 20) item.signal = 'BUY';
      else if (item.total_score < -50) item.signal = 'STRONG_SELL';
      else if (item.total_score < -20) item.signal = 'SELL';
      else item.signal = 'NEUTRAL';
      
      return item;
    });
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取最新评分数据错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/scoring/trends', async (req, res) => {
  try {
    const { pair, days } = req.query;
    const daysLimit = parseInt(days) || 7;
    
    if (!pair) {
      return res.status(400).json({ success: false, error: 'Missing pair parameter' });
    }
    
    const query = `
      SELECT date, timeframe, indicator, score
      FROM scoring_data 
      WHERE pair = $1 AND date >= NOW() - INTERVAL '${daysLimit} days'
      ORDER BY date ASC
    `;
    
    const data = await executeQuery(query, [pair]);
    
    // 按日期分组评分数据
    const groupedData = {};
    data.forEach(row => {
      const dateKey = row.date.toISOString();
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          pair,
          timestamp: dateKey,
          timeframe_5m: 0,
          timeframe_15m: 0,
          timeframe_1h: 0,
          timeframe_4h: 0,
          timeframe_1d: 0,
          total_score: 0,
          signal: 'NEUTRAL'
        };
      }
      
      // 根据时间框架映射评分
      const timeframeMap = {
        '5m': 'timeframe_5m',
        '15m': 'timeframe_15m',
        '1h': 'timeframe_1h',
        '4h': 'timeframe_4h',
        '1d': 'timeframe_1d'
      };
      
      const fieldName = timeframeMap[row.timeframe];
      if (fieldName) {
        groupedData[dateKey][fieldName] = parseInt(row.score) || 0;
      }
    });
    
    // 计算总分和信号
    const formattedData = Object.values(groupedData).map(item => {
      item.total_score = item.timeframe_5m + item.timeframe_15m + item.timeframe_1h + item.timeframe_4h + item.timeframe_1d;
      
      if (item.total_score > 50) item.signal = 'STRONG_BUY';
      else if (item.total_score > 20) item.signal = 'BUY';
      else if (item.total_score < -50) item.signal = 'STRONG_SELL';
      else if (item.total_score < -20) item.signal = 'SELL';
      else item.signal = 'NEUTRAL';
      
      return item;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取评分趋势数据错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);
  
  socket.on('subscribe_pair', async (pair) => {
    console.log(`订阅交易对: ${pair}`);
    socket.join(pair);
    
    // 模拟实时数据推送（从数据库获取最新数据）
    const interval = setInterval(async () => {
      try {
        // 推送最新的K线数据
        const candleQuery = `
          SELECT pair, timeframe, date, open, high, low, close, volume
          FROM candle_data 
          WHERE pair = $1 
          ORDER BY date DESC 
          LIMIT 1
        `;
        const candleData = await executeQuery(candleQuery, [pair]);
        if (candleData.length > 0) {
          const formattedCandle = {
            pair: candleData[0].pair,
            timeframe: candleData[0].timeframe,
            timestamp: candleData[0].date.toISOString(),
            open: parseFloat(candleData[0].open),
            high: parseFloat(candleData[0].high),
            low: parseFloat(candleData[0].low),
            close: parseFloat(candleData[0].close),
            volume: parseFloat(candleData[0].volume)
          };
          socket.emit('new_candle_data', formattedCandle);
        }
        
        // 推送最新的指标数据
        const indicatorQuery = `
          SELECT date, indicator_name, value
          FROM indicator_data 
          WHERE pair = $1 
          ORDER BY date DESC 
          LIMIT 10
        `;
        const indicatorData = await executeQuery(indicatorQuery, [pair]);
        if (indicatorData.length > 0) {
          // 按日期分组最新的指标数据
          const latestDate = indicatorData[0].date;
          const latestIndicators = indicatorData.filter(row => 
            row.date.getTime() === latestDate.getTime()
          );
          
          const formattedIndicator = {
            pair,
            timeframe: '5m', // 默认时间框架
            timestamp: latestDate.toISOString(),
            macd: null,
            macd_signal: null,
            macd_hist: null,
            ema_12: null,
            ema_26: null,
            rsi: null
          };
          
          // 根据指标名称映射到对应字段
          const indicatorMap = {
            'macd': 'macd',
            'macd_signal': 'macd_signal',
            'macd_histogram': 'macd_hist',
            'ema_12': 'ema_12',
            'ema_26': 'ema_26',
            'rsi': 'rsi'
          };
          
          latestIndicators.forEach(row => {
            const fieldName = indicatorMap[row.indicator_name];
            if (fieldName && row.value !== null) {
              formattedIndicator[fieldName] = parseFloat(row.value);
            }
          });
          
          socket.emit('new_indicator_data', formattedIndicator);
        }
        
        // 推送最新的评分数据
        const scoringQuery = `
          SELECT date, timeframe, indicator, score
          FROM scoring_data 
          WHERE pair = $1 
          ORDER BY date DESC 
          LIMIT 10
        `;
        const scoringData = await executeQuery(scoringQuery, [pair]);
        if (scoringData.length > 0) {
          // 按日期分组最新的评分数据
          const latestDate = scoringData[0].date;
          const latestScores = scoringData.filter(row => 
            row.date.getTime() === latestDate.getTime()
          );
          
          const formattedScoring = {
            pair,
            timestamp: latestDate.toISOString(),
            timeframe_5m: 0,
            timeframe_15m: 0,
            timeframe_1h: 0,
            timeframe_4h: 0,
            timeframe_1d: 0,
            total_score: 0,
            signal: 'NEUTRAL'
          };
          
          // 根据时间框架映射评分
          const timeframeMap = {
            '5m': 'timeframe_5m',
            '15m': 'timeframe_15m',
            '1h': 'timeframe_1h',
            '4h': 'timeframe_4h',
            '1d': 'timeframe_1d'
          };
          
          latestScores.forEach(row => {
            const fieldName = timeframeMap[row.timeframe];
            if (fieldName) {
              formattedScoring[fieldName] = parseInt(row.score) || 0;
            }
          });
          
          // 计算总分和信号
          formattedScoring.total_score = formattedScoring.timeframe_5m + formattedScoring.timeframe_15m + 
            formattedScoring.timeframe_1h + formattedScoring.timeframe_4h + formattedScoring.timeframe_1d;
          
          if (formattedScoring.total_score > 50) formattedScoring.signal = 'STRONG_BUY';
          else if (formattedScoring.total_score > 20) formattedScoring.signal = 'BUY';
          else if (formattedScoring.total_score < -50) formattedScoring.signal = 'STRONG_SELL';
          else if (formattedScoring.total_score < -20) formattedScoring.signal = 'SELL';
          else formattedScoring.signal = 'NEUTRAL';
          
          socket.emit('new_scoring_data', formattedScoring);
        }
      } catch (error) {
        console.error('WebSocket数据推送错误:', error);
      }
    }, 10000); // 每10秒推送一次
    
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
  console.log('正在连接到PostgreSQL数据库...');
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await pool.end();
  process.exit(0);
});