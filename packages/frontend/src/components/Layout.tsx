import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { WOW_CLASS_COLORS } from '@guild/shared';
import type { WowClass } from '@guild/shared';
import {
  CalendarDays, BookOpen, ListChecks, Shield, Users, Database, LogOut, Sword
} from 'lucide-react';

export default function Layout() {
  const { user, member, isLeader, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/calendar', label: '日程日历', icon: CalendarDays },
    { to: '/equipment', label: '装备手册', icon: BookOpen },
    { to: '/requirements', label: '我的需求', icon: ListChecks },
    { to: '/tier', label: '套装追踪', icon: Shield },
    ...(isLeader ? [
      { to: '/members', label: '成员管理', icon: Users },
      { to: '/data', label: '数据管理', icon: Database },
    ] : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a2e] border-r border-[#2a2a4a] flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-2 mb-1">
            <Sword className="text-purple-400" size={20} />
            <span className="font-bold text-purple-300 text-sm">元气养老院</span>
          </div>
          <div className="text-xs text-[#475569]">装备分配系统</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-800/50'
                    : 'text-[#94a3b8] hover:bg-[#2a2a4a] hover:text-[#e2e8f0]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-[#2a2a4a]">
          <div className="mb-2">
            <div className="text-sm font-medium text-[#e2e8f0]">{member?.displayName || user?.displayName}</div>
            <div className="text-xs flex items-center gap-1">
              {isLeader && <span className="text-yellow-400">团长 · </span>}
              {member ? (
                <span style={{ color: WOW_CLASS_COLORS[member.wowClass as WowClass] || '#94a3b8' }}>
                  {member.wowClassZh}
                </span>
              ) : (
                <span className="text-[#475569]">未绑定角色</span>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-[#475569] hover:text-red-400 transition-colors">
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
