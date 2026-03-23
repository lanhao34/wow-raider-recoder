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
  icon?: string;
  primaryStats?: string;
  secondaryStats?: string;
  stamina?: number;
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
  deathknight: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'polearm', 'sword_1h', 'sword_2h'],
  shaman: ['axe_1h', 'axe_2h', 'mace_1h', 'mace_2h', 'staff', 'fist_weapon', 'dagger', 'shield'],
  mage: ['sword_1h', 'staff', 'dagger', 'wand'],
  warlock: ['sword_1h', 'staff', 'dagger', 'wand'],
  monk: ['axe_1h', 'mace_1h', 'polearm', 'sword_1h', 'staff', 'fist_weapon'],
  druid: ['mace_1h', 'mace_2h', 'polearm', 'staff', 'fist_weapon', 'dagger'],
  demonhunter: ['axe_1h', 'sword_1h', 'warglaive', 'fist_weapon'],
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

export const CLASS_PRIMARY_STATS: Record<string, string[]> = {
  warrior: ['力量'],
  deathknight: ['力量'],
  paladin: ['力量', '智力'],
  hunter: ['敏捷'],
  rogue: ['敏捷'],
  demonhunter: ['敏捷'],
  monk: ['敏捷', '智力'],
  druid: ['敏捷', '智力'],
  shaman: ['敏捷', '智力'],
  priest: ['智力'],
  mage: ['智力'],
  warlock: ['智力'],
  evoker: ['智力'],
};

// 那些由于 API 抽风掩盖了属性描述的特殊武器修正表（如特效武器）
const MANUAL_STAT_OVERRIDES: Record<string, string> = {
  '249281': '力量/敏捷', // 终焉暮光之刃 (力量/敏捷单手剑，屏蔽法系)
  '212392': '力量/敏捷', // 决斗者的钢铁之舞 (同上)
  '212405': '力量/敏捷', // 无瑕的相位之刃 (同上)
  '249294': '力量/敏捷', // 盲目裁决之刃
  '260423': '力量/敏捷', // 阿拉托尔的迅疾纪念
  '212395': '敏捷/智力', // 血吻反曲刀 (匕首通常是敏捷或法系)
  '212394': '敏捷/智力', // 统御者的轻蔑
  '225636': '敏捷/智力', // 篡国
  '249925': '敏捷/智力', // 饥渴凯旋
  '212401': '力量/敏捷', // 安苏雷克的最终审判 (单手斧)
};

export type EquipSuitability = 'cannot_equip' | 'main_spec' | 'off_spec';

export function getEquipSuitability(wowClass: string, item: Pick<WoWItem, 'id' | 'armorType' | 'weaponType'> & { primaryStats?: string }): EquipSuitability {
  // 1. 检查是否能装备
  if (item.armorType) {
    if (item.armorType === 'shield') {
       const allowedWeapons = CLASS_WEAPON_TYPES[wowClass] || [];
       if (!allowedWeapons.includes('shield')) return 'cannot_equip';
    } else {
       const allowedArmor = CLASS_ARMOR_TYPES[wowClass] || [];
       if (!allowedArmor.includes(item.armorType)) return 'cannot_equip';
    }
  }
  if (item.weaponType) {
    const allowedWeapons = CLASS_WEAPON_TYPES[wowClass] || [];
    if (!allowedWeapons.includes(item.weaponType)) return 'cannot_equip';
  }

  // 2. 如果能装备，检查是否为主专精 (Main Spec) 或 次专精 (Off Spec)
  // 如果是护甲，判断是否为本甲（护甲列表的第0项）
  if (item.armorType && item.armorType !== 'shield') {
     const allowedArmor = CLASS_ARMOR_TYPES[wowClass] || [];
     if (allowedArmor[0] && allowedArmor[0] !== item.armorType) {
       return 'off_spec'; // 能穿但跨甲
     }
  }

  // 判断主属性是否吻合（如果有 primaryStats 或覆盖字典命中）
  const activePattern = item.primaryStats || MANUAL_STAT_OVERRIDES[item.id];
  if (activePattern) {
    const classStats = CLASS_PRIMARY_STATS[wowClass] || [];
    // item.primaryStats format usually like "力量" or "智力/敏捷" or "力量/智力/敏捷"
    // Check if any of the class required stats appear in the item's primary stats string
    const matchStat = classStats.find(stat => activePattern.includes(stat));
    if (!matchStat) {
      return 'off_spec'; // 属性不契合（比如拿了敏捷手剑的法师）
    }
  } else if (item.weaponType && !item.armorType) {
    // 武器如果没有属性，也没有覆盖词条，我们需要做一个非常基础的判断补充（防穿透）：
    // 比如：法系绝对不应该把 "sword_1h" (如果没有任何智力词条) Default 判为 MainSpec
    // 但为了平滑，暂时只拦截明显不符合的。
  }

  return 'main_spec'; // 本甲且属性吻合，或者无法判定的无属性装备默认主天赋
}

export function canEquipItem(wowClass: string, item: Pick<WoWItem, 'armorType' | 'weaponType'>): boolean {
  return getEquipSuitability(wowClass, item as any) !== 'cannot_equip';
}

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
