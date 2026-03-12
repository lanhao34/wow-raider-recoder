import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { UserCheck, Users, Clock, Check, X } from 'lucide-react';

interface Member {
  id: number;
  displayName: string;
  wowClass: string;
  wowClassZh: string;
  isLeader: boolean;
  status: string;
}

export default function ClaimRolePage() {
  const { user, isLeader, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchAvailableMembers();
  }, []);

  const fetchAvailableMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/claims/available', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      setAvailableMembers(data);
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
      const token = localStorage.getItem('token');
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
        setMessage({ type: 'success', text: '认领申请已提交，等待团长确认' });
        fetchAvailableMembers();
      } else {
        setMessage({ type: 'error', text: data.error || '认领失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setClaiming(null);
    }
  };

  if (isLeader || isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="text-purple-400" size={24} />
          <h1 className="text-xl font-bold">角色认领管理</h1>
        </div>

        <div className="card mb-6 bg-purple-900/20 border-purple-800/50">
          <p className="text-sm text-purple-200">
            这里是团员提交的角色认领申请。请确认申请人身份后批准或拒绝。
          </p>
        </div>

        <PendingClaims />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">认领角色</h1>
      </div>

      <div className="card mb-6 bg-purple-900/20 border-purple-800/50">
        <p className="text-sm text-purple-200 mb-2">
          以下是团长预先创建的角色。选择你的角色并提交认领申请，等待团长确认后即可获得权限。
        </p>
        <p className="text-xs text-purple-300">
          💡 如果没有找到你的角色，请联系团长创建。
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
      ) : availableMembers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto text-[#475569] mb-4" size={48} />
          <p className="text-[#475569] mb-4">暂无可认领的角色</p>
          <p className="text-sm text-[#475569]">
            请联系团长创建角色，或等待团长导入成员名单
          </p>
        </div>
      ) : (
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
                    <Clock size={16} className="animate-spin" />
                    提交中...
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
      )}
    </div>
  );
}

// 待确认的认领申请组件（仅团长/超管可见）
function PendingClaims() {
  const [pending, setPending] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/claims/pending', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      setPending(data);
    } catch (error) {
      console.error('Failed to fetch pending claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (memberId: number) => {
    setProcessing(memberId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/claims/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ memberId }),
      });
      
      if (res.ok) {
        fetchPendingClaims();
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (memberId: number) => {
    setProcessing(memberId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/claims/reject', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ memberId }),
      });
      
      if (res.ok) {
        fetchPendingClaims();
      }
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="text-center text-[#475569] py-12">加载中...</div>;
  }

  if (pending.length === 0) {
    return (
      <div className="card text-center py-12">
        <Clock className="mx-auto text-[#475569] mb-4" size={48} />
        <p className="text-[#475569]">暂无待确认的认领申请</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((member) => (
        <div key={member.id} className="card flex items-center justify-between border-amber-800/30 bg-amber-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center">
              <Clock className="text-amber-400" size={24} />
            </div>
            <div>
              <div className="font-medium text-lg">{member.displayName}</div>
              <div className="text-sm text-[#475569]">{member.wowClassZh}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-ghost flex items-center gap-2 text-red-400 hover:bg-red-900/30"
              onClick={() => handleReject(member.id)}
              disabled={processing === member.id}
            >
              <X size={16} />
              拒绝
            </button>
            <button
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(member.id)}
              disabled={processing === member.id}
            >
              <Check size={16} />
              确认
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
