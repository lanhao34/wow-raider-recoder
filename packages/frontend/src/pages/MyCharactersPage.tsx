import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Users, Check, Plus, X, Undo2 } from 'lucide-react';
import { WOW_CLASS_ZH_MAP, type WowClass, WOW_CLASS_COLORS } from '@guild/shared';
import { claimsApi, membersApi } from '../api';

interface Member {
  id: number;
  displayName: string;
  wowClass: string;
  wowClassZh: string;
  tags?: string[];
  status: string;
  source?: string;
}

export default function MyCharactersPage() {
  const { user, isAdmin, token } = useAuthStore();
  const navigate = useNavigate();
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [myMembers, setMyMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: '', wowClass: 'warrior' as WowClass, status: 'active' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableData, myData] = await Promise.all([
        claimsApi.available(),
        membersApi.my()
      ]);
      setAvailableMembers(availableData || []);
      setMyMembers(myData || []);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      if (error?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (memberId: number) => {
    setClaiming(memberId);
    setMessage(null);
    try {
      await claimsApi.request(memberId);
      setMessage({ type: 'success', text: '角色认领成功！' });
      await useAuthStore.getState().loadFromStorage();
      await fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.error || '认领失败' });
    } finally {
      setClaiming(null);
    }
  };

  const handleReturn = async (memberId: number) => {
    if (!confirm('确认要退回此角色吗？退回后该角色将重回认领池。')) return;
    setReturning(memberId);
    setMessage(null);
    try {
      await claimsApi.returnRole(memberId);
      setMessage({ type: 'success', text: '角色已成功退回！' });
      await useAuthStore.getState().loadFromStorage();
      await fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.error || '退回失败' });
    } finally {
      setReturning(null);
    }
  };

  const handleDelete = async (memberId: number) => {
    if (!confirm('危险：确认要永久删除此角色吗？\n\n仅当此角色未参加过任何团队活动且未拾取过装备时才能删除，否则将失败并建议使用\"退回\"功能。')) return;
    setReturning(memberId); // borrow loading status
    setMessage(null);
    try {
      await membersApi.delete(memberId);
      setMessage({ type: 'success', text: '无数据的冗余角色已成功永久删除！' });
      await useAuthStore.getState().loadFromStorage();
      await fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.error || '删除失败' });
    } finally {
      setReturning(null);
    }
  };

  const handleCreate = async () => {
    if (!createForm.displayName.trim()) {
      setMessage({ type: 'error', text: '请输入角色名' });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      await membersApi.create({
        displayName: createForm.displayName,
        wowClass: createForm.wowClass,
        wowClassZh: WOW_CLASS_ZH_MAP[createForm.wowClass],
        status: createForm.status,
        bindToSelf: true,
      });
      setMessage({ type: 'success', text: '角色创建成功！' });
      setShowCreate(false);
      setCreateForm({ displayName: '', wowClass: 'warrior', status: 'active' });
      await useAuthStore.getState().loadFromStorage();
      await fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.error || '创建失败' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-purple-400" size={28} />
          <h1 className="text-2xl font-bold">我的角色</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> 创建新角色
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-900/30 border-green-800 text-green-200' 
            : 'bg-red-900/30 border-red-800 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center text-[#475569] py-12">加载中...</div>
      ) : (
        <>
          {/* 我的角色区域 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b border-purple-900/50 pb-2">已拥有的角色</h2>
            {myMembers.length === 0 ? (
              <div className="text-[#475569] bg-purple-900/10 border border-purple-900/30 rounded-xl p-6 text-center">
                你还没有绑定任何角色。请在下方认领一个，或者点击上方按钮创建一个新角色。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myMembers.map((member) => (
                  <div key={member.id} className="card flex items-center justify-between bg-purple-900/10 border-purple-800/30">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm"
                        style={{
                          backgroundColor: (WOW_CLASS_COLORS[member.wowClass as WowClass] || '#7c3aed') + '33',
                          color: WOW_CLASS_COLORS[member.wowClass as WowClass] || '#a78bfa',
                        }}
                      >
                        {member.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-purple-100 flex items-center gap-2">
                          {member.displayName}
                        </div>
                        <div className="text-sm text-[#94a3b8] flex gap-2">
                          <span>{member.wowClassZh}</span>
                          <span className="text-purple-400">·</span>
                          <span>{member.status === 'active' ? '在队' : member.status === 'backup' ? '替补' : '非活跃'}</span>
                        </div>
                      </div>
                    </div>
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      {member.source === 'claimed' && (
                        <button
                          className="btn-ghost text-yellow-500 hover:text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-1 px-3 py-1.5 text-sm"
                          onClick={() => handleReturn(member.id)}
                          disabled={returning === member.id}
                          title="认领错了？点击退回"
                        >
                          {returning === member.id ? <Check size={14} className="animate-spin" /> : <Undo2 size={14} />}
                          退回
                        </button>
                      )}
                      {member.source === 'created' && (
                        <button
                          className="btn-ghost text-red-500 hover:text-red-400 hover:bg-red-900/20 flex items-center gap-1 px-3 py-1.5 text-sm"
                          onClick={() => handleDelete(member.id)}
                          disabled={returning === member.id}
                          title="无记录角色可永久删除"
                        >
                          {returning === member.id ? <Check size={14} className="animate-spin" /> : <X size={14} />}
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 可认领角色区域 */}
          {availableMembers.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-4 border-b border-purple-900/50 pb-2 flex items-center gap-2">
                可认领的角色 <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">{availableMembers.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableMembers.map((member) => (
                  <div key={member.id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1a1a2e] border border-purple-900/50 flex items-center justify-center">
                        <Users className="text-purple-400" size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-purple-200">{member.displayName}</div>
                        <div className="text-xs text-[#64748b]">{member.wowClassZh}</div>
                      </div>
                    </div>
                    <button
                      className="btn-primary flex items-center gap-2 text-sm px-3 py-1.5"
                      onClick={() => handleClaim(member.id)}
                      disabled={claiming === member.id}
                    >
                      {claiming === member.id ? (
                        <><Check size={14} className="animate-spin" /> 认领中</>
                      ) : (
                        <><Check size={14} /> 认领</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 创建角色 Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a4a]">
              <h2 className="font-bold text-lg text-purple-100">创建新角色</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#64748b] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">角色名</label>
                <input
                  className="input w-full bg-[#0f0f1a]"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  placeholder="输入你的游戏内角色名"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">职业</label>
                <select
                  className="input w-full bg-[#0f0f1a]"
                  value={createForm.wowClass}
                  onChange={(e) => setCreateForm({ ...createForm, wowClass: e.target.value as WowClass })}
                >
                  {Object.entries(WOW_CLASS_ZH_MAP).map(([en, zh]) => (
                    <option key={en} value={en}>{zh}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">状态</label>
                <select
                  className="input w-full bg-[#0f0f1a]"
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                >
                  <option value="active">在队 (主力)</option>
                  <option value="backup">替补</option>
                  <option value="inactive">非活跃</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-[#2a2a4a] flex gap-3 bg-[#151525] rounded-b-2xl">
              <button className="btn-ghost flex-1 py-2" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-primary flex-1 py-2 font-medium" onClick={handleCreate} disabled={creating}>
                {creating ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
