# FreqTrade 可视化分析工具 - 故障排除指南

## 概述

本文档提供FreqTrade可视化分析工具常见问题的诊断和解决方案。按照问题类型分类，提供详细的排查步骤和解决方法。

## 快速诊断

### 系统健康检查

运行以下命令进行快速系统检查：

```bash
# 检查服务状态
./scripts/health-check.sh

# 或手动检查
echo "=== 后端服务状态 ==="
curl -f http://localhost:3001/api/health || echo "后端服务异常"

echo "=== 前端服务状态 ==="
curl -f http://localhost:5173 || echo "前端服务异常"

echo "=== 数据库连接 ==="
psql -h localhost -U freqtrade_user -d freqtrade -c "SELECT 1;" || echo "数据库连接异常"

echo "=== WebSocket连接 ==="
node -e "const io = require('socket.io-client'); const socket = io('http://localhost:3001'); socket.on('connect', () => { console.log('WebSocket连接正常'); process.exit(0); }); setTimeout(() => { console.log('WebSocket连接超时'); process.exit(1); }, 5000);"
```

### 日志检查

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 查看PM2日志（生产环境）
pm2 logs freqtrade-backend

# 查看系统日志
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f

# 查看浏览器控制台
# 打开开发者工具 -> Console标签
```

## 启动问题

### 后端服务无法启动

#### 症状
- 运行`npm run dev`后服务立即退出
- 显示端口占用错误
- 数据库连接失败

#### 诊断步骤

1. **检查端口占用**
```bash
# 检查3001端口是否被占用
lsof -i :3001
netstat -tlnp | grep :3001

# 如果被占用，终止进程
kill -9 <PID>
```

2. **检查环境变量**
```bash
# 验证.env文件存在且配置正确
cat backend/.env

# 检查必需的环境变量
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST); console.log('DB_PORT:', process.env.DB_PORT);"
```

3. **检查数据库连接**
```bash
# 测试数据库连接
psql -h localhost -U freqtrade_user -d freqtrade -c "\dt"

# 如果连接失败，检查PostgreSQL服务
sudo systemctl status postgresql
sudo systemctl start postgresql
```

4. **检查依赖安装**
```bash
# 重新安装依赖
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 解决方案

**端口冲突**
```bash
# 方案1：更改端口
echo "PORT=3002" >> backend/.env

# 方案2：终止占用进程
lsof -ti:3001 | xargs kill -9
```

**数据库连接问题**
```bash
# 重启PostgreSQL
sudo systemctl restart postgresql

# 重新创建数据库用户
sudo -u postgres psql
DROP USER IF EXISTS freqtrade_user;
CREATE USER freqtrade_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE freqtrade TO freqtrade_user;
\q
```

**权限问题**
```bash
# 修复文件权限
chmod +x backend/server.js
chown -R $USER:$USER backend/
```

### 前端服务无法启动

#### 症状
- Vite开发服务器启动失败
- 编译错误
- 依赖冲突

#### 诊断步骤

1. **检查Node.js版本**
```bash
# 确认Node.js版本
node --version  # 应该是18.x或更高
npm --version
```

2. **检查依赖冲突**
```bash
# 检查依赖树
npm ls

# 查找冲突
npm ls --depth=0 | grep UNMET
```

3. **检查TypeScript配置**
```bash
# 验证TypeScript配置
npx tsc --noEmit
```

#### 解决方案

**依赖问题**
```bash
# 清理并重新安装
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**TypeScript错误**
```bash
# 更新TypeScript
npm install -D typescript@latest

# 重新生成类型定义
npm run type-check
```

**Vite配置问题**
```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## 连接问题

### API连接失败

#### 症状
- 前端显示"API Error"
- 网络请求超时
- CORS错误

#### 诊断步骤

1. **检查API端点**
```bash
# 直接测试API
curl -v http://localhost:3001/api/health
curl -v http://localhost:3001/api/dashboard/stats

# 检查响应头
curl -I http://localhost:3001/api/dashboard/stats
```

2. **检查CORS配置**
```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

3. **检查网络配置**
```bash
# 检查防火墙
sudo ufw status

