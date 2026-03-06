import { useState } from 'react';
import { RAIDS } from '@guild/shared';
import { SLOT_NAMES } from '@guild/shared';
import type { Item } from '@guild/shared';
import { ChevronDown, ChevronRight, BookOpen, Star } from 'lucide-react';

const ARMOR_TYPE_ZH: Record<string, string> = {
  plate: '板甲', mail: '锁甲', leather: '皮甲', cloth: '布甲',
};

const STAT_TYPE_ZH: Record<string, string> = {
  strength:    '力量',
  agility:     '敏捷',
  intellect:   '智力',
  stamina:     '耐力',
  crit:        '暴击',
  haste:       '急速',
  mastery:     '精通',
  versatility: '全能',
};

const STAT_COLORS: Record<string, string> = {
  strength:    'text-red-300',
  agility:     'text-green-400',
  intellect:   'text-blue-300',
  stamina:     'text-orange-300',
  crit:        'text-red-400',
  haste:       'text-green-300',
  mastery:     'text-purple-400',
  versatility: 'text-blue-400',
};

function ItemCard({ item }: { item: Item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-[#0f0f1a] border border-[#2a2a4a] hover:border-purple-800/60 rounded-lg overflow-hidden transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-purple-200 leading-tight">{item.name}</span>
              {item.isTier && (
                <span className="badge-tier flex items-center gap-1 shrink-0">
                  <Star size={9} />套装
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
              <span className="text-[#94a3b8]">{SLOT_NAMES[item.slot] || item.slot}</span>
              {item.armorType && (
                <span className="text-[#94a3b8]">· {ARMOR_TYPE_ZH[item.armorType] || item.armorType}</span>
              )}
              <span className="text-purple-400 font-medium">ilvl {item.itemLevel}</span>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`text-[#475569] shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Stats always visible (compact) */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
          {item.stats.map((stat) => (
            <span key={stat.type} className={`text-xs ${STAT_COLORS[stat.type] || 'text-[#94a3b8]'}`}>
              +{stat.value} {STAT_TYPE_ZH[stat.type] || stat.type}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded: effect */}
      {expanded && item.effect && (
        <div className="px-3 pb-3 border-t border-[#2a2a4a]/60 pt-2">
          <div className="text-xs text-yellow-400/90 leading-relaxed">
            <span className="text-[#475569] mr-1">特效：</span>
            {item.effect}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EquipmentPage() {
  const [expandedRaid, setExpandedRaid] = useState<string | null>(RAIDS[0]?.id);
  const [expandedBosses, setExpandedBosses] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  const toggleBoss = (bossId: string) => {
    setExpandedBosses((prev) => {
      const next = new Set(prev);
      if (next.has(bossId)) next.delete(bossId);
      else next.add(bossId);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold text-[#e2e8f0]">装备手册</h1>
        <input
          className="input ml-auto max-w-64 text-sm"
          placeholder="搜索装备名..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {RAIDS.map((raid) => (
          <div key={raid.id} className="card">
            {/* Raid header */}
            <button
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setExpandedRaid(expandedRaid === raid.id ? null : raid.id)}
            >
              {expandedRaid === raid.id
                ? <ChevronDown className="text-purple-400 shrink-0" size={18} />
                : <ChevronRight className="text-[#475569] shrink-0" size={18} />
              }
              <div>
                <div className="font-bold text-purple-300">{raid.name}</div>
                <div className="text-xs text-[#475569]">{raid.description}</div>
              </div>
              <div className="ml-auto text-xs text-[#475569] shrink-0">
                {raid.bosses.length} Boss · {raid.bosses.reduce((n, b) => n + b.loot.length, 0)} 件
              </div>
            </button>

            {expandedRaid === raid.id && (
              <div className="mt-4 space-y-4 pl-6 border-l border-[#2a2a4a]">
                {raid.bosses.map((boss) => {
                  const filtered = filter
                    ? boss.loot.filter((i) =>
                        i.name.includes(filter) ||
                        (SLOT_NAMES[i.slot] || '').includes(filter) ||
                        (ARMOR_TYPE_ZH[i.armorType || ''] || '').includes(filter) ||
                        i.stats.some((s) => (STAT_TYPE_ZH[s.type] || '').includes(filter))
                      )
                    : boss.loot;
                  if (filter && filtered.length === 0) return null;

                  const isExpanded = expandedBosses.has(boss.id) || !!filter;

                  return (
                    <div key={boss.id}>
                      <button
                        className="flex items-center gap-2 text-sm font-semibold text-[#e2e8f0] hover:text-purple-300 transition-colors mb-2 w-full text-left"
                        onClick={() => toggleBoss(boss.id)}
                      >
                        {isExpanded
                          ? <ChevronDown size={14} className="text-purple-400 shrink-0" />
                          : <ChevronRight size={14} className="text-[#475569] shrink-0" />
                        }
                        <span>{boss.name}</span>
                        <span className="text-xs text-[#475569] font-normal ml-1">
                          ({filtered.length} 件)
                        </span>
                        {boss.loot.some((i) => i.isTier) && (
                          <span className="badge-tier flex items-center gap-1 ml-1">
                            <Star size={9} />有套装
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                          {filtered.map((item) => (
                            <ItemCard key={item.id} item={item} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-[#475569]">点击装备卡片可展开查看特效 · 点击 Boss 名称展开/折叠装备列表</div>
    </div>
  );
}
