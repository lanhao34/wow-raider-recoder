import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { requirementsApi } from '../api';
import { RAIDS, SLOT_NAMES, QUALITY_COLORS, QUALITY_BORDERS, QUALITY_BG, type ItemSlot } from '@guild/shared';
import { ListChecks, Plus, Trash2, Star, Search, X, Users } from 'lucide-react';

interface Member {
  id: number;
  displayName: string;
  wowClass: string;
  wowClassZh: string;
  tags?: string[];
  status: string;
}

interface Requirement {
  id: number;
  memberId: number;
  itemId: string;
  itemName: string;
  priority: 'bis' | 'high' | 'medium' | 'low';
  note?: string;
  createdAt: string;
}

interface WoWItem {
  id: string;
  name: string;
  slot: ItemSlot | string;
  quality: string;
  itemLevel: number;
  isTier?: boolean;
  raidName: string;
  bossName: string;
}

const PRIORITY_LABELS: Record<string, string> = { bis: 'BIS', high: '高优先', medium: '中等', low: '低' };
const PRIORITY_COLORS: Record<string, string> = {
  bis: 'text-purple-400 bg-purple-900/30 border-purple-600/50',
  high: 'text-red-400 bg-red-900/20 border-red-800/50',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50',
  low: 'text-green-400 bg-green-900/20 border-green-800/50',
};

// 扁平化所有装备
const ALL_ITEMS = RAIDS.flatMap((raid) =>
  raid.bosses.flatMap((boss) =>
    boss.loot.map((item) => ({
      ...item,
      raidName: raid.nameZh || raid.name,
      bossName: boss.nameZh || boss.name,
    }))
  )
);

