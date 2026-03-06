# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导说明。

## 项目概述

**元气养老院装备分配系统** — 魔兽世界公会装备分配管理的前端单页应用（React 构建产物；原始 TypeScript/React 源码不在本目录中）。

## 运行方式

直接用浏览器打开 `index.html`，或通过任意静态文件服务器访问：

```bash
python3 -m http.server 8080
# 然后打开 http://localhost:8080
```

无需构建步骤，无需安装依赖——这是一个编译好的发布版本。

## 项目结构

```
index.html                  # 入口文件
assets/
  index-4Wlpk5Oj.js        # 完整 React 打包文件（压缩后，约 479 KB）
  index-DPgO6gfK.css        # 样式文件（约 87 KB）
```

**无后端，无远程 API，无数据库。** 所有数据均在客户端处理：

| 数据类型 | 存储位置 |
|----------|----------|
| 登录状态 | `localStorage["currentUserId"]` |
| 成员、需求、分配记录 | `localStorage`（单一 key，JSON 格式） |
| 副本 / Boss / 装备列表 | JS 打包文件中的硬编码常量 `Oa` |

**基于角色的权限控制**：登录身份决定团长或成员权限。团长额外拥有分配管理、成员管理和数据管理（导出/导入/清空 JSON）功能。

## 主要功能模块

- **装备手册** — 副本 → Boss → 掉落装备列表（只读，所有用户可见）
- **我的需求** — 成员提交装备需求与优先级
- **套装追踪** — 按成员追踪头部/肩/胸/手/腿套装收集进度
- **分配管理** — 团长进行装备分配与确认（仅团长）
- **成员管理 / 数据管理** — 仅团长：维护成员列表及 JSON 导出/导入/重置

## 扩展设计（设计文档）

`DESIGN_掉落与分配记录_在线登录.md` 包含完整的后端扩展设计方案：

- **在线登录**：基于 Token 的身份认证 + 服务端数据持久化
- **掉落记录**（按周/副本/Boss/难度）：`raid_schedules → schedule_raids → raid_kills → drops`
- **分配记录**：`drops → distributions → members`
- **掉落件数规则**：普通/英雄使用弹性公式（`floor(参与人数 / 5)`）；史诗固定 20 人 / 每 Boss 4 件
- **CD 周期**：按 `week_id`（如 `2025-W12`）区分每周，防止重复记录

扩展推荐技术栈：任意后端语言（Node/Python/Go）+ PostgreSQL 或 MongoDB，REST 或 GraphQL 接口，现有 React 前端改为调用 API。

## 装备数据来源

装备数据（魔兽世界 12.0 Midnight 的虚影尖塔、梦魇裂口、奎尔达纳斯进军三个副本）硬编码在 JS 打包文件中。如需更新：
- 解析 Wowhead 页面或使用社区提取工具（Wowhead 无官方 API）
- 或使用 [暴雪官方 WoW API](https://developers.blizzard.com/)（需申请 API Key，数据结构不同）
- 替换/扩展打包文件中的 `Oa` 常量，或扩展数据管理的导入格式以支持装备手册更新
