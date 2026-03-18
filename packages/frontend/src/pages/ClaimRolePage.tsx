import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Users, Check, Plus, X } from 'lucide-react';
import { WOW_CLASS_ZH_MAP, type WowClass, WOW_CLASS_COLORS } from '@guild/shared';

interface Member {
  id: number;
  displayName: string;
  wowClass: string;
  wowClassZh: string;
  tags?: string[];
  status: string;
}

export default function ClaimRolePage() {
  const { user, isAdmin, token } = useAuthStore();
  const navigate = useNavigate();
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: '', wowClass: 'warrior' as WowClass, status: 'active' });

  useEffect(() => {
    fetchAvailableMembers();
  }, []);

  const fetchAvailableMembers = async () => {
    try {
      const res = await fetch('/api/claims/available', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login');
          return;
        }
      }
      const data = await res.json();
      setAvailableMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch available members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (memberId: number) => {
    setClaiming(memberId);
    setMessage(null);
    
    try {
      const res = await fetch('/api/claims/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ memberId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: '角色认领成功！' });
        // 重新加载用户信息
        await useAuthStore.getState().loadFromStorage();
        // 延迟跳转到主页
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || '认领失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setClaiming(null);
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
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          displayName: createForm.displayName,
          wowClass: createForm.wowClass,
          wowClassZh: WOW_CLASS_ZH_MAP[createForm.wowClass],
          status: createForm.status,
          bindToSelf: true, // 普通用户创建时自动绑定到自己
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: '角色创建成功！' });
        setShowCreate(false);
        setCreateForm({ displayName: '', wowClass: 'warrior', status: 'active' });
        // 重新加载用户信息
        await useAuthStore.getState().loadFromStorage();
        // 延迟跳转到主页
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || '创建失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-purple-400" size={24} />
          <h1 className="text-xl font-bold">创建或认领角色</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> 创建角色
        </button>
      </div>

      <div className="card mb-6 bg-purple-900/20 border-purple-800/50">
        <p className="text-sm text-purple-200 mb-2">
          你可以创建自己的角色，或认领已有的未绑定角色。
        </p>
        <p className="text-xs text-purple-300">
          💡 每个用户可以创建或认领多个角色。
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
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
          {availableMembers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3">可认领的角色</h2>
              <div className="space-y-3">
                {availableMembers.map((member) => (
                  <div key={member.id} className="card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center">
                        <Users className="text-purple-300" size={24} />
                      </div>
                      <div>
                        <div className="font-medium text-lg">{member.displayName}</div>
                        <div className="text-sm text-[#475569]">{member.wowClassZh}</div>
                      </div>
                    </div>
                    <button
                      className="btn-primary flex items-center gap-2"
                      onClick={() => handleClaim(member.id)}
                      disabled={claiming === member.id}
                    >
                      {claiming === member.id ? (
                        <>
                          <Check size={16} className="animate-spin" />
                          认领中...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          认领
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* 创建角色 Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
              <h2 className="font-bold">创建角色</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#475569] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">角色名</label>
                <input
                  className="input"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  placeholder="输入角色名"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">职业</label>
                <select
                  className="input"
                  value={createForm.wowClass}
                  onChange={(e) => setCreateForm({ ...createForm, wowClass: e.target.value as WowClass })}
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
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                >
                  <option value="active">在队</option>
                  <option value="backup">替补</option>
                  <option value="inactive">非活跃</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#2a2a4a] flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn-primary flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
