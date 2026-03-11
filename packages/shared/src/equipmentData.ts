import type { Raid } from './types';

export const RAIDS: Raid[] = [
  {
    "id": "spire-of-voidshroud",
    "name": "虚影尖塔",
    "description": "虚空之力侵蚀的尖塔，奥蕾莉亚·风行者的堕落之地",
    "bosses": [
      {
        "id": "avozun",
        "name": "元首阿福扎恩",
        "order": 1,
        "loot": [
          {
            "id": "avozun-1",
            "name": "虚空吞噬者之刃",
            "quality": "epic",
            "baseItemLevel": 623,
            "slot": "onehand",
            "type": "weapon",
            "stats": [
              {
                "type": "agility",
                "value": 450
              },
              {
                "type": "stamina",
                "value": 680
              },
              {
                "type": "crit",
                "value": 320
              },
              {
                "type": "haste",
                "value": 280
              }
            ]
          },
          {
            "id": "avozun-2",
            "name": "阿福扎恩的虚空护肩",
            "quality": "epic",
            "baseItemLevel": 623,
            "slot": "shoulder",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 380
              },
              {
                "type": "stamina",
                "value": 680
              },
              {
                "type": "mastery",
                "value": 340
              },
              {
                "type": "versatility",
                "value": 260
              }
            ]
          },
          {
            "id": "avozun-3",
            "name": "虚空行者护腿",
            "quality": "epic",
            "baseItemLevel": 623,
            "slot": "legs",
            "type": "armor",
            "armorType": "leather",
            "stats": [
              {
                "type": "agility",
                "value": 380
              },
              {
                "type": "stamina",
                "value": 680
              },
              {
                "type": "crit",
                "value": 300
              },
              {
                "type": "haste",
                "value": 300
              }
            ]
          },
          {
            "id": "avozun-4",
            "name": "虚空能量指环",
            "quality": "epic",
            "baseItemLevel": 623,
            "slot": "finger",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 450
              },
              {
                "type": "intellect",
                "value": 320
              },
              {
                "type": "haste",
                "value": 280
              },
              {
                "type": "mastery",
                "value": 280
              }
            ]
          },
          {
            "id": "avozun-5",
            "name": "虚空共鸣饰品",
            "quality": "epic",
            "baseItemLevel": 623,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "stamina",
                "value": 520
              }
            ],
            "effect": "你的攻击有几率触发虚空冲击，造成额外暗影伤害"
          }
        ]
      },
      {
        "id": "vlashius",
        "name": "弗拉希乌斯",
        "order": 2,
        "loot": [
          {
            "id": "vlashius-1",
            "name": "弗拉希乌斯之牙",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "mainhand",
            "type": "weapon",
            "stats": [
              {
                "type": "strength",
                "value": 480
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "crit",
                "value": 350
              },
              {
                "type": "versatility",
                "value": 290
              }
            ]
          },
          {
            "id": "vlashius-2",
            "name": "虚空龙鳞胸甲",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "chest",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 400
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "haste",
                "value": 320
              },
              {
                "type": "mastery",
                "value": 320
              }
            ]
          },
          {
            "id": "vlashius-3",
            "name": "龙裔法师长袍",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "chest",
            "type": "armor",
            "armorType": "cloth",
            "stats": [
              {
                "type": "intellect",
                "value": 400
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "crit",
                "value": 340
              },
              {
                "type": "haste",
                "value": 300
              }
            ]
          },
          {
            "id": "vlashius-4",
            "name": "虚空龙族护腕",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "wrist",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 280
              },
              {
                "type": "stamina",
                "value": 520
              },
              {
                "type": "mastery",
                "value": 240
              },
              {
                "type": "versatility",
                "value": 200
              }
            ]
          },
          {
            "id": "vlashius-5",
            "name": "龙血饰品",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "strength",
                "value": 380
              }
            ],
            "effect": "生命值低于30%时，获得护盾吸收伤害"
          }
        ]
      },
      {
        "id": "sahadar",
        "name": "陨落之王萨哈达尔",
        "order": 3,
        "loot": [
          {
            "id": "sahadar-1",
            "name": "萨哈达尔的陨落之剑",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "twohand",
            "type": "weapon",
            "stats": [
              {
                "type": "strength",
                "value": 520
              },
              {
                "type": "stamina",
                "value": 780
              },
              {
                "type": "crit",
                "value": 380
              },
              {
                "type": "haste",
                "value": 340
              }
            ]
          },
          {
            "id": "sahadar-2",
            "name": "陨落之王王冠",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "head",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 400
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "mastery",
                "value": 360
              },
              {
                "type": "versatility",
                "value": 280
              }
            ],
            "isTier": true
          },
          {
            "id": "sahadar-3",
            "name": "虚空陨落护符",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "neck",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 480
              },
              {
                "type": "haste",
                "value": 320
              },
              {
                "type": "mastery",
                "value": 300
              },
              {
                "type": "versatility",
                "value": 180
              }
            ]
          },
          {
            "id": "sahadar-4",
            "name": "萨哈达尔之握",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "hands",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 320
              },
              {
                "type": "stamina",
                "value": 580
              },
              {
                "type": "crit",
                "value": 280
              },
              {
                "type": "haste",
                "value": 260
              }
            ]
          },
          {
            "id": "sahadar-5",
            "name": "陨落者的复仇",
            "quality": "epic",
            "baseItemLevel": 626,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "agility",
                "value": 380
              }
            ],
            "effect": "击杀敌人后，攻击速度提高20%，持续10秒"
          }
        ]
      },
      {
        "id": "weigor-azorak",
        "name": "威厄高尔和艾佐拉克",
        "order": 4,
        "loot": [
          {
            "id": "weigor-1",
            "name": "双子虚空之刃",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "onehand",
            "type": "weapon",
            "stats": [
              {
                "type": "agility",
                "value": 480
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "haste",
                "value": 360
              },
              {
                "type": "mastery",
                "value": 300
              }
            ]
          },
          {
            "id": "weigor-2",
            "name": "虚空双子护肩",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "shoulder",
            "type": "armor",
            "armorType": "leather",
            "stats": [
              {
                "type": "agility",
                "value": 420
              },
              {
                "type": "stamina",
                "value": 760
              },
              {
                "type": "crit",
                "value": 340
              },
              {
                "type": "versatility",
                "value": 300
              }
            ],
            "isTier": true
          },
          {
            "id": "weigor-3",
            "name": "威厄高尔的虚空披风",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "back",
            "type": "armor",
            "stats": [
              {
                "type": "stamina",
                "value": 520
              },
              {
                "type": "intellect",
                "value": 340
              },
              {
                "type": "haste",
                "value": 280
              },
              {
                "type": "mastery",
                "value": 260
              }
            ]
          },
          {
            "id": "weigor-4",
            "name": "艾佐拉克的凝视",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "intellect",
                "value": 400
              }
            ],
            "effect": "施法有几率召唤虚空之眼，对目标造成暗影伤害"
          },
          {
            "id": "weigor-5",
            "name": "双子协调指环",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "finger",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 500
              },
              {
                "type": "strength",
                "value": 340
              },
              {
                "type": "crit",
                "value": 300
              },
              {
                "type": "haste",
                "value": 280
              }
            ]
          }
        ]
      },
      {
        "id": "blindlight-vanguard",
        "name": "光盲先锋军",
        "order": 5,
        "loot": [
          {
            "id": "blindlight-1",
            "name": "光盲长枪",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "ranged",
            "type": "weapon",
            "stats": [
              {
                "type": "agility",
                "value": 500
              },
              {
                "type": "stamina",
                "value": 750
              },
              {
                "type": "crit",
                "value": 380
              },
              {
                "type": "mastery",
                "value": 320
              }
            ]
          },
          {
            "id": "blindlight-2",
            "name": "先锋军胸甲",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "chest",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 420
              },
              {
                "type": "stamina",
                "value": 760
              },
              {
                "type": "haste",
                "value": 340
              },
              {
                "type": "versatility",
                "value": 320
              }
            ],
            "isTier": true
          },
          {
            "id": "blindlight-3",
            "name": "光盲面罩",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "head",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 420
              },
              {
                "type": "stamina",
                "value": 760
              },
              {
                "type": "crit",
                "value": 360
              },
              {
                "type": "haste",
                "value": 300
              }
            ]
          },
          {
            "id": "blindlight-4",
            "name": "先锋军战靴",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "feet",
            "type": "armor",
            "armorType": "leather",
            "stats": [
              {
                "type": "agility",
                "value": 340
              },
              {
                "type": "stamina",
                "value": 620
              },
              {
                "type": "mastery",
                "value": 300
              },
              {
                "type": "versatility",
                "value": 260
              }
            ]
          },
          {
            "id": "blindlight-5",
            "name": "光盲圣契",
            "quality": "epic",
            "baseItemLevel": 629,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "stamina",
                "value": 550
              }
            ],
            "effect": "受到伤害时，有几率获得光盲护盾，吸收伤害并反射光明伤害"
          }
        ]
      },
      {
        "id": "cosmic-crown",
        "name": "宇宙之冕（奥蕾莉亚·风行者）",
        "order": 6,
        "loot": [
          {
            "id": "crown-1",
            "name": "风行者的虚空长弓",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "ranged",
            "type": "weapon",
            "stats": [
              {
                "type": "agility",
                "value": 580
              },
              {
                "type": "stamina",
                "value": 870
              },
              {
                "type": "crit",
                "value": 420
              },
              {
                "type": "haste",
                "value": 380
              }
            ]
          },
          {
            "id": "crown-2",
            "name": "宇宙之冕",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "head",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 480
              },
              {
                "type": "stamina",
                "value": 870
              },
              {
                "type": "mastery",
                "value": 420
              },
              {
                "type": "versatility",
                "value": 360
              }
            ],
            "isTier": true
          },
          {
            "id": "crown-3",
            "name": "奥蕾莉亚的虚空之心",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "agility",
                "value": 450
              }
            ],
            "effect": "虚空能量环绕，攻击和技能有几率释放虚空箭"
          },
          {
            "id": "crown-4",
            "name": "虚空行者之靴",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "feet",
            "type": "armor",
            "armorType": "cloth",
            "stats": [
              {
                "type": "intellect",
                "value": 380
              },
              {
                "type": "stamina",
                "value": 700
              },
              {
                "type": "haste",
                "value": 340
              },
              {
                "type": "mastery",
                "value": 320
              }
            ]
          },
          {
            "id": "crown-5",
            "name": "风行者的遗产",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "neck",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 580
              },
              {
                "type": "agility",
                "value": 400
              },
              {
                "type": "crit",
                "value": 380
              },
              {
                "type": "haste",
                "value": 360
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "dreamshatter",
    "name": "梦境裂隙",
    "description": "翡翠梦境的裂隙，奇美鲁斯的沉睡之地",
    "bosses": [
      {
        "id": "chimyrus",
        "name": "奇美鲁斯，未梦之神",
        "order": 1,
        "loot": [
          {
            "id": "chimyrus-1",
            "name": "未梦之神的凝视",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "intellect",
                "value": 450
              }
            ],
            "effect": "施法有几率使目标陷入梦境，受到额外伤害"
          },
          {
            "id": "chimyrus-2",
            "name": "梦境撕裂者",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "twohand",
            "type": "weapon",
            "stats": [
              {
                "type": "strength",
                "value": 580
              },
              {
                "type": "stamina",
                "value": 870
              },
              {
                "type": "mastery",
                "value": 420
              },
              {
                "type": "versatility",
                "value": 380
              }
            ]
          },
          {
            "id": "chimyrus-3",
            "name": "奇美鲁斯的梦境之翼",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "back",
            "type": "armor",
            "stats": [
              {
                "type": "stamina",
                "value": 580
              },
              {
                "type": "intellect",
                "value": 400
              },
              {
                "type": "haste",
                "value": 360
              },
              {
                "type": "mastery",
                "value": 340
              }
            ]
          },
          {
            "id": "chimyrus-4",
            "name": "未梦者的护腿",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "legs",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 420
              },
              {
                "type": "stamina",
                "value": 760
              },
              {
                "type": "crit",
                "value": 360
              },
              {
                "type": "haste",
                "value": 320
              }
            ],
            "isTier": true
          },
          {
            "id": "chimyrus-5",
            "name": "梦境精华指环",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "finger",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 520
              },
              {
                "type": "intellect",
                "value": 360
              },
              {
                "type": "mastery",
                "value": 320
              },
              {
                "type": "versatility",
                "value": 280
              }
            ]
          },
          {
            "id": "chimyrus-6",
            "name": "奇美鲁斯的獠牙",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "onehand",
            "type": "weapon",
            "stats": [
              {
                "type": "agility",
                "value": 480
              },
              {
                "type": "stamina",
                "value": 720
              },
              {
                "type": "crit",
                "value": 360
              },
              {
                "type": "haste",
                "value": 320
              }
            ]
          },
          {
            "id": "chimyrus-7",
            "name": "梦境行者手套",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "hands",
            "type": "armor",
            "armorType": "leather",
            "stats": [
              {
                "type": "agility",
                "value": 360
              },
              {
                "type": "stamina",
                "value": 660
              },
              {
                "type": "haste",
                "value": 320
              },
              {
                "type": "mastery",
                "value": 280
              }
            ]
          },
          {
            "id": "chimyrus-8",
            "name": "未梦之神的腰带",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "waist",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 360
              },
              {
                "type": "stamina",
                "value": 660
              },
              {
                "type": "crit",
                "value": 300
              },
              {
                "type": "versatility",
                "value": 280
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "invasion-queldanas",
    "name": "进军奎尔丹纳斯",
    "description": "太阳之井的危机，鲁拉与黑暗之井的降临",
    "bosses": [
      {
        "id": "belorand",
        "name": "贝洛朗，奥的子嗣",
        "order": 1,
        "loot": [
          {
            "id": "belorand-1",
            "name": "贝洛朗的烈焰之刃",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "onehand",
            "type": "weapon",
            "stats": [
              {
                "type": "strength",
                "value": 500
              },
              {
                "type": "stamina",
                "value": 750
              },
              {
                "type": "crit",
                "value": 400
              },
              {
                "type": "haste",
                "value": 360
              }
            ]
          },
          {
            "id": "belorand-2",
            "name": "奥之子嗣的鳞片",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "chest",
            "type": "armor",
            "armorType": "plate",
            "stats": [
              {
                "type": "strength",
                "value": 440
              },
              {
                "type": "stamina",
                "value": 800
              },
              {
                "type": "mastery",
                "value": 380
              },
              {
                "type": "versatility",
                "value": 340
              }
            ],
            "isTier": true
          },
          {
            "id": "belorand-3",
            "name": "烈焰之心饰品",
            "quality": "legendary",
            "baseItemLevel": 632,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "strength",
                "value": 420
              }
            ],
            "effect": "攻击有几率触发烈焰爆发，造成火焰伤害并灼烧目标"
          },
          {
            "id": "belorand-4",
            "name": "龙焰护腕",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "wrist",
            "type": "armor",
            "armorType": "mail",
            "stats": [
              {
                "type": "agility",
                "value": 320
              },
              {
                "type": "stamina",
                "value": 600
              },
              {
                "type": "haste",
                "value": 300
              },
              {
                "type": "crit",
                "value": 260
              }
            ]
          },
          {
            "id": "belorand-5",
            "name": "贝洛朗的龙瞳",
            "quality": "epic",
            "baseItemLevel": 632,
            "slot": "finger",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 540
              },
              {
                "type": "intellect",
                "value": 380
              },
              {
                "type": "mastery",
                "value": 340
              },
              {
                "type": "haste",
                "value": 300
              }
            ]
          }
        ]
      },
      {
        "id": "darkest-night",
        "name": "至暗之夜降临（鲁拉/黑暗之井）",
        "order": 2,
        "loot": [
          {
            "id": "darkest-1",
            "name": "黑暗之井",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "trinket",
            "type": "trinket",
            "stats": [
              {
                "type": "stamina",
                "value": 600
              }
            ],
            "effect": "虚空能量涌动，所有属性提高15%，但受到暗影伤害增加"
          },
          {
            "id": "darkest-2",
            "name": "鲁拉的虚空之触",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "mainhand",
            "type": "weapon",
            "stats": [
              {
                "type": "intellect",
                "value": 580
              },
              {
                "type": "stamina",
                "value": 870
              },
              {
                "type": "haste",
                "value": 440
              },
              {
                "type": "mastery",
                "value": 400
              }
            ]
          },
          {
            "id": "darkest-3",
            "name": "至暗之夜王冠",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "head",
            "type": "armor",
            "armorType": "cloth",
            "stats": [
              {
                "type": "intellect",
                "value": 500
              },
              {
                "type": "stamina",
                "value": 900
              },
              {
                "type": "crit",
                "value": 440
              },
              {
                "type": "haste",
                "value": 400
              }
            ],
            "isTier": true
          },
          {
            "id": "darkest-4",
            "name": "鲁拉的堕落之翼",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "back",
            "type": "armor",
            "stats": [
              {
                "type": "stamina",
                "value": 620
              },
              {
                "type": "agility",
                "value": 440
              },
              {
                "type": "mastery",
                "value": 400
              },
              {
                "type": "versatility",
                "value": 360
              }
            ]
          },
          {
            "id": "darkest-5",
            "name": "虚空领主的护腿",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "legs",
            "type": "armor",
            "armorType": "leather",
            "stats": [
              {
                "type": "agility",
                "value": 480
              },
              {
                "type": "stamina",
                "value": 870
              },
              {
                "type": "crit",
                "value": 420
              },
              {
                "type": "haste",
                "value": 380
              }
            ],
            "isTier": true
          },
          {
            "id": "darkest-6",
            "name": "至暗之夜的低语",
            "quality": "legendary",
            "baseItemLevel": 635,
            "slot": "neck",
            "type": "jewelry",
            "stats": [
              {
                "type": "stamina",
                "value": 600
              },
              {
                "type": "intellect",
                "value": 420
              },
              {
                "type": "mastery",
                "value": 400
              },
              {
                "type": "versatility",
                "value": 360
              }
            ]
          }
        ]
      }
    ]
  }
];

