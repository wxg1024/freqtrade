# FreqTrade 可视化分析工具 - 开发指南

## 开发环境要求

### 系统要求
- **操作系统**: macOS, Linux, Windows
- **Node.js**: 18.20.5 或更高版本
- **npm**: 9.0.0 或更高版本
- **PostgreSQL**: 12.0 或更高版本

### 开发工具推荐
- **IDE**: VS Code, WebStorm, Cursor
- **浏览器**: Chrome, Firefox (支持开发者工具)
- **数据库工具**: pgAdmin, DBeaver
- **API测试**: Postman, Insomnia

## 项目设置

### 1. 克隆项目
```bash
cd /path/to/freqtrade
ls freqtrade-visualization/  # 确认项目存在
```

### 2. 安装依赖

#### 后端依赖
```bash
cd freqtrade-visualization/backend
npm install
```

#### 前端依赖
```bash
cd freqtrade-visualization/frontend
npm install
```

### 3. 环境配置

#### 后端环境变量
创建 `backend/.env` 文件：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置 (使用FreqTrade的配置)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freqtrade
DB_USER=your_username
DB_PASSWORD=your_password

# CORS配置
CORS_ORIGIN=http://localhost:5173

# WebSocket配置
WS_HEARTBEAT_INTERVAL=25000
WS_HEARTBEAT_TIMEOUT=60000
```

#### 前端环境变量
创建 `frontend/.env` 文件：
```env
# API配置
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001

# 开发配置
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
```

### 4. 数据库设置

确保PostgreSQL数据库已创建相应的表结构。如果使用FreqTrade的ScoringSystem策略，表会自动创建。

手动创建表（如果需要）：
```sql
-- 连接到PostgreSQL
psql -U your_username -d freqtrade

-- 创建表结构（参考ARCHITECTURE.md中的SQL）
```

## 开发流程

### 启动开发服务器

#### 方法1: 使用启动脚本
```bash
cd freqtrade-visualization
./start.sh
```

#### 方法2: 分别启动

**启动后端**
```bash
cd backend
npm run dev
```

**启动前端**
```bash
cd frontend
npm run dev
```

### 访问应用
- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3001/api
- **API文档**: 参考 `docs/API.md`

## 代码规范

### TypeScript规范

#### 类型定义
```typescript
// 使用interface定义数据结构
interface CandleData {
  id: number;
  pair: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at: string;
}

// 使用type定义联合类型
type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d';
type Theme = 'light' | 'dark';
```

#### 函数规范
```typescript
// 使用箭头函数和明确的返回类型
const getCandleData = async (
  pair: string,
  timeframe: Timeframe,
  limit: number = 100
): Promise<CandleData[]> => {
  // 实现
};

// 组件Props类型定义
interface ChartProps {
  data: CandleData[];
  height?: number;
  onDataChange?: (data: CandleData[]) => void;
}

const Chart: React.FC<ChartProps> = ({ data, height = 400, onDataChange }) => {
  // 组件实现
};
```

### React组件规范

#### 组件结构
```typescript
// 1. 导入
import React, { useState, useEffect } from 'react';
import { SomeComponent } from './SomeComponent';
import { useStore } from '../store';
import { api } from '../services/api';

// 2. 类型定义
interface ComponentProps {
  // props定义
}

// 3. 组件实现
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. Hooks
  const [state, setState] = useState<StateType>(initialState);
  const store = useStore();
  
  // 5. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, [dependencies]);
  
  // 6. 事件处理函数
  const handleEvent = (event: React.MouseEvent) => {
    // 处理逻辑
  };
  
  // 7. 渲染
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

#### 自定义Hooks
```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, dependencies);
  
  return { data, loading, error, refetch: fetchData };
};
```

### CSS/Tailwind规范

#### 类名组织
```typescript
// 使用clsx组织条件类名
import clsx from 'clsx';

const Button: React.FC<ButtonProps> = ({ variant, size, disabled, children }) => {
  return (
    <button
      className={clsx(
        // 基础样式
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // 变体样式
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
        },
        // 尺寸样式
        {
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        // 状态样式
        {
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

#### 响应式设计
```typescript
// 使用Tailwind响应式前缀
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4 
  p-4
">
  {/* 内容 */}
</div>
```

### 状态管理规范

#### Zustand Store
```typescript
// store/index.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // 状态
  selectedPair: string;
  selectedTimeframe: Timeframe;
  theme: Theme;
  
  // 动作
  setSelectedPair: (pair: string) => void;
  setSelectedTimeframe: (timeframe: Timeframe) => void;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<AppState>()(devtools(
  (set) => ({
    // 初始状态
    selectedPair: 'BTC/USDT',
    selectedTimeframe: '1h',
    theme: 'light',
    
    // 动作实现
    setSelectedPair: (pair) => set({ selectedPair: pair }),
    setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),
    setTheme: (theme) => set({ theme }),
  }),
  { name: 'freqtrade-store' }
));
```

## 测试规范

### 单元测试

#### 组件测试
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

#### API测试
```typescript
// __tests__/services/api.test.ts
import { getCandleData } from '../services/api';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
  });
  
  it('fetches candle data successfully', async () => {
    const mockData = [{ id: 1, pair: 'BTC/USDT' }];
    mockedAxios.get.mockResolvedValue({ data: { data: mockData } });
    
    const result = await getCandleData('BTC/USDT', '1h');
    expect(result).toEqual(mockData);
  });
});
```

### 运行测试
```bash
# 前端测试
cd frontend
npm test

