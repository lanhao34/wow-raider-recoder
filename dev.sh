#!/bin/bash
# 本地开发快速启动脚本

set -e

PNPM="pnpm"
if ! command -v pnpm &> /dev/null; then
  if [ -f /tmp/pnpm-local/node_modules/.bin/pnpm ]; then
    PNPM=/tmp/pnpm-local/node_modules/.bin/pnpm
  else
    echo "Installing pnpm locally..."
    npm install --prefix /tmp/pnpm-local pnpm
    PNPM=/tmp/pnpm-local/node_modules/.bin/pnpm
  fi
fi

echo "===================================="
echo " 元气养老院装备分配系统 - 开发模式"
echo "===================================="
echo ""
echo "请确保 PostgreSQL 已启动并配置："
echo "  DATABASE_URL=postgresql://guilduser:guildpass@localhost:5432/guilddb"
echo ""
echo "创建数据库（首次运行）："
echo "  createdb -U postgres guilddb"
echo "  psql -U postgres -c \"CREATE USER guilduser WITH PASSWORD 'guildpass';\""
echo "  psql -U postgres -c \"GRANT ALL ON DATABASE guilddb TO guilduser;\""
echo ""

# Install if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  $PNPM install
fi

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/backend && $PNPM exec prisma generate && cd ../..

# Run migrations
echo "Running migrations..."
cd packages/backend && $PNPM exec prisma migrate deploy && cd ../..

echo ""
echo "Starting development servers..."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""

# Start both servers
$PNPM --filter backend dev &
$PNPM --filter frontend dev &

wait
