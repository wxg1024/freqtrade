# FreqTrade 可视化分析工具 - API文档

## 概述

本文档描述了FreqTrade可视化分析工具的API接口，包括RESTful API和WebSocket实时通信接口。

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **WebSocket URL**: `ws://localhost:3001`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 数据类型定义

### CandleData (K线数据)
```typescript
interface CandleData {
  id: number;
  pair: string;           // 交易对，如 "BTC/USDT"
  timeframe: string;      // 时间周期，如 "5m", "15m", "1h", "4h", "1d"
  timestamp: string;      // ISO 8601格式时间戳
  open: number;           // 开盘价
  high: number;           // 最高价
  low: number;            // 最低价
  close: number;          // 收盘价
  volume: number;         // 成交量
  created_at: string;     // 创建时间
}
```

### IndicatorData (技术指标数据)
```typescript
interface IndicatorData {
  id: number;
  pair: string;           // 交易对
  timeframe: string;      // 时间周期
  timestamp: string;      // ISO 8601格式时间戳
  macd?: number;          // MACD值
  macd_signal?: number;   // MACD信号线
  macd_histogram?: number;// MACD柱状图
  ema_12?: number;        // 12周期EMA
  ema_26?: number;        // 26周期EMA
  rsi?: number;           // RSI值
  created_at: string;     // 创建时间
}
```

### ScoringData (评分数据)
```typescript
interface ScoringData {
  id: number;
  pair: string;           // 交易对
  timestamp: string;      // ISO 8601格式时间戳
  long_score: number;     // 多头评分
  short_score: number;    // 空头评分
  total_score: number;    // 总评分
  created_at: string;     // 创建时间
}
```

### DashboardStats (仪表板统计)
```typescript
interface DashboardStats {
  total_pairs: number;        // 总交易对数量
  active_pairs: number;       // 活跃交易对数量
  last_update: string;        // 最后更新时间
  avg_score: number;          // 平均评分
  top_pairs: Array<{          // 评分最高的交易对
    pair: string;
    score: number;
  }>;
}
```

### ApiResponse (API响应格式)
```typescript
interface ApiResponse<T> {
  success: boolean;       // 请求是否成功
  data: T;               // 响应数据
  message?: string;      // 错误信息（失败时）
  timestamp: string;     // 响应时间戳
}
```

## RESTful API接口

### 1. 获取仪表板统计数据

**请求**
```http
GET /api/dashboard/stats
```

**响应**
```json
{
  "success": true,
  "data": {
    "total_pairs": 50,
    "active_pairs": 35,
    "last_update": "2024-01-15T10:30:00Z",
    "avg_score": 65.5,
    "top_pairs": [
      {"pair": "BTC/USDT", "score": 85},
      {"pair": "ETH/USDT", "score": 78}
    ]
  },
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 2. 获取K线数据

**请求**
```http
GET /api/candles?pair={pair}&timeframe={timeframe}&limit={limit}
```

**参数**
- `pair` (必需): 交易对，如 "BTC/USDT"
- `timeframe` (必需): 时间周期，支持 "5m", "15m", "1h", "4h", "1d"
- `limit` (可选): 返回数据条数，默认100，最大1000

**示例**
```http
GET /api/candles?pair=BTC/USDT&timeframe=1h&limit=50
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pair": "BTC/USDT",
      "timeframe": "1h",
      "timestamp": "2024-01-15T10:00:00Z",
      "open": 42000.50,
      "high": 42150.75,
      "low": 41950.25,
      "close": 42100.00,
      "volume": 125.75,
      "created_at": "2024-01-15T10:05:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 3. 获取技术指标数据

**请求**
```http
GET /api/indicators?pair={pair}&timeframe={timeframe}&limit={limit}
```

**参数**
- `pair` (必需): 交易对
- `timeframe` (必需): 时间周期
- `limit` (可选): 返回数据条数，默认100

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pair": "BTC/USDT",
      "timeframe": "1h",
      "timestamp": "2024-01-15T10:00:00Z",
      "macd": 125.50,
      "macd_signal": 120.25,
      "macd_histogram": 5.25,
      "ema_12": 42050.00,
      "ema_26": 41980.00,
      "rsi": 65.5,
      "created_at": "2024-01-15T10:05:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 4. 获取评分数据

**请求**
```http
GET /api/scoring?pair={pair}&limit={limit}
```

**参数**
- `pair` (必需): 交易对
- `limit` (可选): 返回数据条数，默认100

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pair": "BTC/USDT",
      "timestamp": "2024-01-15T10:00:00Z",
      "long_score": 75,
      "short_score": 25,
      "total_score": 50,
      "created_at": "2024-01-15T10:05:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 5. 获取最新评分数据