# 测试覆盖率
npm run test:coverage

# 后端测试（待实现）
cd backend
npm test
```

## 构建和部署

### 本地构建

#### 前端构建
```bash
cd frontend
npm run build
```

#### 后端构建
```bash
cd backend
# Node.js项目通常不需要构建步骤
# 但可以添加代码检查
npm run lint
```

### 生产部署

#### 环境变量配置
```env
# 生产环境配置
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=freqtrade_prod
DB_USER=prod_user
DB_PASSWORD=secure_password

# 安全配置
CORS_ORIGIN=https://your-domain.com
```

#### Docker部署（可选）
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 调试指南

### 前端调试

#### 浏览器开发者工具
1. **Console**: 查看日志和错误信息
2. **Network**: 监控API请求和响应
3. **Application**: 检查LocalStorage和SessionStorage
4. **Sources**: 设置断点调试

#### React DevTools
```bash
# 安装React DevTools浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

#### Zustand DevTools
```typescript
// 已在store中配置devtools
// 在Redux DevTools扩展中查看状态变化
```

### 后端调试

#### Node.js调试
```bash
# 使用--inspect启动
node --inspect server.js

# 或使用nodemon
nodemon --inspect server.js
```

#### 日志调试
```javascript
// 添加详细日志
console.log('API request:', req.method, req.url, req.query);
console.log('Database query:', query, params);
console.error('Error occurred:', error);
```

### WebSocket调试

#### 浏览器调试
```javascript
// 在浏览器控制台中
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.onAny((event, ...args) => {
  console.log('WebSocket event:', event, args);
});
```

#### 服务器端调试
```javascript
// 在server.js中添加日志
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.onAny((event, ...args) => {
    console.log('Received event:', event, args);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

## 性能优化

### 前端优化

#### 代码分割
```typescript
// 使用React.lazy进行路由级别的代码分割
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Charts = React.lazy(() => import('./pages/Charts'));

// 在路由中使用Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/charts" element={<Charts />} />
  </Routes>
</Suspense>
```

#### 图表优化
```typescript
// 限制图表数据点数量
const optimizedData = useMemo(() => {
  return data.slice(-1000); // 只显示最近1000个数据点
}, [data]);

// 使用防抖优化实时更新
const debouncedUpdate = useMemo(
  () => debounce((newData) => {
    setChartData(newData);
  }, 100),
  []
);
```

#### 内存优化
```typescript
// 清理WebSocket订阅
useEffect(() => {
  const subscription = websocketService.subscribe(pair, timeframe);
  
  return () => {
    subscription.unsubscribe();
  };
}, [pair, timeframe]);
```

### 后端优化

#### 数据库查询优化
```javascript
// 使用索引和限制查询
const query = `
  SELECT * FROM candle_data 
  WHERE pair = $1 AND timeframe = $2 
  ORDER BY timestamp DESC 
  LIMIT $3
`;

// 使用连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
lsof -i :3001
lsof -i :5173

# 杀死占用进程
kill -9 <PID>
```

#### 2. 数据库连接失败
```bash
# 检查PostgreSQL状态
psql -U username -d database_name -c "SELECT 1;"

# 检查环境变量
echo $DB_HOST $DB_PORT $DB_NAME
```

#### 3. WebSocket连接失败
```javascript
// 检查CORS配置
// 确保后端CORS_ORIGIN包含前端地址

// 检查防火墙设置
// 确保3001端口可访问
```

#### 4. 前端构建失败
```bash
# 清理缓存
npm run clean
rm -rf node_modules package-lock.json
npm install

# 检查TypeScript错误
npm run check
```

### 日志分析

#### 前端日志
```typescript
// 开发环境启用详细日志
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// 生产环境使用错误追踪
if (import.meta.env.PROD) {
  // 集成Sentry或其他错误追踪服务
}
```

#### 后端日志
```javascript
// 使用winston或类似的日志库
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 贡献指南

### 提交规范

#### Commit Message格式
```
type(scope): description

[optional body]

[optional footer]
```

#### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例
```bash
git commit -m "feat(charts): add candlestick chart component"
git commit -m "fix(api): resolve websocket connection issue"
git commit -m "docs(readme): update installation instructions"
```

### 代码审查

#### 审查清单
- [ ] 代码符合项目规范
- [ ] 包含适当的测试
- [ ] 文档已更新
- [ ] 性能影响已评估
- [ ] 安全性已考虑
- [ ] 向后兼容性已确认

### 发布流程

1. **版本号更新**: 遵循语义化版本规范
2. **变更日志**: 更新CHANGELOG.md
3. **测试验证**: 运行完整测试套件
4. **构建验证**: 确认生产构建成功
5. **部署验证**: 在测试环境验证
6. **标签发布**: 创建Git标签

```bash
# 更新版本
npm version patch  # 或 minor, major

# 推送标签
git push origin --tags

# 发布
npm publish  # 如果发布到npm
```