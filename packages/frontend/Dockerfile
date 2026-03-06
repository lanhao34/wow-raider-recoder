FROM node:20-alpine AS builder

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm

# Copy shared package
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src/
COPY packages/shared/tsconfig.json ./packages/shared/

# Copy frontend
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/frontend/src ./packages/frontend/src/
COPY packages/frontend/index.html ./packages/frontend/
COPY packages/frontend/vite.config.ts ./packages/frontend/
COPY packages/frontend/tailwind.config.js ./packages/frontend/
COPY packages/frontend/postcss.config.js ./packages/frontend/
COPY packages/frontend/tsconfig.json ./packages/frontend/

WORKDIR /workspace/packages/frontend

RUN pnpm install
RUN pnpm build

FROM nginx:alpine AS runtime

COPY --from=builder /workspace/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
