FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install pnpm
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY src ./src/
COPY tsconfig.json ./

RUN pnpm exec prisma generate
RUN pnpm build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl

RUN npm install -g pnpm

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install
RUN pnpm exec prisma generate
RUN pnpm prune --prod

COPY --from=builder /app/dist ./dist/

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
