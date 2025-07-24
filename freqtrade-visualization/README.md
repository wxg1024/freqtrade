# FreqTrade 可视化分析工具

这是一个为FreqTrade项目开发的实时数据可视化分析工具，用于监控和分析交易数据、技术指标和评分系统。

## 项目结构

```
freqtrade-visualization/
├── frontend/                 # React前端应用
│   ├── src/                 # 源代码
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型定义
│   │   └── store/          # 状态管理
│   ├── public/             # 静态资源
│   ├── package.json        # 前端依赖
│   └── vite.config.ts      # Vite配置
├── backend/                 # Node.js后端服务
│   ├── server.js           # 服务器入口
│   └── package.json        # 后端依赖
├── visualization-dashboard/ # 旧版本文件（待清理）
└── README.md               # 项目说明
```

## 功能特性

### 核心模块
- **实时仪表板** - 显示关键指标概览和实时数据统计
- **K线图表分析** - 支持多时间周期（5m、15m、1h、4h、1d）的交互式K线图
- **技术指标分析** - MACD、EMA、RSI指标的可视化展示
- **评分系统监控** - 多空评分的实时监控和历史趋势分析
- **交易对管理** - 支持多交易对切换和数据筛选

### 技术架构
- **前端**: React + TypeScript + Recharts图表库
- **后端**: Node.js + Express + Socket.io实时通信
- **数据库**: PostgreSQL连接（使用FreqTrade的ScoringSystem数据）
- **实时更新**: WebSocket实现数据实时推送

## 快速开始

### 启动后端服务
```bash
cd backend
npm install
npm start
```
后端服务将在 http://localhost:3001 启动

### 启动前端应用
```bash
# 在freqtrade-visualization根目录
npm install
npm run dev
```
前端应用将在 http://localhost:5173 启动

## 数据库配置

应用会自动连接到FreqTrade项目中 `ScoringSystem.py` 配置的PostgreSQL数据库，读取以下数据表：
- `candle_data` - K线数据
- `indicator_data` - 技术指标数据
- `scoring_data` - 多空评分数据

## 部署

项目支持通过Vercel进行部署，相关配置文件已包含在项目中。

## 注意事项

1. 确保PostgreSQL数据库已正确配置并运行
2. 确保FreqTrade的ScoringSystem策略正在运行并写入数据
3. 前端和后端需要同时运行才能实现完整功能
4. 默认情况下，后端API运行在3001端口，前端开发服务器运行在5173端口