**请求**
```http
GET /api/scoring/latest
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "pair": "BTC/USDT",
      "timestamp": "2024-01-15T10:25:00Z",
      "long_score": 80,
      "short_score": 20,
      "total_score": 60,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 6. 获取评分趋势数据

**请求**
```http
GET /api/scoring/trends?pair={pair}&days={days}
```

**参数**
- `pair` (必需): 交易对
- `days` (可选): 天数，默认7天

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pair": "BTC/USDT",
      "timestamp": "2024-01-15T10:00:00Z",
      "long_score": 75,
      "short_score": 25,
      "total_score": 50,
      "created_at": "2024-01-15T10:05:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 7. 获取交易对列表

**请求**
```http
GET /api/pairs
```

**响应**
```json
{
  "success": true,
  "data": [
    "BTC/USDT",
    "ETH/USDT",
    "ADA/USDT",
    "DOT/USDT"
  ],
  "timestamp": "2024-01-15T10:30:05Z"
}
```

## WebSocket实时通信

### 连接

```javascript
const socket = io('http://localhost:3001');

// 连接成功
socket.on('connect', () => {
  console.log('Connected to server');
});

// 连接断开
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### 订阅事件

#### 订阅K线数据
```javascript
// 订阅
socket.emit('subscribe_candles', {
  pair: 'BTC/USDT',
  timeframe: '1h'
});

// 接收新数据
socket.on('new_candle_data', (data) => {
  console.log('New candle data:', data);
});

// 取消订阅
socket.emit('unsubscribe_candles', {
  pair: 'BTC/USDT',
  timeframe: '1h'
});
```

#### 订阅技术指标数据
```javascript
// 订阅
socket.emit('subscribe_indicators', {
  pair: 'BTC/USDT',
  timeframe: '1h'
});

// 接收新数据
socket.on('new_indicator_data', (data) => {
  console.log('New indicator data:', data);
});

// 取消订阅
socket.emit('unsubscribe_indicators', {
  pair: 'BTC/USDT',
  timeframe: '1h'
});
```

#### 订阅评分数据
```javascript
// 订阅
socket.emit('subscribe_scoring', {
  pair: 'BTC/USDT'
});

// 接收新数据
socket.on('new_scoring_data', (data) => {
  console.log('New scoring data:', data);
});

// 取消订阅
socket.emit('unsubscribe_scoring', {
  pair: 'BTC/USDT'
});
```

## 错误处理

### HTTP状态码

- `200` - 请求成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "message": "Invalid pair parameter",
  "timestamp": "2024-01-15T10:30:05Z"
}
```

### 常见错误

| 错误码 | 错误信息 | 描述 |
|--------|----------|------|
| `INVALID_PAIR` | Invalid pair parameter | 交易对参数无效 |
| `INVALID_TIMEFRAME` | Invalid timeframe parameter | 时间周期参数无效 |
| `LIMIT_EXCEEDED` | Limit parameter exceeds maximum | 限制参数超过最大值 |
| `DATABASE_ERROR` | Database connection error | 数据库连接错误 |
| `NOT_FOUND` | Resource not found | 资源不存在 |

## 使用示例

### JavaScript/TypeScript

```typescript
import axios from 'axios';
import io from 'socket.io-client';

// API客户端
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000
});

// 获取K线数据
async function getCandleData(pair: string, timeframe: string) {
  try {
    const response = await api.get('/candles', {
      params: { pair, timeframe, limit: 100 }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching candle data:', error);
    throw error;
  }
}

// WebSocket客户端
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  // 订阅BTC/USDT的1小时K线数据
  socket.emit('subscribe_candles', {
    pair: 'BTC/USDT',
    timeframe: '1h'
  });
});

socket.on('new_candle_data', (data) => {
  console.log('Received new candle:', data);
});
```

### Python

```python
import requests
import socketio

# API客户端
class FreqTradeAPI:
    def __init__(self, base_url='http://localhost:3001/api'):
        self.base_url = base_url
    
    def get_candle_data(self, pair, timeframe, limit=100):
        response = requests.get(f'{self.base_url}/candles', {
            'pair': pair,
            'timeframe': timeframe,
            'limit': limit
        })
        return response.json()['data']

# WebSocket客户端
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')
    sio.emit('subscribe_candles', {
        'pair': 'BTC/USDT',
        'timeframe': '1h'
    })

@sio.event
def new_candle_data(data):
    print('Received new candle:', data)

sio.connect('http://localhost:3001')
```

## 性能建议

1. **分页查询**: 使用`limit`参数控制返回数据量
2. **缓存策略**: 客户端缓存静态数据如交易对列表
3. **WebSocket优化**: 只订阅需要的数据，及时取消不需要的订阅
4. **请求频率**: 避免过于频繁的API请求
5. **错误重试**: 实现指数退避的重试机制

## 版本信息

- **当前版本**: v1.0.0
- **最后更新**: 2024-01-15
- **兼容性**: Node.js 18+, 现代浏览器