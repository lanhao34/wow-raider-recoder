# 元气养老院装备分配系统 v2.0

全栈重建版本 — React + Node.js + PostgreSQL

---

## 1. 生产环境部署（Prod 模式）

**适用场景**：在阿里云等公网服务器上进行正式部署发版，追求极致稳定和隔离。

```bash
docker-compose up -d --build
```

- 前端：`http://服务器IP:8088` (由 Nginx 承载，只挂载纯静态页面)
- 后端 API：内部 `3001` 端口
- **工作机制**：每次改动代码都需要带 `--build` 重新执行命令打出包含只读新代码的镜像包。借助强大的 Docker Layer Caching 机制，日常增量代码改动的 Build 更新仅需 **1-3 秒**。

---

## 2. 本地开发环境（Dev 模式）

**适用场景**：在 Mac/Windows 本地日常敲代码开发，追求保存代码后**毫秒级触发热更新（Hot Reload）**，完美隔绝宿主机操作系统的各类奇葩报错。

```bash
docker-compose -f docker-compose.dev.yml up -d
```

- 前端热更新地址：`http://localhost:5173`
- 后端 API 地址：`http://localhost:3001`
- **工作机制**：完全剥离了宿主机原生的 Node.js 环境。通过向容器内挂载你的源码目录，由 Alpine Linux 容器底层的 `ts-node-dev` 和 `vite` 来监视并热更新代码。代码改完保存后浏览器即刻生效，**绝不需要重新 Build 镜像**。

> **💡 数据同步小提示**：如果想要给本地开发环境灌入你们公网服务器（Prod）的真实数据，请登录你的服务器 Web 界面，进入【数据管理】->【导出 JSON】，然后再回到本地 `localhost:5173` 开发版界面的【数据管理】点击【导入 JSON】进行无损同步（请放心，这完全不影响线上数据库环境）。

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

---

## 详细文档指南

为了保持本说明文件的简洁，详细的系统设计、权限模型与历史开发记录已归档至 `docs/` 目录中：

- **设计与需求**：
  - [权限模型说明](./docs/design/PERMISSION_MODEL.md)
  - [核心需求文档](./docs/design/REQUIREMENTS.md)
  - [掉落与分配在线设计](./docs/design/LOOT_SYSTEM_DESIGN.md)
  - [引入Wowhead数据的可行性研究](./docs/design/WOWHEAD_DATA_FEASIBILITY.md)
- **开发与部署历史**：
  - [项目迭代与教训总结](./docs/history/ITERATION_HISTORY.md)
- **用户手册**：
  - [系统使用指南](./docs/guides/USER_GUIDE.md)
