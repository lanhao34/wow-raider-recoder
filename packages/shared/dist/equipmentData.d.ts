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
export declare const RAIDS: WoWRaid[];
export declare const CLASS_ARMOR_TYPES: Record<string, string[]>;
export declare const ALL_ITEMS: {
    raidId: string;
    raidName: string;
    bossId: string;
    bossName: string;
    id: string;
    name: string;
    nameZh?: string;
    slot: string;
    quality: string;
    itemLevel: number;
    isTier?: boolean;
    tierSet?: string;
    armorType?: string;
}[];
export declare const QUALITY_COLORS: Record<string, string>;
export declare const QUALITY_BORDERS: Record<string, string>;
export declare const QUALITY_BG: Record<string, string>;
//# sourceMappingURL=equipmentData.d.ts.map