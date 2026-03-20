import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { WOW_CLASS_COLORS } from '@guild/shared';
import type { WowClass } from '@guild/shared';
import {
  CalendarDays, ListChecks, Shield, Users, Database, LogOut, Sword, Crown
} from 'lucide-react';

export default function Layout() {
  const { user, member, members, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/calendar', label: '活动日历', icon: CalendarDays },
    { to: '/my-characters', label: '我的角色', icon: Users },
    ...(!member ? [] : [
      { to: '/requirements', label: '装备需求', icon: ListChecks },
      { to: '/tier', label: '套装追踪', icon: Shield },
    ]),
    ...(isAdmin ? [
      { to: '/members', label: '成员管理', icon: Users },
      { to: '/data', label: '数据管理', icon: Database },
    ] : []),
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sword className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-sm">元气养老院</span>
              <div className="text-[10px] text-muted-foreground">装备分配系统</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-slate-950"
              style={{ 
                backgroundColor: isAdmin ? '#a855f7' : '#7c3aed',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)'
              }}
            >
              {(user?.displayName || user?.username || '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.displayName || user?.username}
              </div>
              <div className="text-xs flex items-center gap-2">
                {/* 权限标识 */}
                {isAdmin && (
                  <span className="flex items-center gap-1 text-purple-400">
                    <Shield size={10} /> 管理员
                  </span>
                )}
                {!isAdmin && (
                  <span className="text-muted-foreground">普通用户</span>
                )}
              </div>
              {members && members.length > 0 && (
                <div className="text-xs text-[#475569] mt-1">
                  {members.length} 个角色
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