export function findRaid(raidId: string): Raid | undefined {
  return RAIDS.find(r => r.id === raidId);
}

export function findBoss(raidId: string, bossId: string) {
  return findRaid(raidId)?.bosses.find(b => b.id === bossId);
}

export function findItem(itemId: string) {
  for (const raid of RAIDS) {
    for (const boss of raid.bosses) {
      const item = boss.loot.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  return undefined;
}

export function getAllItems(): { item: any; bossId: string; raidId: string }[] {
  const items: { item: any; bossId: string; raidId: string }[] = [];
  for (const raid of RAIDS) {
    for (const boss of raid.bosses) {
      for (const item of boss.loot) {
        items.push({ item, bossId: boss.id, raidId: raid.id });
      }
    }
  }
  return items;
}

export function getItemById(itemId: string): { item: any; bossId: string; raidId: string } | null {
  for (const raid of RAIDS) {
    for (const boss of raid.bosses) {
      const item = boss.loot.find(i => i.id === itemId);
      if (item) {
        return { item, bossId: boss.id, raidId: raid.id };
      }
    }
  }
  return null;
}

export function getBossById(bossId: string): { boss: any; raidId: string } | null {
  for (const raid of RAIDS) {
    const boss = raid.bosses.find(b => b.id === bossId);
    if (boss) {
      return { boss, raidId: raid.id };
    }
  }
  return null;
}
