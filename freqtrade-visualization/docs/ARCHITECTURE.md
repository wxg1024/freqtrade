# FreqTrade 可视化分析工具 - 架构设计文档

## 概述

FreqTrade可视化分析工具是一个实时数据可视化平台，用于监控和分析FreqTrade交易机器人的数据、技术指标和评分系统。

## 系统架构

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端API      │    │  PostgreSQL     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   数据库        │
│   Port: 5173    │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        └───────────────────────┘
           WebSocket 实时通信
```

### 技术栈

#### 前端 (Frontend)
- **框架**: React 18.3.1 + TypeScript
- **构建工具**: Vite 6.3.5
- **UI框架**: Tailwind CSS 3.4.17
- **图表库**: Recharts 3.1.0
- **状态管理**: Zustand 5.0.3
- **路由**: React Router DOM 7.3.0
- **HTTP客户端**: Axios 1.11.0
- **实时通信**: Socket.io-client 4.8.1
- **通知**: Sonner 2.0.6
- **图标**: Lucide React 0.511.0
- **日期处理**: date-fns 4.1.0

#### 后端 (Backend)
- **运行时**: Node.js
- **框架**: Express 4.18.2
- **实时通信**: Socket.io 4.7.2
- **跨域处理**: CORS 2.8.5
- **开发工具**: Nodemon 3.0.1

#### 数据库
- **数据库**: PostgreSQL
- **连接**: 复用FreqTrade ScoringSystem配置

## 模块设计

### 前端模块结构

```
src/
├── components/          # 可复用组件
│   ├── CandlestickChart.tsx    # K线图表组件
│   ├── IndicatorChart.tsx      # 技术指标图表
│   ├── ScoringChart.tsx        # 评分图表
│   ├── StatsCard.tsx           # 统计卡片
│   ├── PairSelector.tsx        # 交易对选择器
│   ├── Layout.tsx              # 布局组件
│   └── Empty.tsx               # 空状态组件
├── pages/               # 页面组件
│   ├── Dashboard.tsx           # 仪表板页面
│   ├── Charts.tsx              # 图表分析页面
│   └── Home.tsx                # 首页
├── services/            # 服务层
│   ├── api.ts                  # API服务
│   └── websocket.ts            # WebSocket服务
├── store/               # 状态管理
│   └── index.ts                # Zustand store
├── types/               # 类型定义
│   └── index.ts                # TypeScript类型
├── hooks/               # 自定义Hooks
│   └── useTheme.ts             # 主题Hook
└── lib/                 # 工具库
    └── utils.ts                # 工具函数
```

### 后端模块结构

```
backend/
├── server.js            # 服务器入口文件
├── routes/              # 路由模块 (待扩展)
├── controllers/         # 控制器 (待扩展)
├── models/              # 数据模型 (待扩展)
├── middleware/          # 中间件 (待扩展)
└── utils/               # 工具函数 (待扩展)
```

## 数据流设计

### 数据表结构

#### candle_data (K线数据)
```sql
CREATE TABLE candle_data (
    id SERIAL PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pair, timeframe, timestamp)
);
```

#### indicator_data (技术指标数据)
```sql
CREATE TABLE indicator_data (
    id SERIAL PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    macd DECIMAL(20,8),
    macd_signal DECIMAL(20,8),
    macd_histogram DECIMAL(20,8),
    ema_12 DECIMAL(20,8),
    ema_26 DECIMAL(20,8),
    rsi DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pair, timeframe, timestamp)
);
```

#### scoring_data (评分数据)
```sql
CREATE TABLE scoring_data (
    id SERIAL PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    long_score INTEGER NOT NULL,
    short_score INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pair, timestamp)
);
```

### API接口设计

#### RESTful API

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 获取仪表板统计数据 | - |
| GET | `/api/candles` | 获取K线数据 | `pair`, `timeframe`, `limit` |
| GET | `/api/indicators` | 获取技术指标数据 | `pair`, `timeframe`, `limit` |
| GET | `/api/scoring` | 获取评分数据 | `pair`, `limit` |
| GET | `/api/scoring/latest` | 获取最新评分数据 | - |
| GET | `/api/scoring/trends` | 获取评分趋势数据 | `pair`, `days` |
| GET | `/api/pairs` | 获取交易对列表 | - |

#### WebSocket事件

| 事件名 | 描述 | 数据格式 |
|--------|------|----------|
| `connection` | 客户端连接 | - |
| `disconnect` | 客户端断开 | - |
| `subscribe_candles` | 订阅K线数据 | `{pair, timeframe}` |
| `subscribe_indicators` | 订阅指标数据 | `{pair, timeframe}` |
| `subscribe_scoring` | 订阅评分数据 | `{pair}` |
| `new_candle_data` | 新K线数据推送 | `CandleData` |
| `new_indicator_data` | 新指标数据推送 | `IndicatorData` |
| `new_scoring_data` | 新评分数据推送 | `ScoringData` |

## 性能优化

### 前端优化
1. **组件懒加载**: 使用React.lazy()延迟加载页面组件
2. **图表优化**: Recharts图表数据虚拟化，限制显示数据点数量
3. **状态管理**: Zustand轻量级状态管理，避免不必要的重渲染
4. **缓存策略**: API响应缓存，减少重复请求

### 后端优化
1. **数据库索引**: 在timestamp、pair、timeframe字段上建立索引
2. **查询优化**: 使用LIMIT限制查询结果数量
3. **连接池**: PostgreSQL连接池管理
4. **WebSocket优化**: 事件订阅机制，按需推送数据

### 部署优化
1. **静态资源**: Vite构建优化，代码分割
2. **CDN**: 静态资源CDN加速
3. **Gzip压缩**: 服务器端响应压缩
4. **缓存策略**: 浏览器缓存和服务器缓存

## 安全考虑

1. **CORS配置**: 限制跨域访问来源
2. **输入验证**: API参数验证和清理
3. **SQL注入防护**: 使用参数化查询
4. **WebSocket安全**: 连接验证和频率限制
5. **环境变量**: 敏感配置使用环境变量

## 扩展性设计

### 水平扩展
1. **微服务架构**: 后端可拆分为多个微服务
2. **负载均衡**: 多实例部署和负载均衡
3. **数据库分片**: 按交易对或时间分片

### 功能扩展
1. **插件系统**: 支持自定义技术指标
2. **主题系统**: 多主题支持
3. **国际化**: 多语言支持
4. **权限系统**: 用户认证和授权

## 监控和日志

1. **应用监控**: 性能指标监控
2. **错误追踪**: 错误日志收集和分析
3. **用户行为**: 用户操作行为分析
4. **系统健康**: 服务健康检查

## 版本控制

- **语义化版本**: 遵循SemVer规范
- **变更日志**: 维护CHANGELOG.md
- **API版本**: API版本控制策略
- **数据库迁移**: 数据库schema版本管理