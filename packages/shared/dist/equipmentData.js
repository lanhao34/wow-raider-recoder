"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUALITY_BG = exports.QUALITY_BORDERS = exports.QUALITY_COLORS = exports.ALL_ITEMS = exports.CLASS_ARMOR_TYPES = exports.RAIDS = void 0;
// 从 JSON 文件导入装备数据
const wow_data_json_1 = __importDefault(require("./wow-data.json"));
exports.RAIDS = wow_data_json_1.default.raids;
exports.CLASS_ARMOR_TYPES = wow_data_json_1.default.classArmorTypes;
// 扁平化所有装备用于搜索
exports.ALL_ITEMS = exports.RAIDS.flatMap((raid) => raid.bosses.flatMap((boss) => boss.loot.map((item) => ({
    ...item,
    raidId: raid.id,
    raidName: raid.nameZh || raid.name,
    bossId: boss.id,
    bossName: boss.nameZh || boss.name,
}))));
// 品质颜色映射
exports.QUALITY_COLORS = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-orange-400',
};
// 品质边框
exports.QUALITY_BORDERS = {
    common: 'border-gray-600',
    uncommon: 'border-green-600',
    rare: 'border-blue-600',
    epic: 'border-purple-600',
    legendary: 'border-orange-600',
};
// 品质背景
exports.QUALITY_BG = {
    common: 'bg-gray-900/30',
    uncommon: 'bg-green-900/20',
    rare: 'bg-blue-900/20',
    epic: 'bg-purple-900/20',
    legendary: 'bg-orange-900/20',
};
//# sourceMappingURL=equipmentData.js.map