import { useState, useMemo } from 'react';
import { RAIDS, findItem, SLOT_NAMES, DIFFICULTY_CONFIG, getItemLevelForDifficulty, generateWowheadUrl } from '@guild/shared';
import { requirementsApi } from '../api';
import { useAuthStore } from '../store/auth';
import type { Item, RequirementPriority } from '@guild/shared';
import {
  BookOpen, Star, ExternalLink, Search, ChevronRight,
  Sword, Heart, Sparkles, Shield, Plus, Check, AlertTriangle
} from 'lucide-react';

type ItemQuality = 'uncommon' | 'rare' | 'epic' | 'legendary';

const qualityColors: Record<ItemQuality, string> = {
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

const qualityBgColors: Record<ItemQuality, string> = {
  uncommon: 'bg-green-400/10',
  rare: 'bg-blue-400/10',
  epic: 'bg-purple-500/15',
  legendary: 'bg-amber-500/15',
};

const priorityLabels: Record<RequirementPriority, { label: string; color: string; bgColor: string }> = {
  bis: { label: 'BIS', color: 'text-purple-300', bgColor: 'bg-purple-600/30 border-purple-500/50' },
  high: { label: '高', color: 'text-red-400', bgColor: 'bg-red-900/30 border-red-500/50' },
  medium: { label: '中', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30 border-yellow-500/50' },
  low: { label: '低', color: 'text-blue-400', bgColor: 'bg-blue-900/30 border-blue-500/50' },
};

const ARMOR_TYPE_ZH: Record<string, string> = {
  plate: '板甲', mail: '锁甲', leather: '皮甲', cloth: '布甲',
};

const STAT_TYPE_ZH: Record<string, string> = {
  stamina: '耐力', strength: '力量', agility: '敏捷', intellect: '智力',
  crit: '暴击', haste: '急速', mastery: '精通', versatility: '全能',
};

function getStatIcon(type: string) {
  switch (type) {
    case 'strength':
    case 'agility': return <Sword className="w-3 h-3" />;
    case 'intellect': return <Sparkles className="w-3 h-3" />;
    case 'stamina': return <Heart className="w-3 h-3" />;
    default: return <Shield className="w-3 h-3" />;
  }
}

interface ItemCardProps {
  item: Item;
  bossName: string;
  raidName: string;
  difficulty?: 'normal' | 'heroic' | 'mythic';
}

function ItemCard({ item, bossName, raidName, difficulty = 'heroic' }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const itemLevel = getItemLevelForDifficulty(item.baseItemLevel, difficulty);
  const wowheadUrl = generateWowheadUrl(item.name);

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all cursor-pointer ${
        qualityBgColors[item.quality] || qualityBgColors.epic
      } border-violet-800/30 hover:border-violet-600/50`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* 装备名称和标签 */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`font-semibold ${qualityColors[item.quality] || 'text-purple-400'}`}>
                {item.name}
              </span>
              {item.isTier && (
                <span className="badge-tier flex items-center gap-1">
                  <Star size={10} />套装
                </span>
              )}
              <a
                href={wowheadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:text-amber-400 transition-colors"
                title="在Wowhead查看"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* 装等、部位、护甲类型 */}
            <div className="flex items-center gap-2 text-sm text-violet-300 mb-2 flex-wrap">
              <span className="text-amber-400 font-medium">装等 {itemLevel}</span>
              <span className="text-violet-500">·</span>
              <span>{SLOT_NAMES[item.slot] || item.slot}</span>
              {item.armorType && (
                <>
                  <span className="text-violet-500">·</span>
                  <span>{ARMOR_TYPE_ZH[item.armorType] || item.armorType}</span>
                </>
              )}
            </div>

            {/* 来源 */}
            <div className="text-xs text-violet-500 mb-2">
              {raidName} · {bossName}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 mb-2">
              {item.stats.map((stat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs text-violet-200 bg-slate-950/60 px-2 py-1 rounded border border-violet-800/30"
                >
                  {getStatIcon(stat.type)}
                  {STAT_TYPE_ZH[stat.type] || stat.type} +{stat.value}
                </span>
              ))}
            </div>
          </div>

          <ChevronRight
            className={`text-violet-500 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`}
            size={16}
          />
        </div>

        {/* Expanded: effect and details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-violet-800/30">
            {item.effect && (
              <p className="text-xs text-amber-400 mb-3">
                <span className="text-violet-500 mr-1">特效：</span>
                {item.effect}
              </p>
            )}

            {/* 难度装等对照 */}
            <div className="text-xs text-violet-400 space-y-1">
              <p className="text-violet-500">各难度装等：</p>
              <div className="flex gap-3">
                <span className="text-green-400">普通: {getItemLevelForDifficulty(item.baseItemLevel, 'normal')}</span>
                <span className="text-purple-400">英雄: {getItemLevelForDifficulty(item.baseItemLevel, 'heroic')}</span>
                <span className="text-orange-400">史诗: {getItemLevelForDifficulty(item.baseItemLevel, 'mythic')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  const [selectedRaid, setSelectedRaid] = useState(RAIDS[0]?.id || '');
  const [selectedBoss, setSelectedBoss] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSlot, setFilterSlot] = useState<string>('');

  const currentRaid = useMemo(() => {
    return RAIDS.find(r => r.id === selectedRaid);
  }, [selectedRaid]);

  const currentBoss = useMemo(() => {
    if (!selectedBoss || !currentRaid) return null;
    return currentRaid.bosses.find(b => b.id === selectedBoss);
  }, [selectedBoss, currentRaid]);

  // 过滤装备
  const filteredBosses = useMemo(() => {
    if (!currentRaid) return [];
    if (!searchQuery.trim() && !filterSlot) return currentRaid.bosses;

    const query = searchQuery.toLowerCase();
    return currentRaid.bosses.map(boss => ({
      ...boss,
      loot: boss.loot.filter(item => {
        const matchesSearch = !searchQuery ||
          item.name.toLowerCase().includes(query) ||
          (SLOT_NAMES[item.slot] || '').includes(query);
        const matchesSlot = !filterSlot || item.slot === filterSlot;
        return matchesSearch && matchesSlot;
      })
    })).filter(boss => boss.loot.length > 0);
  }, [currentRaid, searchQuery, filterSlot]);

  // 所有部位选项
  const allSlots = useMemo(() => {
    const slots = new Set<string>();
    RAIDS.forEach(raid => {
      raid.bosses.forEach(boss => {
        boss.loot.forEach(item => slots.add(item.slot));
      });
    });
    return Array.from(slots).sort();
  }, []);

  if (!currentRaid) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-violet-400/50">
        <BookOpen className="w-12 h-12 mb-4" />
        <p>暂无副本数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-purple-400" size={24} />
          <div>
            <h1 className="text-xl font-bold text-white">装备手册</h1>
            <p className="text-xs text-violet-400">查看团本掉落，点击装备查看详情</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索装备..."
              className="input pl-10 text-sm w-48"
            />
          </div>
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            className="select text-sm"
          >
            <option value="">所有部位</option>
            {allSlots.map(slot => (
              <option key={slot} value={slot}>{SLOT_NAMES[slot as keyof typeof SLOT_NAMES] || slot}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Raid Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {RAIDS.map((raid) => (
          <button
            key={raid.id}
            onClick={() => {
              setSelectedRaid(raid.id);
              setSelectedBoss(null);
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedRaid === raid.id
                ? 'bg-gradient-to-r from-violet-700 to-purple-700 text-white shadow-lg shadow-violet-500/20'
                : 'bg-[#1a1a2e] text-violet-300 hover:bg-violet-900/30 border border-[#2a2a4a]'
            }`}
          >
            {raid.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Boss List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-violet-300 mb-3">选择首领</h3>
          {filteredBosses.length > 0 ? (
            filteredBosses.map((boss) => (
              <button
                key={boss.id}
                onClick={() => setSelectedBoss(boss.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedBoss === boss.id
                    ? 'bg-gradient-to-r from-violet-800/40 to-purple-800/40 border-amber-500/50 text-white'
                    : 'bg-[#1a1a2e] border-[#2a2a4a] text-violet-200 hover:border-violet-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{boss.order}. {boss.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-xs text-violet-500 mt-1">{boss.loot.length} 件装备</p>
              </button>
            ))
          ) : (
            <p className="text-violet-500 text-sm text-center py-4">没有找到匹配的装备</p>
          )}
        </div>

        {/* Loot List */}
        <div className="lg:col-span-3">
          {currentBoss ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {currentBoss.name} 的掉落
                </h3>
                <span className="badge-epic">
                  {currentBoss.loot.length} 件装备
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBoss.loot.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    bossName={currentBoss.name}
                    raidName={currentRaid.name}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-violet-400/50">
              <BookOpen className="w-12 h-12 mb-4" />
              <p>请选择左侧首领查看掉落</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
