// Shared TypeScript types for Guild Loot System

export type WowClass =
  | 'warrior' | 'paladin' | 'hunter' | 'rogue' | 'priest'
  | 'deathknight' | 'shaman' | 'mage' | 'warlock' | 'monk'
  | 'druid' | 'demonhunter' | 'evoker';

export type WowClassZh =
  | '战士' | '圣骑士' | '猎人' | '潜行者' | '牧师'
  | '死亡骑士' | '萨满祭司' | '法师' | '术士' | '武僧'
  | '德鲁伊' | '恶魔猎手' | '唤魔师';

export type MemberStatus = 'active' | 'backup' | 'inactive';

export type Difficulty = 'normal' | 'heroic' | 'mythic';

export type ItemSlot =
  | 'head' | 'neck' | 'shoulder' | 'back' | 'chest'
  | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'finger' | 'trinket' | 'onehand' | 'mainhand'
  | 'offhand' | 'twohand' | 'ranged';

export type ItemType = 'weapon' | 'armor' | 'jewelry' | 'trinket';
export type ArmorType = 'plate' | 'mail' | 'leather' | 'cloth';
export type ItemQuality = 'uncommon' | 'rare' | 'epic' | 'legendary';
export type StatType = 'strength' | 'agility' | 'intellect' | 'stamina' | 'crit' | 'haste' | 'mastery' | 'versatility';

export type DistributionStatus = 'assigned' | 'received';
export type RequirementPriority = 'bis' | 'high' | 'medium' | 'low';

// Equipment data types (static, from equipment handbook)
export interface ItemStat {
  type: StatType;
  value: number;
}

export interface Item {
  id: string;
  name: string;
  quality: ItemQuality;
  baseItemLevel: number;  // 英雄难度基础装等
  slot: ItemSlot;
  type: ItemType;
  armorType?: ArmorType;
  stats: ItemStat[];
  description?: string;
  effect?: string;
  isTier?: boolean;
  wowheadUrl?: string;
}

// 难度配置
export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; itemLevelOffset: number }> = {
  normal: { label: '普通', color: 'text-green-400', itemLevelOffset: -13 },
  heroic: { label: '英雄', color: 'text-purple-400', itemLevelOffset: 0 },
  mythic: { label: '史诗', color: 'text-orange-400', itemLevelOffset: 13 },
};

// 根据难度计算实际装等
export function getItemLevelForDifficulty(baseItemLevel: number, difficulty: Difficulty): number {
  return baseItemLevel + DIFFICULTY_CONFIG[difficulty].itemLevelOffset;
}

// 生成Wowhead搜索链接
export function generateWowheadUrl(itemName: string): string {
  return `https://www.wowhead.com/search?q=${encodeURIComponent(itemName)}`;
}

export interface Boss {
  id: string;
  name: string;
  order: number;
  loot: Item[];
}

export interface Raid {
  id: string;
  name: string;
  description: string;
  bosses: Boss[];
}

// API response types
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  member?: MemberResponse;
}

export interface MemberResponse {
  id: number;
  displayName: string;
  wowClass: WowClass;
  wowClassZh: WowClassZh;
  isLeader: boolean;
  status: MemberStatus;
  userId?: number;
}

export interface ScheduleResponse {
  id: number;
  date: string;
  weekId: string;
  note?: string;
  raids: ScheduleRaidResponse[];
  createdAt: string;
}

export interface ScheduleRaidResponse {
  id: number;
  raidId: string;
  raidName: string;
  difficulty: Difficulty;
  kills: RaidKillResponse[];
}

export interface RaidKillResponse {
  id: number;
  raidId: string;
  bossId: string;
  bossName: string;
  difficulty: Difficulty;
  participantCount: number;
  dropCount: number;
  drops: DropResponse[];
  createdAt: string;
}

export interface DropResponse {
  id: number;
  raidKillId: number;
  itemId: string;
  itemName: string;
  itemLevel: number;  // 实际装等（根据难度计算后）
  baseItemLevel?: number;  // 英雄基础装等
  slot: string;
  isTier: boolean;
  bonusDrop: boolean;
  quality?: string;
  armorType?: string;
  distribution?: DistributionResponse;
  createdAt: string;
}

export interface DistributionResponse {
  id: number;
  memberId: number;
  memberName: string;
  distributedAt: string;
  status: DistributionStatus;
}

export interface RequirementResponse {
  id: number;
  memberId: number;
  memberName: string;
  itemId: string;
  itemName: string;
  priority: RequirementPriority;
  note?: string;
  createdAt: string;
}

export interface TierProgress {
  memberId: number;
  memberName: string;
  head: boolean;
  shoulder: boolean;
  chest: boolean;
  hands: boolean;
  legs: boolean;
  count: number;
}

// Loot calculation
export function calcDropCount(
  difficulty: Difficulty,
  participantCount: number,
  extra = 0
): number {
  if (difficulty === 'mythic') return 4 + extra;
  return Math.max(1, Math.floor(participantCount / 5)) + extra;
}

// Week ID calculation
export function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export const WOW_CLASS_COLORS: Record<WowClass, string> = {
  warrior:     '#C69B3A',
  paladin:     '#F48CBA',
  hunter:      '#AAD372',
  rogue:       '#FFF468',
  priest:      '#FFFFFF',
  deathknight: '#C41E3A',
  shaman:      '#0070DD',
  mage:        '#3FC7EB',
  warlock:     '#8788EE',
  monk:        '#00FF98',
  druid:       '#FF7C0A',
  demonhunter: '#A330C9',
  evoker:      '#33937F',
};

export const WOW_CLASS_ZH_MAP: Record<WowClass, string> = {
  warrior: '战士',
  paladin: '圣骑士',
  hunter: '猎人',
  rogue: '潜行者',
  priest: '牧师',
  deathknight: '死亡骑士',
  shaman: '萨满祭司',
  mage: '法师',
  warlock: '术士',
  monk: '武僧',
  druid: '德鲁伊',
  demonhunter: '恶魔猎手',
  evoker: '唤魔师',
};

export const SLOT_NAMES: Record<ItemSlot, string> = {
  head: '头部',
  neck: '颈部',
  shoulder: '肩部',
  back: '背部',
  chest: '胸部',
  wrist: '护腕',
  hands: '手部',
  waist: '腰部',
  legs: '腿部',
  feet: '脚部',
  finger: '戒指',
  trinket: '饰品',
  onehand: '单手武器',
  mainhand: '主手武器',
  offhand: '副手',
  twohand: '双手武器',
  ranged: '远程',
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  normal: '普通',
  heroic: '英雄',
  mythic: '史诗',
};
