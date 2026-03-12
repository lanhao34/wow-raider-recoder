import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Sword, Check, X } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // 实时验证
  const validations = useMemo(() => {
    if (tab !== 'register') return null;
    
    const usernameValid = username.length >= 3 && username.length <= 30;
    const passwordValid = password.length >= 6;
    const displayNameValid = displayName.length >= 1 && displayName.length <= 50;
    
    // 密码强度
    let passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
    if (password.length >= 6) {
      if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
        passwordStrength = 'strong';
      } else if (password.length >= 8) {
        passwordStrength = 'medium';
      }
    }
    
    return {
      usernameValid,
      passwordValid,
      displayNameValid,
      passwordStrength,
      allValid: usernameValid && passwordValid && displayNameValid,
    };
  }, [username, password, displayName, tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 前端验证
    if (tab === 'register' && validations) {
      if (!validations.usernameValid) {
        setError('用户名长度 3-30 个字符');
        return;
      }
      if (!validations.passwordValid) {
        setError('密码长度至少 6 位');
        return;
      }
      if (!validations.displayNameValid) {
        setError('显示名称长度 1-50 个字符');
        return;
      }
    }
    
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
              {tab === 'register' && username.length > 0 && (
                <div className={`text-xs mt-1 ${validations?.usernameValid ? 'text-green-400' : 'text-red-400'}`}>
                  {validations?.usernameValid ? (
                    <span className="flex items-center gap-1"><Check size={12} /> 格式正确</span>
                  ) : (
                    <span className="flex items-center gap-1"><X size={12} /> 长度 3-30 个字符</span>
                  )}
                </div>
              )}
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
                {displayName.length > 0 && (
                  <div className={`text-xs mt-1 ${validations?.displayNameValid ? 'text-green-400' : 'text-red-400'}`}>
                    {validations?.displayNameValid ? (
                      <span className="flex items-center gap-1"><Check size={12} /> 格式正确</span>
                    ) : (
                      <span className="flex items-center gap-1"><X size={12} /> 长度 1-50 个字符</span>
                    )}
                  </div>
                )}
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
              {tab === 'register' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {/* 密码强度条 */}
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${
                      validations!.passwordStrength === 'weak' ? 'bg-red-500' : 
                      validations!.passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className={`h-1 flex-1 rounded ${
                      validations!.passwordStrength === 'medium' || validations!.passwordStrength === 'strong' ? 'bg-yellow-500' : 'bg-[#1e293b]'
                    }`} />
                    <div className={`h-1 flex-1 rounded ${
                      validations!.passwordStrength === 'strong' ? 'bg-green-500' : 'bg-[#1e293b]'
                    }`} />
                  </div>
                  <div className="text-xs text-[#475569]">
                    密码强度：
                    <span className={
                      validations!.passwordStrength === 'weak' ? 'text-red-400' : 
                      validations!.passwordStrength === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }>
                      {validations!.passwordStrength === 'weak' ? '弱' : 
                       validations!.passwordStrength === 'medium' ? '中' : '强'}
                    </span>
                  </div>
                  <div className={`text-xs ${validations?.passwordValid ? 'text-green-400' : 'text-red-400'}`}>
                    {validations?.passwordValid ? (
                      <span className="flex items-center gap-1"><Check size={12} /> 格式正确</span>
                    ) : (
                      <span className="flex items-center gap-1"><X size={12} /> 长度至少 6 位</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (tab === 'register' && !validations?.allValid)}
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
