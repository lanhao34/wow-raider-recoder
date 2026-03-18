#!/bin/bash
# 装备管理系统 - 紧急修复脚本
# 使用方法：SSH 登录后执行 bash fix-login.sh

set -e

echo "======================================"
echo "  元气养老院装备管理系统 - 修复脚本"
echo "======================================"
echo ""

cd /home/admin/.openclaw/workspace/wow-raider-recoder || exit 1

# 1. 检查 Docker 容器状态
echo "📦 检查 Docker 容器状态..."
docker ps -a --filter "name=guild_"

# 2. 查看后端容器日志（最近 50 行）
echo ""
echo " 查看后端容器日志..."
docker logs --tail 50 guild_backend 2>/dev/null || echo "后端容器未运行"

# 3. 重启所有服务
echo ""
echo "🔄 重启所有服务..."
docker-compose down
docker-compose up -d

# 4. 等待服务启动
echo ""
echo "⏳ 等待服务启动 (10 秒)..."
sleep 10

# 5. 检查服务状态
echo ""
echo "✅ 检查服务状态..."
docker ps --filter "name=guild_"

# 6. 测试健康检查
echo ""
echo " 测试后端健康检查..."
curl -s http://localhost:3001/api/health || echo "后端仍未响应"

echo ""
echo "======================================"
echo "  修复完成！请尝试重新登录"
echo "  访问：http://106.15.66.108:8088"
echo "======================================"
