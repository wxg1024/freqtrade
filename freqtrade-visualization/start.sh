#!/bin/bash

# FreqTrade 可视化分析工具启动脚本

echo "=== FreqTrade 可视化分析工具 ==="
echo "正在启动前端和后端服务..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装，请先安装 npm"
    exit 1
fi

# 安装后端依赖
echo "1. 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 启动后端服务（后台运行）
echo "2. 启动后端服务 (端口: 3001)..."
npm start &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 安装前端依赖
echo "3. 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 启动前端服务
echo "4. 启动前端服务 (端口: 5173)..."
echo ""
echo "=== 服务启动完成 ==="
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 启动前端（前台运行）
npm run dev

# 当前端停止时，也停止后端
echo "正在停止后端服务..."
kill $BACKEND_PID 2>/dev/null
echo "所有服务已停止"