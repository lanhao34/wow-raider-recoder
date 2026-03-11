"use strict";
// Shared TypeScript types for Guild Loot System
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIFFICULTY_NAMES = exports.SLOT_NAMES = exports.WOW_CLASS_ZH_MAP = exports.WOW_CLASS_COLORS = exports.DIFFICULTY_CONFIG = void 0;
exports.getItemLevelForDifficulty = getItemLevelForDifficulty;
exports.generateWowheadUrl = generateWowheadUrl;
exports.calcDropCount = calcDropCount;
exports.getWeekId = getWeekId;
// 难度配置
exports.DIFFICULTY_CONFIG = {
    normal: { label: '普通', color: 'text-green-400', itemLevelOffset: -13 },
    heroic: { label: '英雄', color: 'text-purple-400', itemLevelOffset: 0 },
    mythic: { label: '史诗', color: 'text-orange-400', itemLevelOffset: 13 },
};
// 根据难度计算实际装等
function getItemLevelForDifficulty(baseItemLevel, difficulty) {
    return baseItemLevel + exports.DIFFICULTY_CONFIG[difficulty].itemLevelOffset;
}
// 生成Wowhead搜索链接
function generateWowheadUrl(itemName) {
    return `https://www.wowhead.com/search?q=${encodeURIComponent(itemName)}`;
}
// Loot calculation
function calcDropCount(difficulty, participantCount, extra = 0) {
    if (difficulty === 'mythic')
        return 4 + extra;
    return Math.max(1, Math.floor(participantCount / 5)) + extra;
}
// Week ID calculation
function getWeekId(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
exports.WOW_CLASS_COLORS = {
    warrior: '#C69B3A',
    paladin: '#F48CBA',
    hunter: '#AAD372',
    rogue: '#FFF468',
    priest: '#FFFFFF',
    deathknight: '#C41E3A',
    shaman: '#0070DD',
    mage: '#3FC7EB',
    warlock: '#8788EE',
    monk: '#00FF98',
    druid: '#FF7C0A',
    demonhunter: '#A330C9',
    evoker: '#33937F',
};
exports.WOW_CLASS_ZH_MAP = {
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
exports.SLOT_NAMES = {
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
exports.DIFFICULTY_NAMES = {
    normal: '普通',
    heroic: '英雄',
    mythic: '史诗',
};
//# sourceMappingURL=types.js.map