# FreqTrade 可视化分析工具 - 部署指南

## 概述

本文档提供FreqTrade可视化分析工具的完整部署指南，包括本地部署、生产环境部署和云平台部署等多种方案。

## 部署架构

### 基础架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   负载均衡器    │    │   Web服务器     │    │   数据库服务器  │
│   (Nginx)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 80/443  │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   静态文件服务  │
                       │   (React Build) │
                       │   Port: 80/443  │
                       └─────────────────┘
```

## 本地部署

### 快速启动

#### 使用启动脚本
```bash
cd freqtrade-visualization
chmod +x start.sh
./start.sh
```

#### 手动启动
```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端（新终端）
cd frontend
npm install
npm run dev
```

### 环境配置

#### 后端环境变量 (.env)
```env
# 服务配置
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freqtrade
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false

# CORS配置
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# WebSocket配置
WS_HEARTBEAT_INTERVAL=25000
WS_HEARTBEAT_TIMEOUT=60000
WS_MAX_CONNECTIONS=100

# 日志配置
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

#### 前端环境变量 (.env)
```env
# API配置
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001

# 应用配置
VITE_APP_TITLE=FreqTrade Dashboard
VITE_APP_VERSION=1.0.0

# 开发配置
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug
VITE_MOCK_DATA=false
```

## 生产环境部署

### 系统要求

#### 硬件要求
- **CPU**: 2核心或以上
- **内存**: 4GB或以上
- **存储**: 20GB可用空间
- **网络**: 稳定的互联网连接

#### 软件要求
- **操作系统**: Ubuntu 20.04 LTS, CentOS 8, 或类似Linux发行版
- **Node.js**: 18.20.5 LTS
- **PostgreSQL**: 12.0+
- **Nginx**: 1.18+
- **PM2**: 5.0+ (进程管理)

### 服务器准备

#### 1. 系统更新
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2. 安装Node.js
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 3. 安装PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE freqtrade;
CREATE USER freqtrade_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE freqtrade TO freqtrade_user;
\q
```

#### 4. 安装Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 5. 安装PM2
```bash
npm install -g pm2
```

### 应用部署

#### 1. 代码部署
```bash
# 创建应用目录
sudo mkdir -p /var/www/freqtrade-visualization
sudo chown $USER:$USER /var/www/freqtrade-visualization

