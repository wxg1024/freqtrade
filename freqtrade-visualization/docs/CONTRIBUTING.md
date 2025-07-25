# FreqTrade 可视化分析工具 - 贡献指南

## 欢迎贡献

感谢您对FreqTrade可视化分析工具的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🧪 测试用例
- 🌐 国际化翻译

## 开始之前

### 行为准则

参与本项目即表示您同意遵守我们的行为准则：

- **尊重他人**：以友善和专业的态度对待所有贡献者
- **包容性**：欢迎不同背景和经验水平的贡献者
- **建设性**：提供有建设性的反馈和建议
- **协作精神**：优先考虑项目和社区的整体利益

### 技术要求

在开始贡献之前，请确保您具备以下技术基础：

#### 必需技能
- **JavaScript/TypeScript**：熟悉ES6+语法和TypeScript类型系统
- **React**：了解React Hooks、组件生命周期和状态管理
- **Node.js**：熟悉后端开发和API设计
- **Git**：掌握基本的版本控制操作

#### 推荐技能
- **PostgreSQL**：数据库设计和查询优化
- **WebSocket**：实时通信协议
- **Tailwind CSS**：现代CSS框架
- **测试框架**：Jest、React Testing Library等

## 开发环境设置

### 1. Fork和克隆仓库

```bash
# Fork仓库到您的GitHub账户
# 然后克隆您的fork
git clone https://github.com/YOUR_USERNAME/freqtrade-visualization.git
cd freqtrade-visualization

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/freqtrade-visualization.git
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境

```bash
# 复制环境配置文件
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 根据需要修改配置
```

### 4. 启动开发服务器

```bash
# 启动后端（终端1）
cd backend
npm run dev

# 启动前端（终端2）
cd frontend
npm run dev
```

## 贡献流程

### 1. 创建Issue

在开始编码之前，请先创建或查找相关的Issue：

#### Bug报告
使用Bug报告模板，包含以下信息：
- **问题描述**：清晰描述遇到的问题
- **复现步骤**：详细的复现步骤
- **期望行为**：描述期望的正确行为
- **实际行为**：描述实际发生的情况
- **环境信息**：操作系统、浏览器版本、Node.js版本等
- **截图/日志**：如果适用，提供相关截图或错误日志

#### 功能请求
使用功能请求模板，包含以下信息：
- **功能描述**：详细描述建议的功能
- **使用场景**：说明该功能的使用场景和价值
- **实现建议**：如果有想法，可以提供实现建议
- **替代方案**：是否考虑过其他解决方案

### 2. 创建分支

```bash
# 确保主分支是最新的
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/issue-number-description
```

### 分支命名规范

- **功能分支**：`feature/feature-name`
- **修复分支**：`fix/issue-number-description`
- **文档分支**：`docs/documentation-update`
- **重构分支**：`refactor/component-name`
- **测试分支**：`test/test-description`

### 3. 编写代码

#### 代码规范

##### TypeScript/JavaScript
```typescript
// 使用TypeScript严格模式
// 提供完整的类型定义
interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 使用有意义的变量名
const fetchCandleData = async (pair: string, timeframe: string): Promise<CandleData[]> => {
  // 实现逻辑
};

// 添加JSDoc注释
/**
 * 获取指定交易对的K线数据
 * @param pair 交易对，如 'BTC/USDT'
 * @param timeframe 时间周期，如 '1h'
 * @param limit 数据条数限制
 * @returns Promise<CandleData[]>
 */
export const getCandleData = async (
  pair: string, 
  timeframe: string, 
  limit: number = 100
): Promise<CandleData[]> => {
  // 实现逻辑
};
```

##### React组件
```tsx
// 使用函数组件和Hooks
import React, { useState, useEffect } from 'react';
import { CandleData } from '../types';

interface CandleChartProps {
  pair: string;
  timeframe: string;
  data: CandleData[];
  onDataUpdate?: (data: CandleData[]) => void;
}

/**
 * K线图表组件
 * 显示指定交易对的K线数据
 */
export const CandleChart: React.FC<CandleChartProps> = ({
  pair,
  timeframe,
  data,
  onDataUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 组件逻辑
  }, [pair, timeframe]);

  if (loading) {
    return <div className="flex justify-center p-4">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">错误: {error}</div>;
  }

  return (
    <div className="w-full h-96">
      {/* 图表内容 */}
    </div>
  );
};
```

##### CSS/Tailwind
```tsx
// 优先使用Tailwind CSS类
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
    市场概览
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 内容 */}
  </div>
</div>

// 如果需要自定义样式，使用CSS模块
// styles.module.css
.customChart {
  @apply w-full h-96;
  /* 自定义样式 */
}
```

#### 提交规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```bash
# 功能提交
git commit -m "feat: 添加实时K线数据订阅功能"

# 修复提交
git commit -m "fix: 修复WebSocket连接断开重连问题"

# 文档提交
git commit -m "docs: 更新API文档和使用示例"

# 样式提交
git commit -m "style: 优化图表组件的响应式布局"

# 重构提交
git commit -m "refactor: 重构数据获取逻辑以提高性能"

