import { useState, useEffect } from 'react';
import { requirementsApi } from '../api';
import { RAIDS } from '@guild/shared';
import { SLOT_NAMES } from '@guild/shared';
import { ListChecks, Plus, Trash2, Star } from 'lucide-react';

interface Requirement {
  id: number;
  memberId: number;
  itemId: string;
  itemName: string;
  priority: 'bis' | 'high' | 'medium' | 'low';
  note?: string;
  createdAt: string;
}

const PRIORITY_LABELS = { bis: 'BIS', high: '高', medium: '中', low: '低' };
const PRIORITY_COLORS = {
  bis: 'text-purple-400 bg-purple-900/30 border-purple-600/50',
  high: 'text-red-400 bg-red-900/20 border-red-800/50',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50',
  low: 'text-green-400 bg-green-900/20 border-green-800/50',
};

// Flatten all items for the picker
const ALL_ITEMS = RAIDS.flatMap((r) => r.bosses.flatMap((b) => b.loot.map((i) => ({ ...i, raidName: r.name, bossName: b.name }))));

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [priority, setPriority] = useState<'bis' | 'high' | 'medium' | 'low'>('medium');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requirementsApi.list().then(setRequirements).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const item = ALL_ITEMS.find((i) => i.id === selectedItem);
    if (!item) return;
    try {
      const req = await requirementsApi.create({
        itemId: item.id,
        itemName: item.name,
        priority,
        note: note || undefined,
      });
      setRequirements((prev) => [req, ...prev]);
      setShowPicker(false);
      setSelectedItem('');
      setNote('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || '添加失败');
    }
  };

  const handleDelete = async (id: number) => {
    await requirementsApi.delete(id);
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = filter
    ? ALL_ITEMS.filter((i) => i.name.includes(filter) || i.bossName.includes(filter) || i.raidName.includes(filter))
    : ALL_ITEMS;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ListChecks className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">我的需求</h1>
        <button className="btn-primary ml-auto flex items-center gap-2" onClick={() => setShowPicker(true)}>
          <Plus size={16} /> 添加需求
        </button>
      </div>

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
                    <span className="font-medium text-purple-200">{req.itemName}</span>
                    {item?.isTier && <span className="badge-tier flex items-center gap-1"><Star size={10} />套装</span>}
                    <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[req.priority]}`}>
                      {PRIORITY_LABELS[req.priority]}优先
                    </span>
                  </div>
                  <div className="text-xs text-[#475569] mt-1">
                    {item ? `${item.raidName} · ${item.bossName} · ${SLOT_NAMES[item.slot] || item.slot}` : req.itemId}
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
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[#2a2a4a] flex items-center gap-3">
              <h2 className="font-bold text-lg">选择装备</h2>
              <input
                className="input flex-1 text-sm"
                placeholder="搜索装备名..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button className="text-[#475569] hover:text-white text-xl px-2" onClick={() => { setShowPicker(false); setFilter(''); }}>✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedItem === item.id
                      ? 'bg-purple-900/40 border-purple-600'
                      : 'border-transparent hover:bg-[#2a2a4a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-200 font-medium">{item.name}</span>
                    {item.isTier && <span className="badge-tier flex items-center gap-1"><Star size={10} />套装</span>}
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5">
                    {item.raidName} · {item.bossName} · {SLOT_NAMES[item.slot] || item.slot}
                  </div>
                </button>
              ))}
            </div>

            {selectedItem && (
              <div className="p-4 border-t border-[#2a2a4a] space-y-3">
                <div className="flex gap-3 items-center">
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
                  <input
                    className="input flex-1 text-sm"
                    placeholder="备注（可选）"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <button className="btn-primary w-full" onClick={handleAdd}>确认添加</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
