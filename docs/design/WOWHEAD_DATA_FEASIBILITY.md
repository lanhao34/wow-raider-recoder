# 从 Wowhead 获取 12.0 Midnight 副本装备数据的可行性

装备手册的数据来源可以改为 [Wowhead 数据库](https://www.wowhead.com/database)，**可以**获取 12.0 Midnight 版本相关 Raids 的装备数据，但需注意以下事实和做法。

## 1. Wowhead 是否有官方 API？

- **没有**。Wowhead 不提供面向公众的官方 API，无法直接通过“接口调用”获取副本/装备列表。
- 若要从 Wowhead 拿数据，只能通过：**解析网页内容**或使用**社区编写的提取工具**。

## 2. 12.0 Midnight 的 Raids 在 Wowhead 上有没有？

- **有**。Midnight 赛季 1 的副本在 Wowhead 上已有对应页面与数据，例如：
  - **Voidspire**（6 个 Boss）：如 [The Voidspire 奖励/装备](https://www.wowhead.com/guide/midnight/raids/the-voidspire-rewards-gear-loot) 等指南页；
  - **Dreamrift**（1 个 Boss）；
  - **March on Quel'Danas**（2 个 Boss）。
- 副本/区域入口示例（Beta 数据库）：[Wowhead Beta - Midnight Raids](https://www.wowhead.com/beta/zones/midnight/raids)。  
因此，**可以**针对 12.0 Midnight 的 Raids 做装备数据获取。

## 3. 可行实现方式（供选）

| 方式 | 说明 | 注意 |
|------|------|------|
| **爬取/解析 Wowhead 页面** | 请求副本/ Boss/ 装备页面的 HTML，解析其中的列表与链接（或页面内嵌的 JSON 数据）。 | 需遵守 Wowhead 使用条款与 robots.txt，控制频率，避免对站点造成压力。 |
| **社区工具** | 使用如 [Wowhead-Extraction](https://github.com/CaligulaCa3sar/Wowhead-Extraction)（含 Raid-Loot 工具）、[wowhead-data-parser](https://github.com/matthew-tanner/wowhead-data-parser) 等，从 Wowhead 提取数据后再导入本系统。 | 依赖第三方项目维护情况，需自行校验数据格式与完整性。 |
| **暴雪官方 API** | 使用 [Blizzard 官方 WoW API](https://developers.blizzard.com/) 获取游戏内物品、副本、Boss 等。 | 数据结构与 Wowhead 不同，需要自己映射为当前装备手册的“副本 → Boss → 掉落”结构；且需申请 API Key。 |

## 4. 建议落地步骤（若要从 Wowhead 做 12.0 Midnight）

1. **确定数据范围**：只做 Midnight 三个副本（Voidspire、Dreamrift、March on Quel'Danas）的 Boss 与掉落即可。
2. **选一种获取方式**：  
   - 做**一次性/定期抓取**：用脚本解析 Wowhead 上对应副本/ Boss 页（或使用上述社区工具），导出为 JSON。  
   - 再在本项目中：用导出的 JSON 替换或扩展当前前端的“装备手册”静态数据（即替换/扩展原 `Oa` 结构），或通过「数据管理」的导入功能导入（若你扩展了导入格式支持装备手册）。
3. **合规与维护**：遵守 Wowhead 使用条款；抓取频率不宜过高；版本更新（如新 Boss、新装备）时需重新抓取或更新数据源。

结论：**装备手册从 https://www.wowhead.com/database 获取是可行的**，**也可以专门获取 12.0 Midnight 版本相关 Raids 的装备数据**，但需通过解析网页或社区工具实现，不能依赖 Wowhead 官方 API。