# 测试提交
git commit -m "test: 添加API端点的单元测试"

# 构建提交
git commit -m "build: 更新依赖包版本"
```

#### 提交消息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**类型（type）**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 重构代码
- `test`: 添加或修改测试
- `build`: 构建系统或依赖更新
- `ci`: CI配置更新
- `perf`: 性能优化
- `chore`: 其他维护性更改

**范围（scope）**（可选）：
- `frontend`: 前端相关
- `backend`: 后端相关
- `api`: API相关
- `ui`: 用户界面
- `db`: 数据库相关
- `ws`: WebSocket相关

### 4. 测试

#### 运行测试
```bash
# 后端测试
cd backend
npm test
npm run test:coverage

# 前端测试
cd frontend
npm test
npm run test:coverage
```

#### 编写测试

##### 后端API测试
```javascript
// tests/api/dashboard.test.js
const request = require('supertest');
const app = require('../../server');

describe('Dashboard API', () => {
  describe('GET /api/dashboard/stats', () => {
    it('应该返回仪表板统计数据', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalPairs');
      expect(response.body).toHaveProperty('activePairs');
      expect(response.body).toHaveProperty('lastUpdate');
      expect(typeof response.body.totalPairs).toBe('number');
    });

    it('应该处理数据库错误', async () => {
      // 模拟数据库错误
      jest.spyOn(db, 'query').mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

##### 前端组件测试
```tsx
// src/components/__tests__/CandleChart.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandleChart } from '../CandleChart';
import { mockCandleData } from '../../__mocks__/data';

describe('CandleChart', () => {
  const defaultProps = {
    pair: 'BTC/USDT',
    timeframe: '1h',
    data: mockCandleData
  };

  it('应该正确渲染K线图表', () => {
    render(<CandleChart {...defaultProps} />);
    
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    render(<CandleChart {...defaultProps} data={[]} />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该处理数据更新', async () => {
    const onDataUpdate = jest.fn();
    render(
      <CandleChart 
        {...defaultProps} 
        onDataUpdate={onDataUpdate}
      />
    );

    // 模拟数据更新
    await waitFor(() => {
      expect(onDataUpdate).toHaveBeenCalledWith(mockCandleData);
    });
  });
});
```

#### 测试覆盖率要求

- **单元测试覆盖率**：≥ 80%
- **集成测试覆盖率**：≥ 70%
- **关键路径覆盖率**：100%

### 5. 代码审查

#### 自我审查清单

在提交PR之前，请确保：

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 文档已更新
- [ ] 没有引入新的警告或错误
- [ ] 性能没有明显下降
- [ ] 安全性考虑已实施

#### 代码质量检查

```bash
# 运行代码检查
npm run lint
npm run type-check
npm run format

# 运行安全检查
npm audit
npm run security-check
```

### 6. 提交Pull Request

#### PR标题格式
```
<type>: <description> (#issue-number)

例如：
feat: 添加实时K线数据订阅功能 (#123)
fix: 修复WebSocket连接断开重连问题 (#456)
```

#### PR描述模板
```markdown
## 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 性能优化
- [ ] 其他

## 变更描述
简要描述此PR的变更内容和目的。

## 相关Issue
关闭 #issue-number

## 变更详情
### 添加
- 新增功能A
- 新增组件B

### 修改
- 优化算法C
- 更新界面D

### 删除
- 移除过时的代码E

## 测试
- [ ] 单元测试已添加/更新
- [ ] 集成测试已添加/更新
- [ ] 手动测试已完成
- [ ] 测试覆盖率满足要求

## 截图/演示
如果适用，请提供截图或GIF演示。

## 检查清单
- [ ] 代码符合项目规范
- [ ] 提交消息符合规范
- [ ] 文档已更新
- [ ] 测试已添加/更新
- [ ] 没有引入破坏性变更
- [ ] 性能影响已评估

## 额外说明
任何需要特别说明的内容。
```

#### PR审查流程

1. **自动检查**：CI/CD流水线自动运行测试和代码检查
2. **代码审查**：至少需要一位维护者的审查和批准
3. **测试验证**：确保所有测试通过
4. **文档检查**：确保相关文档已更新
5. **合并**：维护者合并PR到主分支

## 开发指南

### 项目结构

```
freqtrade-visualization/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── services/       # API服务
│   │   ├── stores/         # 状态管理
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   └── package.json
├── docs/                   # 项目文档
└── README.md
```

### 新功能开发流程

#### 1. 需求分析
- 明确功能需求和用户场景
- 设计API接口和数据结构
- 评估技术可行性和性能影响

#### 2. 设计阶段
- 创建技术设计文档
- 设计数据库schema（如需要）
- 设计组件架构和状态管理

#### 3. 实现阶段
- 后端API开发
- 前端组件开发
- 集成测试

#### 4. 测试阶段
- 单元测试
- 集成测试
- 用户验收测试

#### 5. 文档更新
- API文档
- 用户文档
- 开发文档

### 性能优化指南

#### 前端优化
```tsx
// 使用React.memo优化组件渲染
const CandleChart = React.memo<CandleChartProps>(({ data, ...props }) => {
  // 组件逻辑
});

// 使用useMemo缓存计算结果
const processedData = useMemo(() => {
  return data.map(item => ({
    ...item,
    processed: expensiveCalculation(item)
  }));
}, [data]);

// 使用useCallback缓存函数
const handleDataUpdate = useCallback((newData: CandleData[]) => {
  onDataUpdate?.(newData);
}, [onDataUpdate]);
```

#### 后端优化
```javascript
// 使用数据库索引
CREATE INDEX idx_candle_data_pair_timeframe 
ON candle_data(pair, timeframe, timestamp DESC);

// 实现查询缓存
const cache = new Map();

const getCachedData = async (key, fetchFn, ttl = 60000) => {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

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

### 安全最佳实践

#### 输入验证
```javascript
// 使用joi进行输入验证
const Joi = require('joi');

const candleDataSchema = Joi.object({
  pair: Joi.string().pattern(/^[A-Z]+\/[A-Z]+$/).required(),
  timeframe: Joi.string().valid('1m', '5m', '15m', '1h', '4h', '1d').required(),
  limit: Joi.number().integer().min(1).max(1000).default(100)
});

const validateInput = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedQuery = value;
  next();
};
```

#### SQL注入防护
```javascript
// 使用参数化查询
const getCandleData = async (pair, timeframe, limit) => {
  const query = `
    SELECT * FROM candle_data 
    WHERE pair = $1 AND timeframe = $2 
    ORDER BY timestamp DESC 
    LIMIT $3
  `;
  
  const result = await pool.query(query, [pair, timeframe, limit]);
  return result.rows;
};
```

#### 认证和授权
```javascript
// JWT认证中间件
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

## 发布流程

### 版本管理

使用[语义化版本](https://semver.org/)：

- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 发布步骤

```bash
# 1. 确保主分支是最新的
git checkout main
git pull upstream main

# 2. 运行完整测试
npm run test:full
npm run build

# 3. 更新版本号
npm version patch  # 或 minor, major

# 4. 更新CHANGELOG
npm run changelog

# 5. 提交版本更新
git add .
git commit -m "chore: release version x.y.z"

# 6. 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 7. 推送到远程仓库
git push upstream main --tags

# 8. 创建GitHub Release
# 在GitHub上创建Release，包含变更日志
```

### 热修复流程

```bash
# 1. 从最新标签创建热修复分支
git checkout -b hotfix/critical-bug-fix v1.0.0

# 2. 修复问题
# 编写代码和测试

# 3. 提交修复
git commit -m "fix: 修复关键安全漏洞"

# 4. 更新版本号
npm version patch

# 5. 合并到主分支
git checkout main
git merge hotfix/critical-bug-fix

# 6. 推送和发布
git push upstream main --tags
```

## 社区参与

### 讨论和反馈

- **GitHub Issues**：报告bug和提出功能请求
- **GitHub Discussions**：技术讨论和问答
- **Discord/Slack**：实时交流（如果有）

### 文档贡献

文档同样重要，欢迎贡献：

- **API文档**：完善接口说明和示例
- **用户指南**：改进使用说明和教程
- **开发文档**：补充技术细节和最佳实践
- **翻译**：多语言支持

### 代码审查参与

即使您不提交代码，也可以参与代码审查：

- 审查其他贡献者的PR
- 提供建设性的反馈
- 测试新功能和修复

## 常见问题

### Q: 如何选择合适的Issue开始贡献？

A: 建议新贡献者从以下类型的Issue开始：
- 标记为"good first issue"的问题
- 文档改进
- 简单的bug修复
- 测试用例添加

### Q: 如何处理合并冲突？

A: 
```bash
# 1. 获取最新的上游代码
git fetch upstream
git checkout main
git merge upstream/main

# 2. 切换到您的功能分支
git checkout feature/your-feature

# 3. 变基到最新的主分支
git rebase main

# 4. 解决冲突后继续变基
git add .
git rebase --continue

# 5. 强制推送（谨慎使用）
git push origin feature/your-feature --force-with-lease
```

### Q: 如何运行特定的测试？

A:
```bash
# 运行特定测试文件
npm test -- CandleChart.test.tsx

# 运行匹配模式的测试
npm test -- --testNamePattern="should render"

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

### Q: 如何调试WebSocket连接？

A:
```javascript
// 在浏览器开发者工具中
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (error) => console.error('Error:', error));

// 监听所有事件
const originalEmit = socket.emit;
socket.emit = function(...args) {
  console.log('Emitting:', args);
  return originalEmit.apply(socket, args);
};
```

## 致谢

感谢所有为FreqTrade可视化分析工具做出贡献的开发者！您的贡献让这个项目变得更好。

### 贡献者列表

<!-- 这里会自动生成贡献者列表 -->

### 特别感谢

- FreqTrade社区提供的灵感和支持
- 所有测试用户提供的反馈和建议
- 开源社区提供的优秀工具和库

---

如果您有任何问题或建议，请随时通过GitHub Issues联系我们。我们期待您的贡献！