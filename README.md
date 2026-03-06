# 元气养老院装备分配系统

## 一、项目是做什么的

这是一个**公会/团队装备分配管理**的前端单页应用（React 构建后产物），主要功能包括：

| 功能       | 说明                         | 权限     |
|------------|------------------------------|----------|
| 装备手册   | 查看副本、Boss、掉落装备列表 | 所有人   |
| 我的需求   | 成员提交装备需求、优先级     | 所有人   |
| 套装追踪   | 按成员追踪头部/肩/胸/手/腿套装收集进度 | 所有人 |
| 分配管理   | 团长进行装备分配、确认       | 仅团长   |
| 成员管理   | 团长维护成员列表、状态       | 仅团长   |
| 数据管理   | 导出/导入/清空 JSON 数据      | 仅团长   |

- **技术栈**：React + 前端构建产物（单页应用，无后端工程在本目录）。
- **数据与“数据库”**：**没有连接任何远程数据库或后端 API**。用户相关和业务数据都依赖**浏览器本地**。

---

## 二、“用户数据库”是什么（用户数据存在哪）

- **登录状态**：使用浏览器 **localStorage**，键名为 **`currentUserId`**。  
  - 登录成功时：`localStorage.setItem("currentUserId", 用户id)`  
  - 登出时：`localStorage.removeItem("currentUserId")`  
  - 刷新页面后根据 `currentUserId` 恢复“已登录”状态。

- **可登录的“用户”从哪来**：  
  代码中还有 `localStorage.getItem(l)`（`l` 为压缩后的变量名），用于读取某 key 的本地数据。结合登录/注册和“成员”数据可被导入/导出可知：  
  - **没有独立的用户数据库或后端**；  
  - 用户/成员数据由应用内的 Context 状态管理，并**持久化在浏览器 localStorage 的某个 key**（具体 key 在压缩代码中为变量，未在源码中直接暴露）。  
  因此可以认为：**“链接的用户数据库” = 浏览器 localStorage**，即“用户”和“成员”数据都保存在本机浏览器里。

---

## 三、装备信息从哪里来（有没有装备数据库）

- **装备信息不是从数据库来的**，也没有装备 API。
- 副本、Boss、掉落列表等全部来自前端代码里**硬编码的常量**（打包后变量名为 `Oa`），例如：
  - 副本：`id: "spire-of-voidshroud", name: "虚影尖塔"` 等；
  - Boss：如 `id: "avozun", name: "元首阿福扎恩"` 等；
  - 每个 Boss 下有 `loot` 数组，描述装备 id、名称、部位（head/shoulder/chest/hands/legs）、品质、是否套装等。
- 因此：**获取装备信息的“数据库” = 前端静态数据**，即打包进 `assets/index-4Wlpk5Oj.js` 里的常量，没有单独的装备库或外部数据源。

---

## 四、数据流小结

| 数据类型     | 来源/存储位置              | 说明                     |
|--------------|----------------------------|--------------------------|
| 当前登录用户 | localStorage `currentUserId` | 仅存当前用户 id          |
| 用户/成员列表、需求、分配记录 | localStorage（某 key）+ 内存 Context | 可导出/导入 JSON，无后端 |
| 副本/Boss/装备列表 | 前端 JS 常量 `Oa`         | 写死在代码里，无数据库   |

---

## 五、如何使用当前项目

1. 用浏览器打开根目录下的 **`index.html`**（或通过本地静态服务器访问）。
2. 首次使用需在登录页**注册**，注册后使用同一账号**登录**。
3. 团长可在「数据管理」中**导出 JSON** 备份，或**导入 JSON** 恢复/迁移数据；清空会重置成员、需求、分配记录。

如需接入真实用户数据库或装备数据库，需要额外开发后端和 API，并修改前端请求与持久化逻辑。

**扩展设计**：若要做「装备掉落记录 + 装备分配记录 + 在线登录」（按周、按普通/英雄/史诗三难度，弹性掉落与史诗固定 20 人 4 件等），可参考项目内的 **[DESIGN_掉落与分配记录_在线登录.md](./DESIGN_掉落与分配记录_在线登录.md)**，其中包含数据模型、流程与实现建议。

---

## 六、从 Wowhead 获取 12.0 Midnight 副本装备数据的可行性

装备手册的数据来源可以改为 [Wowhead 数据库](https://www.wowhead.com/database)，**可以**获取 12.0 Midnight 版本相关 Raids 的装备数据，但需注意以下事实和做法。

### 1. Wowhead 是否有官方 API？

- **没有**。Wowhead 不提供面向公众的官方 API，无法直接通过“接口调用”获取副本/装备列表。
- 若要从 Wowhead 拿数据，只能通过：**解析网页内容**或使用**社区编写的提取工具**。

### 2. 12.0 Midnight 的 Raids 在 Wowhead 上有没有？

- **有**。Midnight 赛季 1 的副本在 Wowhead 上已有对应页面与数据，例如：
  - **Voidspire**（6 个 Boss）：如 [The Voidspire 奖励/装备](https://www.wowhead.com/guide/midnight/raids/the-voidspire-rewards-gear-loot) 等指南页；
  - **Dreamrift**（1 个 Boss）；
  - **March on Quel'Danas**（2 个 Boss）。
- 副本/区域入口示例（Beta 数据库）：[Wowhead Beta - Midnight Raids](https://www.wowhead.com/beta/zones/midnight/raids)。  
因此，**可以**针对 12.0 Midnight 的 Raids 做装备数据获取。

### 3. 可行实现方式（供选）

| 方式 | 说明 | 注意 |
|------|------|------|
| **爬取/解析 Wowhead 页面** | 请求副本/ Boss/ 装备页面的 HTML，解析其中的列表与链接（或页面内嵌的 JSON 数据）。 | 需遵守 Wowhead 使用条款与 robots.txt，控制频率，避免对站点造成压力。 |
| **社区工具** | 使用如 [Wowhead-Extraction](https://github.com/CaligulaCa3sar/Wowhead-Extraction)（含 Raid-Loot 工具）、[wowhead-data-parser](https://github.com/matthew-tanner/wowhead-data-parser) 等，从 Wowhead 提取数据后再导入本系统。 | 依赖第三方项目维护情况，需自行校验数据格式与完整性。 |
| **暴雪官方 API** | 使用 [Blizzard 官方 WoW API](https://developers.blizzard.com/) 获取游戏内物品、副本、Boss 等。 | 数据结构与 Wowhead 不同，需要自己映射为当前装备手册的“副本 → Boss → 掉落”结构；且需申请 API Key。 |

### 4. 建议落地步骤（若要从 Wowhead 做 12.0 Midnight）

1. **确定数据范围**：只做 Midnight 三个副本（Voidspire、Dreamrift、March on Quel'Danas）的 Boss 与掉落即可。
2. **选一种获取方式**：  
   - 做**一次性/定期抓取**：用脚本解析 Wowhead 上对应副本/ Boss 页（或使用上述社区工具），导出为 JSON。  
   - 再在本项目中：用导出的 JSON 替换或扩展当前前端的“装备手册”静态数据（即替换/扩展原 `Oa` 结构），或通过「数据管理」的导入功能导入（若你扩展了导入格式支持装备手册）。
3. **合规与维护**：遵守 Wowhead 使用条款；抓取频率不宜过高；版本更新（如新 Boss、新装备）时需重新抓取或更新数据源。

结论：**装备手册从 https://www.wowhead.com/database 获取是可行的**，**也可以专门获取 12.0 Midnight 版本相关 Raids 的装备数据**，但需通过解析网页或社区工具实现，不能依赖 Wowhead 官方 API。
