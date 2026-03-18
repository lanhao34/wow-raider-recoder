import { useState, useEffect } from 'react';
import { membersApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Users, Plus, Trash2, X, Check, Shield, Calendar, Package, ListChecks, Crown } from 'lucide-react';
import { WOW_CLASS_ZH_MAP, type WowClass, WOW_CLASS_COLORS } from '@guild/shared';

interface MemberWithStats {
  id: number;
  displayName: string;
  wowClass: WowClass;
  wowClassZh: string;
  status: string;
  userId?: number;
  username?: string;
  isAdmin?: boolean;
  stats: {
    participationCount: number;
    itemsReceivedCount: number;
    itemsReceived: Array<{
      itemId: string;
      itemName: string;
      itemLevel: number;
      distributedAt: string;
    }>;
    requirementsCount: number;
    requirements: Array<{
      id: number;
      itemId: string;
      itemName: string;
      priority: string;
    }>;
  };
}

const STATUS_LABELS: Record<string, string> = { active: '在队', backup: '替补', inactive: '非活跃' };
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-900/20 border-green-800/50',
  backup: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50',
  inactive: 'text-[#475569] bg-[#2a2a4a]/50 border-[#2a2a4a]',
};

export default function MembersPage() {
  const { isAdmin } = useAuthStore();
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState<number | null>(null);
  const [form, setForm] = useState({ displayName: '', wowClass: 'warrior' as WowClass, status: 'active' });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await membersApi.stats();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const data = { 
      displayName: form.displayName, 
      wowClass: form.wowClass, 
      wowClassZh: WOW_CLASS_ZH_MAP[form.wowClass],
      status: form.status 
    };
    await membersApi.create(data);
    setShowAdd(false);
    setForm({ displayName: '', wowClass: 'warrior', status: 'active' });
    loadMembers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该角色？')) return;
    await membersApi.delete(id);
    loadMembers();
  };

  const handleSetAdmin = async (memberId: number, userId: number | undefined, isAdmin: boolean) => {
    if (!userId) {
      alert('该角色未关联用户');
      return;
    }
    if (!confirm(`${isAdmin ? '指定' : '取消'} ${members.find(m => m.id === memberId)?.displayName} 为管理员？`)) return;
    
    try {
      await membersApi.setAdmin(memberId, isAdmin);
      loadMembers();
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">成员管理</h1>
        <button className="btn-primary ml-auto flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> 添加角色
        </button>
      </div>

      {loading ? (
        <div className="text-[#475569] text-center py-12">加载中...</div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="card">
              <div className="flex items-start gap-4">
                {/* 角色信息 */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{
                      backgroundColor: (WOW_CLASS_COLORS[m.wowClass] || '#7c3aed') + '33',
                      color: WOW_CLASS_COLORS[m.wowClass] || '#a78bfa',
                    }}
                  >
                    {m.displayName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-lg text-purple-200">{m.displayName}</span>
                      <span className="text-xs text-[#475569]">({m.wowClassZh})</span>
                      {m.isAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded border border-purple-600/50 text-purple-400 bg-purple-900/20 flex items-center gap-1">
                          <Shield size={10} />管理员
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </div>
                    <div className="text-xs text-[#475569] mt-1">
                      账号：{m.username || '未关联'}
                      {m.userId && ` (ID: ${m.userId})`}
                    </div>
                  </div>
                </div>

                {/* 统计摘要 */}
                <div className="flex items-center gap-4 text-xs text-[#475569]">
                  <div className="flex items-center gap-1" title="活动参与">
                    <Calendar size={14} />
                    <span>{m.stats.participationCount} 次</span>
                  </div>
                  <div className="flex items-center gap-1" title="获得装备">
                    <Package size={14} />
                    <span>{m.stats.itemsReceivedCount} 件</span>
                  </div>
                  <div className="flex items-center gap-1" title="装备需求">
                    <ListChecks size={14} />
                    <span>{m.stats.requirementsCount} 条</span>
                  </div>
                  <button
                    onClick={() => setShowStats(showStats === m.id ? null : m.id)}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    {showStats === m.id ? '收起' : '详情'}
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => handleSetAdmin(m.id, m.userId, !m.isAdmin)}
                      className={`btn-ghost flex items-center gap-1 text-xs ${
                        m.isAdmin ? 'text-red-400 hover:bg-red-900/20' : 'text-green-400 hover:bg-green-900/20'
                      }`}
                      title={m.isAdmin ? '取消管理员' : '指定管理员'}
                    >
                      <Shield size={14} />
                      {m.isAdmin ? '取消' : '指定'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-[#475569] hover:text-red-400 transition-colors p-1"
                    title="删除角色"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* 详细统计 */}
              {showStats === m.id && (
                <div className="mt-4 pt-4 border-t border-[#2a2a4a] grid grid-cols-2 gap-4">
                  {/* 获得装备 */}
                  <div>
                    <div className="text-xs font-medium text-[#94a3b8] mb-2 flex items-center gap-2">
                      <Package size={14} />
                      获得装备 ({m.stats.itemsReceivedCount} 件)
                    </div>
                    {m.stats.itemsReceived.length === 0 ? (
                      <div className="text-xs text-[#475569]">暂无记录</div>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {m.stats.itemsReceived.map((item, i) => (
                          <div key={i} className="text-xs text-[#94a3b8] flex items-center justify-between">
                            <span className="text-purple-200">{item.itemName}</span>
                            <span className="text-[#475569]">ilvl {item.itemLevel}</span>
                            <span className="text-[#475569]">{new Date(item.distributedAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 装备需求 */}
                  <div>
                    <div className="text-xs font-medium text-[#94a3b8] mb-2 flex items-center gap-2">
                      <ListChecks size={14} />
                      装备需求 ({m.stats.requirementsCount} 条)
                    </div>
                    {m.stats.requirements.length === 0 ? (
                      <div className="text-xs text-[#475569]">暂无需求</div>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {m.stats.requirements.map((req) => (
                          <div key={req.id} className="text-xs text-[#94a3b8] flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                              req.priority === 'bis' ? 'text-purple-400 border-purple-600/50' :
                              req.priority === 'high' ? 'text-red-400 border-red-800/50' :
                              req.priority === 'medium' ? 'text-yellow-400 border-yellow-800/50' :
                              'text-green-400 border-green-800/50'
                            }`}>
                              {req.priority.toUpperCase()}
                            </span>
                            <span className="text-purple-200">{req.itemName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加角色 Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
              <h2 className="font-bold">添加角色</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#475569] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">角色名</label>
                <input
                  className="input"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="输入角色名"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">职业</label>
                <select
                  className="input"
                  value={form.wowClass}
                  onChange={(e) => setForm({ ...form, wowClass: e.target.value as WowClass })}
                >
                  {Object.entries(WOW_CLASS_ZH_MAP).map(([en, zh]) => (
                    <option key={en} value={en}>{zh}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">状态</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">在队</option>
                  <option value="backup">替补</option>
                  <option value="inactive">非活跃</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#2a2a4a] flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn-primary flex-1" onClick={handleAdd}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
