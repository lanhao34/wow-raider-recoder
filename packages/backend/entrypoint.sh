#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma@5.10.2 migrate deploy

echo "Starting backend server..."
exec node dist/index.js
