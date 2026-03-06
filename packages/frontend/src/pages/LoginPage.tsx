import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Sword } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
      navigate('/calendar');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-900/50 border border-purple-700/50 flex items-center justify-center">
              <Sword className="text-purple-300" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">元气养老院</h1>
          <p className="text-[#475569] mt-1">装备分配管理系统</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex mb-6 bg-[#0f0f1a] rounded-lg p-1">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-purple-700 text-white' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1">用户名</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="3-30 个字符"
                required
              />
            </div>
            {tab === 'register' && (
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">显示名称</label>
                <input
                  className="input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的角色昵称"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-[#94a3b8] mb-1">密码</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? '至少 6 位' : ''}
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {isLoading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#475569] mt-4">
          WoW 魔兽世界 · 12.0 Midnight · 公会装备分配
        </p>
      </div>
    </div>
  );
}
