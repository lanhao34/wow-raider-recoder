// 从 JSON 文件导入装备数据
import wowData from './wow-data.json';

export interface WoWItem {
  id: string;
  name: string;
  nameZh?: string;
  slot: string;
  quality: string;
  itemLevel: number;
  isTier?: boolean;
  tierSet?: string;
  armorType?: string;
}

export interface WoWBoss {
  id: string;
  name: string;
  nameZh?: string;
  loot: WoWItem[];
}

export interface WoWRaid {
  id: string;
  name: string;
  nameZh?: string;
  expansion: string;
  bosses: WoWBoss[];
}

export const RAIDS: WoWRaid[] = wowData.raids;
export const CLASS_ARMOR_TYPES: Record<string, string[]> = wowData.classArmorTypes;

// 扁平化所有装备用于搜索
export const ALL_ITEMS = RAIDS.flatMap((raid) =>
  raid.bosses.flatMap((boss) =>
    boss.loot.map((item) => ({
      ...item,
      raidId: raid.id,
      raidName: raid.nameZh || raid.name,
      bossId: boss.id,
      bossName: boss.nameZh || boss.name,
    }))
  )
);

// 品质颜色映射
export const QUALITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
};

// 品质边框
export const QUALITY_BORDERS: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-green-600',
  rare: 'border-blue-600',
  epic: 'border-purple-600',
  legendary: 'border-orange-600',
};

// 品质背景
export const QUALITY_BG: Record<string, string> = {
  common: 'bg-gray-900/30',
  uncommon: 'bg-green-900/20',
  rare: 'bg-blue-900/20',
  epic: 'bg-purple-900/20',
  legendary: 'bg-orange-900/20',
};
