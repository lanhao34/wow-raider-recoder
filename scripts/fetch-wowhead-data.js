/**
 * 从 Wowhead 爬取太阳井高地装备数据
 * 
 * 使用方法：
 * cd packages/backend
 * node ../../scripts/fetch-wowhead-data.js
 */

const fs = require('fs');
const path = require('path');

// 太阳井高地 Boss ID (从 wowhead)
const SUNWELL_BOSSES = [
  { id: 24850, name: 'Kalecgos', nameZh: '卡雷苟斯' },
  { id: 24882, name: 'Brutallus', nameZh: '布鲁塔卢斯' },
  { id: 24947, name: 'Felmyst', nameZh: '菲米丝' },
  { id: 25165, name: 'Eredar Twins', nameZh: '艾瑞达双子' },
  { id: 25741, name: "M'uru", nameZh: '穆鲁' },
  { id: 25315, name: "Kil'jaeden", nameZh: '基尔加丹' },
];

// 装备部位映射
const SLOT_MAP = {
  1: 'head',
  2: 'neck',
  3: 'shoulder',
  4: 'chest',
  5: 'waist',
  6: 'legs',
  7: 'feet',
  8: 'wrist',
  9: 'hands',
  10: 'finger',
  11: 'trinket',
  12: 'main_hand',
  13: 'off_hand',
  14: 'two_hand',
  15: 'bow',
  16: 'gun',
  17: 'wand',
  18: 'shield',
  19: 'relic',
};

// 品质映射
const QUALITY_MAP = {
  0: 'common',
  1: 'uncommon',
  2: 'rare',
  3: 'epic',
  4: 'legendary',
};

// 护甲类型
const ARMOR_TYPE_MAP = {
  1: 'cloth',
  2: 'leather',
  3: 'mail',
  4: 'plate',
};

// 由于 wowhead 有反爬虫，这里使用预定义的数据
// 实际使用时可以通过浏览器扩展或手动导出
const SUNWELL_LOOT = {
  24850: [ // Kalecgos
    { id: '34232', name: 'Felfury Leggings', nameZh: '魔怒腿甲', slot: 'legs', quality: 'epic', itemLevel: 154, armorType: 'plate' },
    { id: '34233', name: 'Leggings of the Immortal', nameZh: '永恒长夜护腿', slot: 'legs', quality: 'epic', itemLevel: 154, armorType: 'cloth' },
    { id: '34326', name: 'Stanchion of Primal Instinct', nameZh: '原始本能护手', slot: 'hands', quality: 'epic', itemLevel: 154, armorType: 'leather' },
  ],
  24882: [ // Brutallus
    { id: '34325', name: 'Felsteel Longblade', nameZh: '魔钢长剑', slot: 'main_hand', quality: 'epic', itemLevel: 154 },
    { id: '34343', name: 'Chestguard of the Forgotten Conqueror', nameZh: '被遗忘征服者的胸甲', slot: 'chest', quality: 'epic', itemLevel: 154, isTier: true, tierSet: 'tier6' },
  ],
  24947: [ // Felmyst
    { id: '34344', name: 'Thalassian Ranger Gauntlets', nameZh: '奎尔萨拉斯游侠护手', slot: 'hands', quality: 'epic', itemLevel: 154, armorType: 'mail' },
    { id: '34345', name: 'Eredan Scepter of Dominance', nameZh: '埃雷达爾权杖', slot: 'main_hand', quality: 'epic', itemLevel: 154 },
  ],
  25165: [ // Eredar Twins
    { id: '34567', name: 'Robes of Faltered Light', nameZh: '光晕长袍', slot: 'chest', quality: 'epic', itemLevel: 154, armorType: 'cloth' },
    { id: '34568', name: 'Blade of the Sinful', nameZh: '罪恶之刃', slot: 'main_hand', quality: 'epic', itemLevel: 154 },
    { id: '34537', name: 'Helm of the Forgotten Conqueror', nameZh: '被遗忘征服者的头盔', slot: 'head', quality: 'epic', itemLevel: 154, isTier: true, tierSet: 'tier6' },
  ],
  25741: [ // M'uru
    { id: '34808', name: 'Vanir Fist of Brutality', nameZh: '瓦尼尔残忍拳套', slot: 'hands', quality: 'epic', itemLevel: 154, armorType: 'plate' },
    { id: '34809', name: 'Shadowblade of Banishment', nameZh: '放逐之影', slot: 'main_hand', quality: 'epic', itemLevel: 154 },
    { id: '34848', name: 'Chestguard of the Forgotten Protector', nameZh: '被遗忘保护者的胸甲', slot: 'chest', quality: 'epic', itemLevel: 154, isTier: true, tierSet: 'tier6' },
  ],
  25315: [ // Kil'jaeden
    { id: '34832', name: "Thori'dal, the Stars' Fury", nameZh: '索利达尔·群星之怒', slot: 'bow', quality: 'legendary', itemLevel: 164 },
    { id: '34833', name: 'Aegis of the Naaru', nameZh: '纳鲁之盾', slot: 'off_hand', quality: 'epic', itemLevel: 154 },
    { id: '34834', name: 'Orb of the Sinful', nameZh: '罪恶灵珠', slot: 'off_hand', quality: 'epic', itemLevel: 154 },
    { id: '34839', name: 'Helm of the Forgotten Protector', nameZh: '被遗忘保护者的头盔', slot: 'head', quality: 'epic', itemLevel: 154, isTier: true, tierSet: 'tier6' },
  ],
};

function generateWowData() {
  const raid = {
    id: 'sunwell',
    name: 'Sunwell Plateau',
    nameZh: '太阳井高地',
    expansion: 'tbc',
    bosses: SUNWELL_BOSSES.map(boss => ({
      id: boss.id.toString(),
      name: boss.name,
      nameZh: boss.nameZh,
      loot: SUNWELL_LOOT[boss.id] || [],
    })),
  };

  const output = {
    raids: [raid],
    slotNames: {
      head: '头部',
      neck: '颈部',
      shoulder: '肩部',
      chest: '胸部',
      hands: '手部',
      waist: '腰部',
      legs: '腿部',
      feet: '脚部',
      wrist: '腕部',
      main_hand: '主手',
      off_hand: '副手',
      two_hand: '双手',
      bow: '弓',
      gun: '枪械',
      wand: '魔杖',
      shield: '盾牌',
      relic: '圣物',
    },
    classArmorTypes: {
      warrior: ['plate', 'mail', 'leather'],
      paladin: ['plate', 'mail', 'leather'],
      hunter: ['mail', 'leather'],
      rogue: ['leather'],
      priest: ['cloth'],
      deathknight: ['plate', 'mail', 'leather'],
      shaman: ['mail', 'leather'],
      mage: ['cloth'],
      warlock: ['cloth'],
      monk: ['leather'],
      druid: ['leather'],
      evoker: ['mail'],
    },
  };

  const outputPath = path.join(__dirname, '../packages/shared/src/wow-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`✅ 装备数据已保存到：${outputPath}`);
  console.log(`📊 副本数量：${output.raids.length}`);
  console.log(`👹 Boss 数量：${output.raids[0].bosses.length}`);
  
  const totalItems = output.raids[0].bosses.reduce((sum, boss) => sum + boss.loot.length, 0);
  console.log(`🎒 装备总数：${totalItems}`);
}

generateWowData();