export default function RequirementsPage() {
  const { member, members, token } = useAuthStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [priority, setPriority] = useState<'bis' | 'high' | 'medium' | 'low'>('medium');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  // 多角色用户需要选择角色
  const hasMultipleMembers = ((members as Member[] | null)?.length || 0) > 1;
  const hasNoMembers = !members || members.length === 0;

  useEffect(() => {
    // 默认选择第一个角色
    if (members && members.length > 0 && !selectedMemberId) {
      setSelectedMemberId((members as Member[])[0].id);
    }
  }, [members]);

  useEffect(() => {
    if (!selectedMemberId) return;
    requirementsApi.list(selectedMemberId).then(setRequirements).finally(() => setLoading(false));
  }, [selectedMemberId]);

  const handleAdd = async () => {
    const item = ALL_ITEMS.find((i) => i.id === selectedItem);
    if (!item || !selectedMemberId) return;
    try {
      const req = await requirementsApi.create({
        memberId: selectedMemberId,
        itemId: item.id,
        itemName: item.name,
        priority,
        note: note || undefined,
      });
      setRequirements((prev) => [req, ...prev]);
      setShowPicker(false);
      setSelectedItem('');
      setNote('');
      setAddError(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; code?: string } } })?.response?.data;
      if ((msg as any)?.code === 'NO_MEMBER') {
        setAddError('请先创建或认领角色');
      } else {
        alert((msg as any)?.error || '添加失败');
      }
    }
  };

  const handleDelete = async (id: number) => {
    await requirementsApi.delete(id);
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = filter
    ? ALL_ITEMS.filter((i) =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.bossName.toLowerCase().includes(filter.toLowerCase()) ||
        i.raidName.toLowerCase().includes(filter.toLowerCase())
      )
    : ALL_ITEMS;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ListChecks className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">装备需求</h1>
        {!hasNoMembers && (
          <button className="btn-primary ml-auto flex items-center gap-2" onClick={() => setShowPicker(true)}>
            <Plus size={16} /> 添加需求
          </button>
        )}
      </div>

      {/* 没有角色的提示 */}
      {hasNoMembers && (
        <div className="card bg-amber-900/20 border-amber-800/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center shrink-0">
              <Users className="text-amber-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-200 mb-2">需要先创建或认领角色</h3>
              <p className="text-sm text-amber-100 mb-4">
                登记装备需求前，你需要先创建游戏角色，或认领团长预创建的角色。
              </p>
              <div className="flex gap-3">
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = '/claim'}
                >
                  创建/认领角色
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 多角色选择 */}
      {hasMultipleMembers && (
        <div className="card mb-6">
          <label className="block text-sm text-[#94a3b8] mb-2">选择角色</label>
          <div className="flex gap-2 flex-wrap">
            {(members as Member[]).map((m: Member) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedMemberId === m.id
                    ? 'bg-purple-900/40 border-purple-600 text-purple-200'
                    : 'bg-[#1a1a2e] border-[#2a2a4a] text-[#94a3b8] hover:border-purple-700/50'
                }`}
              >
                {m.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[#475569] text-center py-12">加载中...</div>
      ) : requirements.length === 0 ? (
        <div className="card text-center py-12 text-[#475569]">
          <ListChecks className="mx-auto mb-3 opacity-30" size={40} />
          <p>暂无需求，点击「添加需求」开始</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => {
            const item = ALL_ITEMS.find((i) => i.id === req.itemId);
            return (
              <div key={req.id} className="card flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${QUALITY_COLORS[req.priority === 'bis' ? 'epic' : 'rare'] || 'text-purple-200'}`}>
                      {req.itemName}
                    </span>
                    {item?.isTier && (
                      <span className="badge-tier flex items-center gap-1">
                        <Star size={10} />套装
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[req.priority]}`}>
                      {PRIORITY_LABELS[req.priority]}
                    </span>
                  </div>
                  <div className="text-xs text-[#475569] mt-1">
                    {item ? `${item.raidName} · ${item.bossName} · ${SLOT_NAMES[item.slot as ItemSlot] || item.slot}` : req.itemId}
                    {req.note && ` · ${req.note}`}
                  </div>
                </div>
                <button onClick={() => handleDelete(req.id)} className="text-[#475569] hover:text-red-400 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[#2a2a4a] flex items-center gap-3">
              <h2 className="font-bold text-lg">选择装备</h2>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" size={16} />
                <input
                  className="input pl-10 text-sm"
                  placeholder="搜索装备名、BOSS、副本..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="text-[#475569] hover:text-white text-xl px-2" onClick={() => { setShowPicker(false); setFilter(''); }}>
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {/* 按副本和 BOSS 分组显示 */}
              {RAIDS.map((raid) => {
                const raidItems = filtered.filter((item) => item.raidName === (raid.nameZh || raid.name));
                if (raidItems.length === 0) return null;

                return (
                  <div key={raid.id} className="mb-6">
                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {raid.nameZh || raid.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {raid.bosses.map((boss) => {
                        const bossItems = raidItems.filter((item) => item.bossName === (boss.nameZh || boss.name));
                        if (bossItems.length === 0) return null;

                        return (
                          <div key={boss.id} className="bg-[#0f0f1a] rounded-lg p-3 border border-[#2a2a4a]">
                            <div className="text-xs font-medium text-[#475569] mb-2">{boss.nameZh || boss.name}</div>
                            <div className="space-y-1">
                              {bossItems.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSelectedItem(item.id)}
                                  className={`w-full text-left p-2 rounded border transition-all text-sm ${
                                    selectedItem === item.id
                                      ? `${QUALITY_BORDERS[item.quality] || 'border-purple-600'} ${QUALITY_BG[item.quality] || 'bg-purple-900/20'} border`
                                      : 'border-transparent hover:bg-[#2a2a4a]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium ${QUALITY_COLORS[item.quality] || 'text-purple-200'}`}>
                                      {item.name}
                                    </span>
                                    {item.isTier && (
                                      <span className="badge-tier flex items-center gap-1 text-xs">
                                        <Star size={8} />套装
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#475569] mt-0.5">
                                    {SLOT_NAMES[item.slot as ItemSlot] || item.slot} · ilvl {item.itemLevel}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedItem && (
              <div className="p-4 border-t border-[#2a2a4a] space-y-3">
                <div className="flex gap-3 items-center flex-wrap">
                  <span className="text-sm text-[#94a3b8]">优先级</span>
                  {(['bis', 'high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-xs px-3 py-1 rounded border transition-all ${
                        priority === p ? PRIORITY_COLORS[p] : 'border-[#2a2a4a] text-[#475569]'
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
                <input
                  className="input text-sm"
                  placeholder="备注（可选）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button className="btn-primary w-full" onClick={handleAdd}>确认添加</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