# 复制代码
cp -r freqtrade-visualization/* /var/www/freqtrade-visualization/
cd /var/www/freqtrade-visualization
```

#### 2. 后端部署
```bash
cd backend

# 安装依赖
npm ci --only=production

# 创建生产环境配置
cat > .env << EOF
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=freqtrade
DB_USER=freqtrade_user
DB_PASSWORD=secure_password
DB_SSL=true

CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

WS_HEARTBEAT_INTERVAL=25000
WS_HEARTBEAT_TIMEOUT=60000
WS_MAX_CONNECTIONS=1000

LOG_LEVEL=info
LOG_FILE=/var/log/freqtrade-visualization/app.log
EOF

# 创建日志目录
sudo mkdir -p /var/log/freqtrade-visualization
sudo chown $USER:$USER /var/log/freqtrade-visualization

# 使用PM2启动
pm2 start server.js --name "freqtrade-backend"
pm2 save
pm2 startup
```

#### 3. 前端构建和部署
```bash
cd ../frontend

# 安装依赖
npm ci

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=https://your-domain.com

VITE_APP_TITLE=FreqTrade Dashboard
VITE_APP_VERSION=1.0.0

VITE_DEV_MODE=false
VITE_LOG_LEVEL=error
VITE_MOCK_DATA=false
EOF

# 构建生产版本
npm run build

# 复制构建文件到Nginx目录
sudo cp -r dist/* /var/www/html/
```

### Nginx配置

#### 创建站点配置
```bash
sudo nano /etc/nginx/sites-available/freqtrade-visualization
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 静态文件服务
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket代理
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
    
    # 日志配置
    access_log /var/log/nginx/freqtrade-access.log;
    error_log /var/log/nginx/freqtrade-error.log;
}
```

#### 启用站点
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/freqtrade-visualization /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### SSL证书配置

#### 使用Let's Encrypt
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker部署

### Docker Compose配置

#### docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:14-alpine
    container_name: freqtrade-db
    environment:
      POSTGRES_DB: freqtrade
      POSTGRES_USER: freqtrade_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - freqtrade-network
    restart: unless-stopped

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: freqtrade-backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: freqtrade
      DB_USER: freqtrade_user
      DB_PASSWORD: secure_password
      CORS_ORIGIN: https://your-domain.com
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    networks:
      - freqtrade-network
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://your-domain.com/api
        VITE_WS_URL: https://your-domain.com
    container_name: freqtrade-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - freqtrade-network
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl

volumes:
  postgres_data:

networks:
  freqtrade-network:
    driver: bridge
```

#### 后端Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制依赖和代码
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# 创建日志目录
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3001

CMD ["node", "server.js"]
```

#### 前端Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建参数
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# 构建应用
RUN npm run build

# 生产镜像
FROM nginx:alpine AS runtime

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

#### 部署命令
```bash
# 构建和启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 更新服务
docker-compose pull
docker-compose up -d
```

## 云平台部署

### Vercel部署（前端）

#### vercel.json配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-domain.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-domain.com/api",
    "VITE_WS_URL": "https://your-backend-domain.com"
  }
}
```

#### 部署步骤
```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd frontend
vercel --prod
```

### Railway部署（后端）

#### railway.json配置
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

#### 环境变量配置
```bash
# 在Railway控制台设置环境变量
NODE_ENV=production
PORT=3001
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=freqtrade
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=true
```

### AWS部署

#### EC2部署
```bash
# 创建EC2实例
# 选择Ubuntu 20.04 LTS
# 配置安全组（开放80, 443, 3001端口）

# 连接到实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 按照生产环境部署步骤进行安装
```

#### RDS数据库
```bash
# 创建RDS PostgreSQL实例
# 配置安全组允许EC2访问
# 更新应用配置使用RDS端点
```

#### CloudFront CDN
```bash
# 创建CloudFront分发
# 配置源为S3存储桶（静态文件）或EC2（动态内容）
# 配置SSL证书
```

## 监控和维护

### 系统监控

#### PM2监控
```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs freqtrade-backend

# 重启应用
pm2 restart freqtrade-backend

# 监控面板
pm2 monit
```

#### 系统资源监控
```bash
# 安装htop
sudo apt install htop -y

# 监控系统资源
htop

# 磁盘使用情况
df -h

# 内存使用情况
free -h
```

### 日志管理

#### 日志轮转配置
```bash
# 创建logrotate配置
sudo nano /etc/logrotate.d/freqtrade-visualization
```

```
/var/log/freqtrade-visualization/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload freqtrade-backend
    endscript
}
```

### 备份策略

#### 数据库备份
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/freqtrade"
DB_NAME="freqtrade"
DB_USER="freqtrade_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/freqtrade_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/freqtrade_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: freqtrade_$DATE.sql.gz"
```

#### 定时备份
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 更新部署

#### 零停机更新
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# 拉取最新代码
git pull origin main

# 更新后端
cd backend
npm ci --only=production
pm2 reload freqtrade-backend

# 更新前端
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/html/

# 重启Nginx
sudo systemctl reload nginx

echo "Deployment completed successfully!"
```

### 故障恢复

#### 服务恢复脚本
```bash
#!/bin/bash
# recovery.sh

echo "Starting service recovery..."

# 检查并重启PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "Restarting PostgreSQL..."
    sudo systemctl restart postgresql
fi

# 检查并重启后端服务
if ! pm2 describe freqtrade-backend > /dev/null 2>&1; then
    echo "Restarting backend service..."
    cd /var/www/freqtrade-visualization/backend
    pm2 start server.js --name "freqtrade-backend"
fi

# 检查并重启Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
fi

echo "Service recovery completed!"
```

## 安全配置

### 防火墙配置
```bash
# 安装ufw
sudo apt install ufw -y

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许SSH
sudo ufw allow ssh

# 允许HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 启用防火墙
sudo ufw enable
```

### 系统安全
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装fail2ban
sudo apt install fail2ban -y

# 配置SSH安全
sudo nano /etc/ssh/sshd_config
# 禁用root登录
# PermitRootLogin no
# 修改默认端口
# Port 2222

# 重启SSH服务
sudo systemctl restart ssh
```

### 应用安全
```bash
# 设置文件权限
sudo chown -R $USER:$USER /var/www/freqtrade-visualization
sudo chmod -R 755 /var/www/freqtrade-visualization
sudo chmod 600 /var/www/freqtrade-visualization/backend/.env

# 限制数据库访问
# 在PostgreSQL中创建只读用户用于应用连接
```

## 性能优化

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_candle_data_pair_timeframe_timestamp 
ON candle_data(pair, timeframe, timestamp DESC);

CREATE INDEX idx_indicator_data_pair_timeframe_timestamp 
ON indicator_data(pair, timeframe, timestamp DESC);

CREATE INDEX idx_scoring_data_pair_timestamp 
ON scoring_data(pair, timestamp DESC);

-- 分析表统计信息
ANALYZE candle_data;
ANALYZE indicator_data;
ANALYZE scoring_data;
```

### 缓存配置
```bash
# 安装Redis（可选）
sudo apt install redis-server -y

# 配置Redis
sudo nano /etc/redis/redis.conf
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# 重启Redis
sudo systemctl restart redis
```

### CDN配置
```nginx
# 在Nginx中配置静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3001

# 检查日志
pm2 logs freqtrade-backend
sudo journalctl -u nginx -f
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
psql -h localhost -U freqtrade_user -d freqtrade -c "SELECT 1;"

# 检查PostgreSQL状态
sudo systemctl status postgresql
```

#### 3. 前端无法访问API
```bash
# 检查Nginx配置
sudo nginx -t

# 检查代理配置
curl -I http://localhost/api/dashboard/stats
```

### 性能问题

#### 1. 响应缓慢
```bash
# 检查系统负载
top
iostat 1

# 检查数据库性能
# 在PostgreSQL中执行
SELECT * FROM pg_stat_activity;
```

#### 2. 内存不足
```bash
# 检查内存使用
free -h

# 检查进程内存使用
ps aux --sort=-%mem | head

# 配置swap（如果需要）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 总结

本部署指南涵盖了FreqTrade可视化分析工具的完整部署流程，包括：

1. **本地开发环境**：快速启动和调试
2. **生产环境部署**：完整的服务器配置和优化
3. **容器化部署**：使用Docker的现代化部署方案
4. **云平台部署**：利用云服务的弹性和可扩展性
5. **监控和维护**：确保系统稳定运行
6. **安全配置**：保护系统和数据安全
7. **性能优化**：提升系统响应速度和处理能力

选择适合您需求的部署方案，并根据实际情况调整配置参数。建议在生产环境中实施完整的监控、备份和安全措施。