# 检查网络连接
ping localhost
telnet localhost 3001
```

#### 解决方案

**CORS问题**
```javascript
// 更新CORS配置
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**代理配置**
```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**网络问题**
```bash
# 重启网络服务
sudo systemctl restart networking

# 清除DNS缓存
sudo systemctl restart systemd-resolved
```

### WebSocket连接问题

#### 症状
- 实时数据不更新
- WebSocket连接断开
- 连接频繁重连

#### 诊断步骤

1. **检查WebSocket服务**
```bash
# 测试WebSocket连接
node -e "const io = require('socket.io-client'); const socket = io('http://localhost:3001'); socket.on('connect', () => console.log('Connected')); socket.on('disconnect', () => console.log('Disconnected')); socket.on('error', (err) => console.error('Error:', err));"
```

2. **检查浏览器WebSocket**
```javascript
// 在浏览器控制台中执行
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('WebSocket connected'));
socket.on('disconnect', (reason) => console.log('WebSocket disconnected:', reason));
socket.on('connect_error', (error) => console.error('Connection error:', error));
```

3. **检查服务器日志**
```bash
# 查看WebSocket相关日志
grep -i "socket\|websocket" backend/logs/app.log
```

#### 解决方案

**连接配置问题**
```javascript
// frontend/src/services/websocket.ts
const socket = io(process.env.VITE_WS_URL || 'http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

**服务器配置**
```javascript
// backend/server.js
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});
```

**代理配置（Nginx）**
```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 数据库问题

### 数据库连接失败

#### 症状
- "Database connection failed"
- 查询超时
- 认证失败

#### 诊断步骤

1. **检查PostgreSQL服务**
```bash
# 检查服务状态
sudo systemctl status postgresql

# 检查端口监听
sudo netstat -tlnp | grep :5432
```

2. **检查连接参数**
```bash
# 测试连接
psql -h localhost -p 5432 -U freqtrade_user -d freqtrade

# 检查用户权限
sudo -u postgres psql -c "\du"
```

3. **检查配置文件**
```bash
# 查看PostgreSQL配置
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep freqtrade
```

#### 解决方案

**服务启动问题**
```bash
# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 如果启动失败，检查日志
sudo journalctl -u postgresql -f
```

**认证问题**
```bash
# 重置用户密码
sudo -u postgres psql
ALTER USER freqtrade_user WITH PASSWORD 'new_password';
\q

# 更新应用配置
echo "DB_PASSWORD=new_password" >> backend/.env
```

**连接配置**
```bash
# 编辑pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 添加或修改以下行
local   freqtrade    freqtrade_user                     md5
host    freqtrade    freqtrade_user    127.0.0.1/32     md5

# 重启PostgreSQL
sudo systemctl restart postgresql
```

### 数据查询问题

#### 症状
- 查询响应缓慢
- 数据不一致
- 内存不足错误

#### 诊断步骤

1. **检查查询性能**
```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 分析查询计划
EXPLAIN ANALYZE SELECT * FROM candle_data 
WHERE pair = 'BTC/USDT' AND timeframe = '1h' 
ORDER BY timestamp DESC LIMIT 100;
```

2. **检查数据库统计**
```sql
-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes;
```

#### 解决方案

**性能优化**
```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_candle_data_pair_timeframe_timestamp 
ON candle_data(pair, timeframe, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_indicator_data_pair_timeframe_timestamp 
ON indicator_data(pair, timeframe, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_scoring_data_pair_timestamp 
ON scoring_data(pair, timestamp DESC);

-- 更新表统计信息
ANALYZE candle_data;
ANALYZE indicator_data;
ANALYZE scoring_data;

-- 清理无用数据
VACUUM ANALYZE;
```

**内存配置**
```bash
# 编辑PostgreSQL配置
sudo nano /etc/postgresql/*/main/postgresql.conf

# 调整内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# 重启服务
sudo systemctl restart postgresql
```

## 性能问题

### 前端性能问题

#### 症状
- 页面加载缓慢
- 图表渲染卡顿
- 内存泄漏

#### 诊断步骤

1. **使用浏览器性能工具**
```javascript
// 在控制台中执行
console.time('pageLoad');
// 执行操作
console.timeEnd('pageLoad');

// 检查内存使用
console.log(performance.memory);
```

2. **分析网络请求**
```bash
# 使用浏览器开发者工具
# Network标签 -> 查看请求时间和大小
# Performance标签 -> 分析渲染性能
```

3. **检查组件渲染**
```javascript
// 使用React DevTools Profiler
// 安装React DevTools浏览器扩展
// 在Profiler标签中分析组件渲染性能
```

#### 解决方案

**组件优化**
```tsx
// 使用React.memo防止不必要的重渲染
const CandleChart = React.memo<CandleChartProps>(({ data, ...props }) => {
  // 组件逻辑
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.data.length === nextProps.data.length &&
         prevProps.pair === nextProps.pair;
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

**数据分页**
```tsx
// 实现虚拟滚动
import { FixedSizeList as List } from 'react-window';

const VirtualizedTable = ({ data }: { data: any[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {/* 渲染行内容 */}
    </div>
  );

  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

**图表优化**
```tsx
// 使用Canvas而不是SVG渲染大量数据点
import { ResponsiveContainer, LineChart, Line } from 'recharts';

const OptimizedChart = ({ data }: { data: any[] }) => {
  // 数据采样，减少渲染点数
  const sampledData = useMemo(() => {
    if (data.length <= 1000) return data;
    const step = Math.ceil(data.length / 1000);
    return data.filter((_, index) => index % step === 0);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={sampledData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8"
          dot={false} // 禁用数据点，提高性能
          strokeWidth={1}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 后端性能问题

#### 症状
- API响应缓慢
- 高CPU使用率
- 内存不足

#### 诊断步骤

1. **监控系统资源**
```bash
# 检查CPU和内存使用
top
htop

# 检查进程状态
ps aux | grep node

# 检查网络连接
netstat -an | grep :3001
```

2. **分析API性能**
```bash
# 使用ab进行压力测试
ab -n 1000 -c 10 http://localhost:3001/api/dashboard/stats

# 使用curl测试响应时间
time curl http://localhost:3001/api/dashboard/stats
```

3. **检查数据库性能**
```sql
-- 查看活跃连接
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 查看锁等待
SELECT * FROM pg_locks WHERE NOT granted;
```

#### 解决方案

**缓存实现**
```javascript
// 内存缓存
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // 60秒TTL

const getCachedData = async (key, fetchFunction) => {
  let data = cache.get(key);
  if (!data) {
    data = await fetchFunction();
    cache.set(key, data);
  }
  return data;
};

// 使用示例
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await getCachedData('dashboard-stats', async () => {
      return await getDashboardStats();
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**连接池优化**
```javascript
// 优化数据库连接池
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  min: 5,  // 最小连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});
```

**查询优化**
```javascript
// 分页查询
const getCandleData = async (pair, timeframe, page = 1, limit = 100) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT * FROM candle_data 
    WHERE pair = $1 AND timeframe = $2 
    ORDER BY timestamp DESC 
    LIMIT $3 OFFSET $4
  `;
  
  const result = await pool.query(query, [pair, timeframe, limit, offset]);
  return result.rows;
};

// 批量插入
const insertCandleData = async (candleDataArray) => {
  const query = `
    INSERT INTO candle_data (pair, timeframe, timestamp, open, high, low, close, volume)
    VALUES ${candleDataArray.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ')}
    ON CONFLICT (pair, timeframe, timestamp) DO UPDATE SET
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    volume = EXCLUDED.volume
  `;
  
  const values = candleDataArray.flatMap(item => [
    item.pair, item.timeframe, item.timestamp, 
    item.open, item.high, item.low, item.close, item.volume
  ]);
  
  await pool.query(query, values);
};
```

## 部署问题

### 生产环境部署失败

#### 症状
- 构建失败
- 服务启动失败
- 静态文件404

#### 诊断步骤

1. **检查构建过程**
```bash
# 前端构建
cd frontend
npm run build

# 检查构建输出
ls -la dist/

# 后端依赖检查
cd backend
npm ci --only=production
```

2. **检查环境变量**
```bash
# 验证生产环境配置
cat backend/.env
cat frontend/.env.production

# 检查必需变量
node -e "console.log('NODE_ENV:', process.env.NODE_ENV);"
```

3. **检查服务配置**
```bash
# 检查PM2配置
pm2 describe freqtrade-backend

# 检查Nginx配置
sudo nginx -t
sudo systemctl status nginx
```

#### 解决方案

**构建问题**
```bash
# 清理并重新构建
rm -rf frontend/dist frontend/node_modules
cd frontend
npm install
npm run build

# 检查构建错误
npm run build 2>&1 | tee build.log
```

**环境配置**
```bash
# 创建生产环境配置
cat > backend/.env.production << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freqtrade
DB_USER=freqtrade_user
DB_PASSWORD=secure_password
DB_SSL=true
CORS_ORIGIN=https://your-domain.com
EOF
```

**服务配置**
```bash
# PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'freqtrade-backend',
    script: 'server.js',
    cwd: '/var/www/freqtrade-visualization/backend',
    env: {
      NODE_ENV: 'production'
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: '/var/log/freqtrade/error.log',
    out_file: '/var/log/freqtrade/out.log',
    log_file: '/var/log/freqtrade/combined.log'
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
```

### SSL/HTTPS问题

#### 症状
- SSL证书错误
- 混合内容警告
- WebSocket连接失败

#### 诊断步骤

1. **检查SSL证书**
```bash
# 检查证书有效性
openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout

# 检查证书链
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

2. **检查Nginx配置**
```bash
# 测试配置
sudo nginx -t

# 检查SSL配置
sudo nginx -T | grep -A 20 "ssl_certificate"
```

#### 解决方案

**证书更新**
```bash
# 使用Let's Encrypt更新证书
sudo certbot renew --dry-run
sudo certbot renew

# 重启Nginx
sudo systemctl reload nginx
```

**混合内容修复**
```javascript
// 前端配置
// .env.production
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=https://your-domain.com

// 确保所有请求使用HTTPS
const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## 监控和日志

### 日志分析

#### 常见错误模式

```bash
# 查找错误日志
grep -i "error\|exception\|failed" backend/logs/app.log

# 查找性能问题
grep -i "slow\|timeout\|memory" backend/logs/app.log

# 查找数据库问题
grep -i "database\|connection\|query" backend/logs/app.log

# 统计错误频率
grep -c "ERROR" backend/logs/app.log
```

#### 日志分析脚本

```bash
#!/bin/bash
# log-analyzer.sh

LOG_FILE="backend/logs/app.log"
DATE=$(date +%Y-%m-%d)

echo "=== 今日错误统计 ==="
grep "$DATE" $LOG_FILE | grep -c "ERROR"

echo "=== 最近的错误 ==="
grep "$DATE" $LOG_FILE | grep "ERROR" | tail -5

echo "=== API响应时间统计 ==="
grep "$DATE" $LOG_FILE | grep "Response time" | awk '{print $NF}' | sort -n | tail -10

echo "=== 数据库连接统计 ==="
grep "$DATE" $LOG_FILE | grep -c "Database connected"
grep "$DATE" $LOG_FILE | grep -c "Database connection failed"
```

### 性能监控

#### 系统监控脚本

```bash
#!/bin/bash
# monitor.sh

echo "=== 系统资源使用情况 ==="
echo "CPU使用率:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo "内存使用率:"
free | grep Mem | awk '{printf "%.2f%%\n", $3/$2 * 100.0}'

echo "磁盘使用率:"
df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{print $5 " " $1}'

echo "=== 服务状态 ==="
echo "后端服务:"
pm2 describe freqtrade-backend | grep status

echo "数据库服务:"
sudo systemctl is-active postgresql

echo "Web服务器:"
sudo systemctl is-active nginx

echo "=== 网络连接 ==="
echo "活跃连接数:"
netstat -an | grep :3001 | wc -l

echo "WebSocket连接数:"
netstat -an | grep :3001 | grep ESTABLISHED | wc -l
```

### 自动化监控

#### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

SEND_ALERT=false
ALERT_EMAIL="admin@your-domain.com"

# 检查后端服务
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "ERROR: 后端服务异常"
    SEND_ALERT=true
fi

# 检查数据库
if ! psql -h localhost -U freqtrade_user -d freqtrade -c "SELECT 1;" > /dev/null 2>&1; then
    echo "ERROR: 数据库连接异常"
    SEND_ALERT=true
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
if [ $DISK_USAGE -gt 90 ]; then
    echo "WARNING: 磁盘使用率过高: ${DISK_USAGE}%"
    SEND_ALERT=true
fi

# 检查内存使用
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "WARNING: 内存使用率过高: ${MEM_USAGE}%"
    SEND_ALERT=true
fi

# 发送告警
if [ "$SEND_ALERT" = true ]; then
    echo "系统异常，发送告警邮件到 $ALERT_EMAIL"
    # 这里可以集成邮件发送或其他告警方式
fi
```

#### 定时任务配置

```bash
# 添加到crontab
crontab -e

# 每5分钟检查一次健康状态
*/5 * * * * /path/to/health-check.sh

# 每小时生成性能报告
0 * * * * /path/to/monitor.sh >> /var/log/freqtrade/monitor.log

# 每天清理旧日志
0 2 * * * find /var/log/freqtrade -name "*.log" -mtime +7 -delete
```

## 恢复程序

### 服务恢复

#### 自动恢复脚本

```bash
#!/bin/bash
# auto-recovery.sh

echo "开始服务恢复程序..."

# 检查并重启PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "重启PostgreSQL服务..."
    sudo systemctl restart postgresql
    sleep 5
fi

# 检查并重启后端服务
if ! pm2 describe freqtrade-backend > /dev/null 2>&1; then
    echo "重启后端服务..."
    cd /var/www/freqtrade-visualization/backend
    pm2 start ecosystem.config.js
    sleep 5
fi

# 检查并重启Nginx
if ! systemctl is-active --quiet nginx; then
    echo "重启Nginx服务..."
    sudo systemctl restart nginx
    sleep 5
fi

# 验证服务状态
echo "验证服务状态..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ 后端服务正常"
else
    echo "✗ 后端服务异常"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✓ 前端服务正常"
else
    echo "✗ 前端服务异常"
fi

echo "服务恢复程序完成"
```

### 数据恢复

#### 数据库恢复

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE="$1"
DB_NAME="freqtrade"
DB_USER="freqtrade_user"

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "开始数据库恢复..."

# 停止应用服务
echo "停止应用服务..."
pm2 stop freqtrade-backend

# 删除现有数据库
echo "删除现有数据库..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 恢复数据
echo "恢复数据..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h localhost -U $DB_USER -d $DB_NAME
else
    psql -h localhost -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
fi

# 重启应用服务
echo "重启应用服务..."
pm2 start freqtrade-backend

echo "数据库恢复完成"
```

## 联系支持

如果以上解决方案都无法解决您的问题，请通过以下方式获取帮助：

### 报告问题

1. **GitHub Issues**: [创建新的Issue](https://github.com/your-repo/freqtrade-visualization/issues)
2. **提供以下信息**：
   - 操作系统和版本
   - Node.js版本
   - PostgreSQL版本
   - 错误日志
   - 复现步骤
   - 期望行为

### 获取帮助

1. **文档**: 查看[完整文档](./README.md)
2. **社区**: 加入FreqTrade社区讨论
3. **邮件**: 发送邮件到 support@your-domain.com

### 紧急支持

对于生产环境的紧急问题：

1. 立即运行自动恢复脚本
2. 收集相关日志和错误信息
3. 通过紧急联系方式报告问题
4. 如有必要，回滚到上一个稳定版本

---

**注意**: 本故障排除指南会持续更新，如果您遇到新的问题或有改进建议，请通过GitHub Issues反馈。