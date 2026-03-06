FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY src ./src/
COPY tsconfig.json ./

RUN pnpm build
RUN pnpm exec prisma generate

FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install --prod
RUN pnpm exec prisma generate

COPY --from=builder /app/dist ./dist/

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
