import { useState, useEffect } from 'react';
import { membersApi } from '../api';
import { WOW_CLASS_COLORS } from '@guild/shared';
import type { WowClass } from '@guild/shared';
import { Shield, CheckCircle } from 'lucide-react';

interface TierProgress {
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

const SLOT_LABELS = [
  { key: 'head', label: '头' },
  { key: 'shoulder', label: '肩' },
  { key: 'chest', label: '胸' },
  { key: 'hands', label: '手' },
  { key: 'legs', label: '腿' },
];

export default function TierProgressPage() {
  const [progress, setProgress] = useState<TierProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    membersApi.tierProgress().then(setProgress).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">套装追踪</h1>
        <span className="text-sm text-[#475569] ml-auto">4 件套装激活额外属性</span>
      </div>

      {loading ? (
        <div className="text-center text-[#475569] py-12">加载中...</div>
      ) : progress.length === 0 ? (
        <div className="card text-center py-12 text-[#475569]">
          <Shield className="mx-auto mb-3 opacity-30" size={40} />
          <p>暂无数据</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4a]">
                <th className="text-left text-xs text-[#475569] font-medium pb-3 pr-4">成员</th>
                {SLOT_LABELS.map((s) => (
                  <th key={s.key} className="text-center text-xs text-[#475569] font-medium pb-3 px-2">{s.label}</th>
                ))}
                <th className="text-center text-xs text-[#475569] font-medium pb-3 pl-4">件数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]/50">
              {progress
                .sort((a, b) => b.count - a.count)
                .map((row) => (
                  <tr key={row.memberId} className="hover:bg-[#2a2a4a]/30 transition-colors">
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
                        {(row as unknown as Record<string, unknown>)[s.key] ? (
                          <CheckCircle className="mx-auto text-yellow-400" size={18} />
                        ) : (
                          <div className="mx-auto w-4 h-4 rounded-full border border-[#2a2a4a] bg-[#0f0f1a]" />
                        )}
                      </td>
                    ))}
                    <td className="text-center py-3 pl-4">
                      <span className={`text-sm font-bold ${
                        row.count >= 4 ? 'text-yellow-400' : row.count >= 2 ? 'text-blue-400' : 'text-[#475569]'
                      }`}>{row.count}/5</span>
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
