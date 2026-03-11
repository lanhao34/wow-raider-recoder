export type WowClass = 'warrior' | 'paladin' | 'hunter' | 'rogue' | 'priest' | 'deathknight' | 'shaman' | 'mage' | 'warlock' | 'monk' | 'druid' | 'demonhunter' | 'evoker';
export type WowClassZh = '战士' | '圣骑士' | '猎人' | '潜行者' | '牧师' | '死亡骑士' | '萨满祭司' | '法师' | '术士' | '武僧' | '德鲁伊' | '恶魔猎手' | '唤魔师';
export type MemberStatus = 'active' | 'backup' | 'inactive';
export type Difficulty = 'normal' | 'heroic' | 'mythic';
export type ItemSlot = 'head' | 'neck' | 'shoulder' | 'back' | 'chest' | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet' | 'finger' | 'trinket' | 'onehand' | 'mainhand' | 'offhand' | 'twohand' | 'ranged';
export type ItemType = 'weapon' | 'armor' | 'jewelry' | 'trinket';
export type ArmorType = 'plate' | 'mail' | 'leather' | 'cloth';
export type ItemQuality = 'uncommon' | 'rare' | 'epic' | 'legendary';
export type StatType = 'strength' | 'agility' | 'intellect' | 'stamina' | 'crit' | 'haste' | 'mastery' | 'versatility';
export type DistributionStatus = 'assigned' | 'received';
export type RequirementPriority = 'bis' | 'high' | 'medium' | 'low';
export interface ItemStat {
    type: StatType;
    value: number;
}
export interface Item {
    id: string;
    name: string;
    quality: ItemQuality;
    baseItemLevel: number;
    slot: ItemSlot;
    type: ItemType;
    armorType?: ArmorType;
    stats: ItemStat[];
    description?: string;
    effect?: string;
    isTier?: boolean;
    wowheadUrl?: string;
}
export declare const DIFFICULTY_CONFIG: Record<Difficulty, {
    label: string;
    color: string;
    itemLevelOffset: number;
}>;
export declare function getItemLevelForDifficulty(baseItemLevel: number, difficulty: Difficulty): number;
export declare function generateWowheadUrl(itemName: string): string;
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
    itemLevel: number;
    baseItemLevel?: number;
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
export declare function calcDropCount(difficulty: Difficulty, participantCount: number, extra?: number): number;
export declare function getWeekId(date: Date): string;
export declare const WOW_CLASS_COLORS: Record<WowClass, string>;
export declare const WOW_CLASS_ZH_MAP: Record<WowClass, string>;
export declare const SLOT_NAMES: Record<ItemSlot, string>;
export declare const DIFFICULTY_NAMES: Record<Difficulty, string>;
//# sourceMappingURL=types.d.ts.map