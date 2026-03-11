import { useState, useEffect, useMemo } from 'react';
import { membersApi } from '../api';
import { WOW_CLASS_COLORS, SLOT_NAMES } from '@guild/shared';
import type { WowClass, TierProgress } from '@guild/shared';
import { Shield, CheckCircle, Star, TrendingUp, Users } from 'lucide-react';

const SLOT_LABELS = [
  { key: 'head', label: '头', icon: '👑' },
  { key: 'shoulder', label: '肩', icon: '🛡️' },
  { key: 'chest', label: '胸', icon: '🦺' },
  { key: 'hands', label: '手', icon: '🧤' },
  { key: 'legs', label: '腿', icon: '👖' },
];

interface TierProgressData {
  memberId: number;
  memberName: string;
  wowClass: string;
  head: boolean;
  shoulder: boolean;
  chest: boolean;
  hands: boolean;
  legs: boolean;
  count: number;
}

function TierBadge({ count }: { count: number }) {
  if (count >= 4) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/50">
        <Star className="w-3 h-3" />
        {count}/5
      </span>
    );
  }
  if (count >= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/50">
        <TrendingUp className="w-3 h-3" />
        {count}/5
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs border border-slate-600">
      {count}/5
    </span>
  );
}

function ProgressBar({ count }: { count: number }) {
  const percentage = (count / 5) * 100;
  let colorClass = 'bg-slate-600';
  if (count >= 4) colorClass = 'bg-yellow-500';
  else if (count >= 2) colorClass = 'bg-blue-500';

  return (
    <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
      <div
        className={`${colorClass} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function TierProgressPage() {
  const [progress, setProgress] = useState<TierProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    membersApi.tierProgress().then((data: TierProgressData[]) => {
      setProgress(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = progress.length;
    const with4Plus = progress.filter(p => p.count >= 4).length;
    const with2Plus = progress.filter(p => p.count >= 2).length;
    const avgPieces = total > 0 ? progress.reduce((sum, p) => sum + p.count, 0) / total : 0;
    return { total, with4Plus, with2Plus, avgPieces };
  }, [progress]);

  const sortedProgress = useMemo(() => {
    return [...progress].sort((a, b) => {
      // 先按件数降序，再按名字升序
      if (b.count !== a.count) return b.count - a.count;
      return a.memberName.localeCompare(b.memberName);
    });
  }, [progress]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="text-purple-400" size={24} />
          <div>
            <h1 className="text-xl font-bold text-white">套装追踪</h1>
            <p className="text-xs text-violet-400">4件套激活额外属性，追踪公会成员套装收集进度</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'grid'
                ? 'bg-violet-700 text-white'
                : 'bg-[#1a1a2e] text-violet-400 hover:bg-violet-900/30'
            }`}
          >
            网格视图
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'table'
                ? 'bg-violet-700 text-white'
                : 'bg-[#1a1a2e] text-violet-400 hover:bg-violet-900/30'
            }`}
          >
            表格视图
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-400">追踪成员</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">4件套达成</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.with4Plus}</p>
          <p className="text-xs text-violet-500 mt-1">
            {stats.total > 0 ? Math.round((stats.with4Plus / stats.total) * 100) : 0}% 成员
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">2件套达成</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats.with2Plus}</p>
          <p className="text-xs text-violet-500 mt-1">
            {stats.total > 0 ? Math.round((stats.with2Plus / stats.total) * 100) : 0}% 成员
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400">平均件数</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.avgPieces.toFixed(1)}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-violet-400 py-12 animate-pulse">加载中...</div>
      ) : progress.length === 0 ? (
        <div className="card text-center py-12 text-violet-400/50">
          <Shield className="mx-auto mb-3 opacity-30" size={40} />
          <p>暂无数据</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedProgress.map((row) => (
            <div
              key={row.memberId}
              className={`card p-4 transition-all hover:border-violet-600/50 ${
                row.count >= 4 ? 'border-yellow-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="font-medium text-white"
                  style={{ color: WOW_CLASS_COLORS[row.wowClass as WowClass] || '#e2e8f0' }}
                >
                  {row.memberName}
                </div>
                <TierBadge count={row.count} />
              </div>

              {/* Slot Grid */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {SLOT_LABELS.map((s) => {
                  const hasPiece = (row as unknown as Record<string, boolean>)[s.key];
                  return (
                    <div
                      key={s.key}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        hasPiece
                          ? 'bg-yellow-500/20 border border-yellow-500/50'
                          : 'bg-slate-800/50 border border-slate-700'
                      }`}
                    >
                      <span className="text-lg mb-1">{s.icon}</span>
                      <span className={`text-xs ${hasPiece ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <ProgressBar count={row.count} />

              {/* Bonus Text */}
              {row.count >= 4 && (
                <p className="text-xs text-yellow-400 mt-2 text-center">
                  ✨ 套装效果已激活
                </p>
              )}
              {row.count >= 2 && row.count < 4 && (
                <p className="text-xs text-blue-400 mt-2 text-center">
                  🔥 2件套效果已激活
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4a]">
                <th className="text-left text-xs text-violet-400 font-medium pb-3 pr-4">成员</th>
                {SLOT_LABELS.map((s) => (
                  <th key={s.key} className="text-center text-xs text-violet-400 font-medium pb-3 px-2">
                    {s.label}
                  </th>
                ))}
                <th className="text-center text-xs text-violet-400 font-medium pb-3 pl-4">进度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]/50">
              {sortedProgress.map((row) => (
                <tr key={row.memberId} className="hover:bg-violet-900/10 transition-colors">
                  <td className="py-3 pr-4">
                    <div
                      className="font-medium text-sm"
                      style={{ color: WOW_CLASS_COLORS[row.wowClass as WowClass] || '#e2e8f0' }}
                    >
                      {row.memberName}
                    </div>
                  </td>
                  {SLOT_LABELS.map((s) => (
                    <td key={s.key} className="text-center py-3 px-2">
                      {(row as unknown as Record<string, boolean>)[s.key] ? (
                        <CheckCircle className="mx-auto text-yellow-400" size={18} />
                      ) : (
                        <div className="mx-auto w-4 h-4 rounded-full border border-slate-700 bg-slate-800/50" />
                      )}
                    </td>
                  ))}
                  <td className="text-center py-3 pl-4">
                    <TierBadge count={row.count} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
