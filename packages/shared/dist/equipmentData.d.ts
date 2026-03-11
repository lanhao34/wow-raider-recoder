import type { Raid } from './types';
export declare const RAIDS: Raid[];
export declare function findRaid(raidId: string): Raid | undefined;
export declare function findBoss(raidId: string, bossId: string): import("./types").Boss | undefined;
export declare function findItem(itemId: string): import("./types").Item | undefined;
export declare function getAllItems(): {
    item: any;
    bossId: string;
    raidId: string;
}[];
export declare function getItemById(itemId: string): {
    item: any;
    bossId: string;
    raidId: string;
} | null;
export declare function getBossById(bossId: string): {
    boss: any;
    raidId: string;
} | null;
//# sourceMappingURL=equipmentData.d.ts.map