// 从 JSON 文件导入装备数据
import wowData from './wow-data.json';

export interface WoWItem {
  id: string;
  name?: string;
  nameZh?: string;
  slot: string;
  quality: string;
  itemLevel: number;
  isTier?: boolean;
  tierSet?: string;
  armorType?: string;
  weaponType?: string;
}

export interface WoWBoss {
  id: string;
  name?: string;
  nameZh?: string;
  loot: WoWItem[];
}

export interface WoWRaid {
  id: string;
  name?: string;
  nameZh?: string;
  expansion: string;
  bosses: WoWBoss[];
}

export const RAIDS: WoWRaid[] = wowData.raids;
export const CLASS_ARMOR_TYPES: Record<string, string[]> = wowData.classArmorTypes;

export const CLASS_WEAPON_TYPES: Record<string, string[]> = {
  warrior: ['axe_1h', 'axe_2h', 'bow', 'gun', 'mace_1h', 'mace_2h', 'polearm', 'sword_1h', 'sword_2h', 'staff', 'fist_weapon', 'dagger', 'crossbow', 'shield'],
  paladin: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'polearm', 'sword_1h', 'sword_2h', 'shield'],
  hunter: ['axe_1h', 'axe_2h', 'bow', 'gun', 'polearm', 'sword_1h', 'sword_2h', 'staff', 'fist_weapon', 'dagger', 'crossbow'],
  rogue: ['axe_1h', 'bow', 'gun', 'mace_1h', 'sword_1h', 'fist_weapon', 'dagger', 'crossbow'],
  priest: ['mace_1h', 'staff', 'dagger', 'wand'],
  death_knight: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'polearm', 'sword_1h', 'sword_2h'],
  shaman: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'staff', 'fist_weapon', 'dagger', 'shield'],
  mage: ['sword_1h', 'staff', 'dagger', 'wand'],
  warlock: ['sword_1h', 'staff', 'dagger', 'wand'],
  monk: ['axe_1h', 'mace_1h', 'polearm', 'sword_1h', 'staff', 'fist_weapon'],
  druid: ['mace_1h', 'mace_2h', 'polearm', 'staff', 'fist_weapon', 'dagger'],
  demon_hunter: ['axe_1h', 'sword_1h', 'warglaive', 'fist_weapon'],
  evoker: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'sword_1h', 'sword_2h', 'staff', 'fist_weapon', 'dagger'],
};

export const WEAPON_TYPE_NAMES: Record<string, string> = {
  axe_1h: '单手斧', axe_2h: '双手斧', bow: '弓', gun: '枪械', mace_1h: '单手锤', mace_2h: '双手锤',
  polearm: '长柄武器', sword_1h: '单手剑', sword_2h: '双手剑', warglaive: '战刃', staff: '法杖',
  fist_weapon: '拳套', dagger: '匕首', crossbow: '弩', wand: '魔杖', shield: '盾牌'
};

export const ARMOR_TYPE_NAMES: Record<string, string> = {
  cloth: '布甲', leather: '皮甲', mail: '锁甲', plate: '板甲', shield: '盾牌'
};

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
