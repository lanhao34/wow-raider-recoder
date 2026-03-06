# 元气养老院装备分配系统 v2.0

全栈重建版本 — React + Node.js + PostgreSQL

---

## 快速启动（Docker，推荐）

```bash
docker compose up -d
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001

首次启动约需 2-3 分钟（构建镜像 + 数据库迁移）。

---

## 本地开发

### 前置条件

- Node.js 20+
- PostgreSQL 14+
- pnpm（或通过 npx）

### 数据库配置

```bash
# 创建用户和数据库（仅首次）
createdb -U postgres guilddb
psql -U postgres -c "CREATE USER guilduser WITH PASSWORD 'guildpass';"
psql -U postgres -c "GRANT ALL ON DATABASE guilddb TO guilduser;"
```

### 启动

```bash
# 安装依赖 + 数据库迁移 + 启动开发服务器
bash dev.sh
```

或手动：

```bash
pnpm install
cd packages/backend && pnpm exec prisma migrate deploy && cd ../..
pnpm --filter backend dev &
pnpm --filter frontend dev
```

---

## 项目结构

```
packages/
├── shared/          # 共享 TypeScript 类型 + 装备静态数据
│   └── src/
│       ├── types.ts         # 所有类型定义
│       └── equipmentData.ts # 3 副本 / 9 Boss / 49 件装备
├── backend/         # Express + Prisma + JWT
│   ├── src/
│   │   ├── routes/   # auth/members/schedules/raidKills/drops/distributions/requirements
│   │   ├── middleware/auth.ts
│   │   └── utils/weekId.ts
│   └── prisma/schema.prisma
└── frontend/        # React + Vite + Tailwind CSS
    └── src/
        ├── pages/    # 7 个页面
        ├── api/      # API 封装（axios）
        └── store/    # Zustand 状态
```

---

## 功能说明

### 所有用户
- 登录/注册
- 装备手册（3 副本 · 9 Boss · 49 件装备，只读）
- 我的需求（提交装备需求与优先级）
- 套装追踪（5 件套装收集进度）

### 仅团长
- 日程日历（月视图，点日期创建/进入 Raid 日程）
- 日程详情（选副本+难度 → 点 Boss 标记击杀 → 录入掉落 → 分配给成员）
- 成员管理（CRUD + 职业/状态/团长权限）
- 数据管理（导出/导入 JSON）

---

## API 文档

所有请求需要 `Authorization: Bearer <token>` 头（除 `/api/auth/*`）

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 无 | 注册 |
| POST | /api/auth/login | 无 | 登录 |
| GET  | /api/auth/me | 用户 | 当前用户信息 |
| GET  | /api/members | 用户 | 成员列表 |
| POST | /api/members | 团长 | 添加成员 |
| PUT  | /api/members/:id | 团长 | 更新成员 |
| DELETE | /api/members/:id | 团长 | 删除成员 |
| GET  | /api/schedules | 用户 | 日程列表（?week= 或 ?month=） |
| POST | /api/schedules | 团长 | 创建日程 |
| GET  | /api/schedules/:id | 用户 | 日程详情 |
| POST | /api/schedules/:id/raids | 团长 | 添加团本到日程 |
| POST | /api/raid-kills | 团长 | 记录 Boss 击杀 |
| POST | /api/drops | 团长 | 批量录入掉落 |
| POST | /api/distributions | 团长 | 分配装备 |
| GET/POST/DELETE | /api/requirements | 用户 | 装备需求管理 |
| GET  | /api/requirements/tier-progress | 用户 | 套装进度 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态 | Zustand |
| 路由 | React Router v6 |
| HTTP | Axios |
| 后端 | Node.js + Express + TypeScript |
| ORM  | Prisma |
| 数据库 | PostgreSQL 16 |
| 认证 | JWT (30 天有效期) |
| 容器 | Docker + Docker Compose |

---

## 掉落件数计算

- **史诗**：固定 4 件/Boss（+ 额外掉落）
- **普通/英雄**：`max(1, floor(参与人数 / 5))` + 额外掉落
- 例：20 人普通 → 4 件；15 人英雄 → 3 件
