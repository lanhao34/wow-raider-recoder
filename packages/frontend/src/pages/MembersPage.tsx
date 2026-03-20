import { useState, useEffect, useRef, useMemo } from 'react';
import { membersApi, authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Plus, Users, Archive, Trash2, Shield, UserX, UserPlus, Undo2, Check, ListChecks, Upload, X, Search, Filter } from 'lucide-react';
import { WOW_CLASS_ZH_MAP, type WowClass, WOW_CLASS_COLORS } from '@guild/shared';
import * as XLSX from 'xlsx';

interface MemberWithStats {
  id: number;
  displayName: string;
  wowClass: WowClass;
  wowClassZh: string;
  status: string;
  userId?: number | null;
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
  const { isAdmin, user } = useAuthStore();
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState<number | null>(null);
  const [form, setForm] = useState({ displayName: '', wowClass: 'warrior' as WowClass, status: 'active' });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [users, setUsers] = useState<Array<{ id: number; username: string; displayName: string }>>([]);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // 批量操作相关
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | 'bulk' | null>(null);

  // 搜索与过滤相关
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<WowClass | 'all'>('all');

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch = m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.username && m.username.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchClass = classFilter === 'all' || m.wowClass === classFilter;
      return matchSearch && matchClass;
    });
  }, [members, searchTerm, classFilter]);

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (membersList: MemberWithStats[]) => {
    const allIds = membersList.map(m => m.id);
    const hasAll = allIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (hasAll) {
      allIds.forEach(id => next.delete(id));
    } else {
      allIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  useEffect(() => {
    loadMembers();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const displayName = row['角色名']?.toString().trim();
        const wowClassZh = row['职业']?.toString().trim();
        const statusZh = row['状态']?.toString().trim() || '在队';

        if (!displayName || !wowClassZh) {
          errorCount++;
          continue;
        }

        let targetClass: WowClass = 'warrior';
        for (const [en, zh] of Object.entries(WOW_CLASS_ZH_MAP)) {
          if (zh.includes(wowClassZh) || wowClassZh.includes(zh)) {
            targetClass = en as WowClass;
            break;
          }
        }

        const status = statusZh === '替补' ? 'backup' : statusZh === '非活跃' ? 'inactive' : 'active';

        try {
          await membersApi.create({
            displayName,
            wowClass: targetClass,
            wowClassZh: WOW_CLASS_ZH_MAP[targetClass],
            status,
            bindToSelf: false, // 批量导入的角色默认是可认领的
          });
          successCount++;
        } catch (err) {
          console.error('Failed to import row', row, err);
          errorCount++;
        }
      }

      alert(`导入完成！\n成功：${successCount} 条\n失败：${errorCount} 条\n\n提示：Excel需要有列名【角色名】【职业】`);
      loadMembers();
    } catch (error) {
      console.error(error);
      alert('读取 Excel 文件失败，请检查格式');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  const handleArchive = async (m: MemberWithStats) => {
    if (!user) return;
    if (!confirm(`确认将角色 "${m.displayName}" 归档吗？\n该角色将转移到你的名下，并设为非活跃状态。`)) return;
    setActionLoading(m.id);
    try {
      await membersApi.update(m.id, {
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        status: 'inactive',
        userId: user.id,
      });
      // 乐观更新 UI
      setMembers((prev: MemberWithStats[]) => prev.map((x: MemberWithStats) => x.id === m.id ? { ...x, status: 'inactive', userId: user.id, isAdmin: true } : x));
    } catch (err: any) {
      alert(err.response?.data?.error || '归档失败');
    } finally {
      setActionLoading(null);
      loadMembers();
    }
  };

  const handleReturn = async (m: MemberWithStats) => {
    if (!confirm(`确认将角色 "${m.displayName}" 设为可认领状态吗？\n这将解除与其当前账号的绑定。`)) return;
    setActionLoading(m.id);
    try {
      await membersApi.update(m.id, {
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        status: m.status, // keep status, but unbind
        userId: null,
      });
      // 乐观更新 UI
      setMembers((prev: MemberWithStats[]) => prev.map((x: MemberWithStats) => x.id === m.id ? { ...x, userId: null, isAdmin: false } : x));
    } catch (err: any) {
      alert(err.response?.data?.error || '归还失败');
    } finally {
      setActionLoading(null);
      loadMembers();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('危险：确认删除该角色？\n\n提示：带有任何团队活动记录的角色都将删除失败，建议使用“归档”或“归还”功能。')) return;
    setActionLoading(id);
    try {
      await membersApi.delete(id);
      setMembers((prev: MemberWithStats[]) => prev.filter((x: MemberWithStats) => x.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || '删除失败');
    } finally {
      setActionLoading(null);
      loadMembers();
    }
  };

  // 批量操作处理
  const handleBulkReturn = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确认将选中的 ${selectedIds.size} 个角色设为可认领（解除绑定）吗？`)) return;
    
    setActionLoading('bulk');
    try {
      const targets = members.filter(m => selectedIds.has(m.id));
      await Promise.all(targets.map(m => membersApi.update(m.id, {
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        status: m.status,
        userId: null,
      })));
      setMembers((prev: MemberWithStats[]) => prev.map((x: MemberWithStats) => selectedIds.has(x.id) ? { ...x, userId: null, isAdmin: false } : x));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert('部分角色操作失败:' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
      loadMembers();
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0 || !user) return;
    if (!confirm(`确认将选中的 ${selectedIds.size} 个角色归档吗？\n将收到您的账号下并设为非活跃状态。`)) return;
    
    setActionLoading('bulk');
    try {
      const targets = members.filter(m => selectedIds.has(m.id));
      await Promise.all(targets.map(m => membersApi.update(m.id, {
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        status: 'inactive',
        userId: user.id,
      })));
      setMembers((prev: MemberWithStats[]) => prev.map((x: MemberWithStats) => selectedIds.has(x.id) ? { ...x, status: 'inactive', userId: user.id, isAdmin: true } : x));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert('部分角色操作失败:' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
      loadMembers();
    }
  };

  const renderMemberCard = (m: MemberWithStats) => {
    const isSelected = selectedIds.has(m.id);
    return (
    <div 
      key={m.id} 
      onClick={() => isSelectMode ? toggleSelection(m.id) : undefined}
      className={`group relative flex flex-col p-3 rounded-xl border bg-[#1a1a2e]/60 hover:bg-[#1a1a2e] transition-all duration-200 overflow-hidden ${
        actionLoading === m.id ? 'opacity-50 pointer-events-none' : ''
      } ${
        isSelectMode ? 'cursor-pointer hover:border-purple-500/50 hover:bg-[#1a1a2e]/80' : ''
      } ${
        isSelected ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50' : 'border-[#2a2a4a]'
      }`}
    >
      {/* 选中标识角标 */}
      {isSelectMode && (
        <div className={`absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-bl-xl transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-[#1e293b]/80 bg-opacity-0 text-[#475569]'}`}>
          {isSelected && <Check size={16} />}
        </div>
      )}

      {/* 悬浮操作区（仅当平时非编辑模式显示，且脱离文档流绝对定位在右上角防遮挡） */}
      {!isSelectMode && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f0f1a]/90 backdrop-blur-md p-1 rounded-lg border border-purple-900/50 shadow-xl pointer-events-auto">
          {isAdmin && m.userId !== null && (
            <button onClick={() => handleReturn(m)} className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-900/30 p-1.5 rounded transition-colors" title="解绑为无主可认领状态"><Undo2 size={14} /></button>
          )}
          {isAdmin && m.userId !== user?.id && (
            <button onClick={(e) => { e.stopPropagation(); handleArchive(m); }} className="text-[#94a3b8] hover:text-white hover:bg-[#2a2a4a] p-1.5 rounded transition-colors" title="收回自己名下并设为非活跃"><Archive size={14} /></button>
          )}
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); setShowAssign(m.id); setSelectedUserId(''); }} className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 p-1.5 rounded transition-colors" title="指定分配"><UserPlus size={14} /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} className="text-[#475569] hover:text-red-400 hover:bg-red-900/30 p-1.5 rounded transition-colors" title="彻底删除"><Trash2 size={14} /></button>
        </div>
      )}

      <div className="flex items-center gap-3 w-full">
        {/* 头像 */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            backgroundColor: (WOW_CLASS_COLORS[m.wowClass] || '#7c3aed') + '33',
            color: WOW_CLASS_COLORS[m.wowClass] || '#a78bfa',
          }}
        >
          {m.displayName[0]}
        </div>
        
        {/* 信息 */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-base text-purple-100 truncate max-w-[120px]" title={m.displayName}>{m.displayName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[m.status]} whitespace-nowrap`}>
              {STATUS_LABELS[m.status]}
            </span>
            {m.isAdmin && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-purple-600/50 text-purple-400 bg-purple-900/20 whitespace-nowrap">
                <Shield size={10} className="inline mr-0.5"/>管理员
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#475569] truncate mt-0.5">
            {m.wowClassZh} {m.username && <span className="mx-1">|</span>} {m.username && `帐号:${m.username}`}
          </div>
        </div>
      </div>

      {/* 微章统计条 */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-[#64748b] bg-[#0f0f1a]/30 rounded-lg py-1.5 px-2">
        <div className="flex items-center gap-1" title="活动参与次数"><Users size={12} /><span>{m.stats.participationCount}</span></div>
        <div className="flex items-center gap-1" title="获得装备数"><Archive size={12} /><span>{m.stats.itemsReceivedCount}</span></div>
        <div className="flex items-center gap-1" title="装备需求数"><ListChecks size={12} /><span>{m.stats.requirementsCount}</span></div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowStats(showStats === m.id ? null : m.id); }}
          className="ml-auto text-purple-400 hover:text-purple-300 font-medium"
        >
          {showStats === m.id ? '收起' : '详情'}
        </button>
      </div>

      {/* 详细统计 */}
      {showStats === m.id && (
        <div className="mt-4 pt-4 border-t border-[#2a2a4a] grid grid-cols-2 gap-4">
          {/* 获得装备 */}
          <div>
            <div className="text-xs font-medium text-[#94a3b8] mb-2 flex items-center gap-2">
              <Archive size={14} />
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
  );
  };

  const claimableMembers = filteredMembers.filter((m) => m.userId === null);
  const archivedMembers = filteredMembers.filter((m) => m.userId !== null && !!m.isAdmin);
  const claimedMembers = filteredMembers.filter((m) => m.userId !== null && !m.isAdmin);

  const renderSection = (title: string, data: MemberWithStats[], emptyText: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between border-b border-purple-900/50 pb-2 mb-3">
        <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
          {title} 
          <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">{data.length}</span>
        </h2>
        {isAdmin && isSelectMode && data.length > 0 && (
          <button 
            onClick={() => toggleAll(data)}
            className="text-xs text-[#94a3b8] hover:text-purple-300"
          >
            {data.every(m => selectedIds.has(m.id)) ? '取消全选' : '本组全选'}
          </button>
        )}
      </div>
      {data.length === 0 ? (
        <div className="text-center text-[#475569] bg-[#1a1a2e]/50 border border-[#2a2a4a] rounded-xl p-6 text-sm">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map(renderMemberCard)}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-purple-400" size={24} />
          <h1 className="text-xl font-bold">成员管理</h1>
        </div>
        
        <div className="flex-1 w-full sm:w-auto ml-auto flex flex-wrap items-center gap-2 justify-end">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            className="btn-ghost flex items-center gap-2 text-sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={14} /> {importing ? '导入中...' : '导入 Excel'}
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedIds(new Set());
              }}
              className={`btn flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-300 ${isSelectMode ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-[#1a1a2e] text-purple-300 border-purple-900/50 hover:bg-purple-900/30'}`}
            >
              <ListChecks size={16} />
              {isSelectMode ? '完成选择' : '批量操作'}
            </button>
          )}
          <button className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> 添加角色
          </button>
        </div>
      </div>

      {/* 搜索与快捷过滤面板 */}
      <div className="bg-[#1a1a2e]/40 border border-purple-900/30 p-4 rounded-xl mb-6 sticky top-[72px] z-30 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative w-full lg:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-[#475569]" size={16} />
            </div>
            <input
              type="text"
              placeholder="搜索角色名或主账号..."
              className="input w-full pl-9 bg-[#0f0f1a] border-[#2a2a4a] focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <Filter className="text-[#475569] hidden md:block" size={16} />
            <button
              onClick={() => setClassFilter('all')}
              className={`px-3 py-1 text-[11px] rounded-full transition-colors border ${classFilter === 'all' ? 'bg-white/10 text-white border-white/20' : 'bg-[#0f0f1a] text-[#475569] border-[#2a2a4a] hover:bg-[#1a1a2e]'}`}
            >
              全部职业
            </button>
            {Object.entries(WOW_CLASS_ZH_MAP).map(([en, zh]) => (
              <button
                key={en}
                onClick={() => setClassFilter(en as WowClass)}
                className={`px-3 py-1 text-[11px] rounded-full transition-colors border ${classFilter === en ? 'bg-opacity-20 border-opacity-50 text-opacity-100 font-medium' : 'bg-transparent text-[#475569] border-[#2a2a4a] hover:bg-white/5'}`}
                style={classFilter === en ? { 
                  backgroundColor: WOW_CLASS_COLORS[en as WowClass], 
                  borderColor: WOW_CLASS_COLORS[en as WowClass],
                  color: WOW_CLASS_COLORS[en as WowClass]
                } : {}}
              >
                {zh}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-[#475569] text-center py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          加载中...
        </div>
      ) : (
        <>
          {renderSection('被认领 (已被普通用户绑定)', claimedMembers, '暂无符合条件的被认领角色')}
          {renderSection('可认领 (暂无归属账号)', claimableMembers, '暂无符合条件的可认领角色')}
          {renderSection('已归档 (属于管理员/退会处理)', archivedMembers, '暂无符合条件的已归档角色')}
        </>
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

      {/* 分配账号 Modal */}
      {showAssign !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
              <h2 className="font-bold">分配账号</h2>
              <button onClick={() => setShowAssign(null)} className="text-[#475569] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">选择用户</label>
                <select
                  className="input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">- 请选择 -</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.username})
                    </option>
                  ))}
                  <option value="unbind">-- 解除绑定 (回收为可认领) --</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#2a2a4a] flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => {
                setShowAssign(null);
                setSelectedUserId('');
              }}>取消</button>
              <button className="btn-primary flex-1" onClick={async () => {
                const memberObj = members.find((x) => x.id === showAssign);
                if (!memberObj) return;
                
                let targetUserId = null;
                if (selectedUserId === 'unbind') {
                  targetUserId = null;
                } else if (selectedUserId) {
                  targetUserId = Number(selectedUserId);
                } else {
                  return; // no selection
                }

                try {
                  await membersApi.update(memberObj.id, { 
                    displayName: memberObj.displayName,
                    wowClass: memberObj.wowClass,
                    wowClassZh: memberObj.wowClassZh,
                    status: memberObj.status,
                    userId: targetUserId 
                  });
                  setShowAssign(null);
                  setSelectedUserId('');
                  loadMembers();
                } catch (err) {
                  alert('分配失败，请检查');
                  console.error(err);
                }
              }}>确认</button>
            </div>
          </div>
        </div>
      )}
      {/* 底部悬浮的批量操作条 */}
      {isAdmin && isSelectMode && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-[#0f0f1a]/95 backdrop-blur border-t border-purple-900/50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40 flex items-center justify-between transform transition-transform duration-300 ease-in-out">
          <div className="text-sm text-purple-200 ml-4 lg:ml-0 flex items-center gap-4">
            <span className="bg-[#1e293b] px-3 py-1 rounded-full border border-purple-900/30">
              已选 <span className="font-bold text-white text-base mx-1">{selectedIds.size}</span> 项
            </span>
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-[#94a3b8] hover:text-purple-300 transition-colors hidden sm:block"
                disabled={actionLoading === 'bulk'}
              >
                取消全选
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 mr-4 lg:mr-0">
            <button
              onClick={() => {
                setIsSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="px-4 py-2 text-sm text-[#94a3b8] hover:text-white"
              disabled={actionLoading === 'bulk'}
            >
              退出模式
            </button>
            <button
              onClick={handleBulkReturn}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 border-yellow-800/50 text-yellow-500 hover:text-yellow-400 bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedIds.size === 0 || actionLoading === 'bulk'}
            >
              <Undo2 size={16} /> 归还
            </button>
            <button
              onClick={handleBulkArchive}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 border-[#475569] text-purple-300 hover:text-white bg-[#2a2a4a]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedIds.size === 0 || actionLoading === 'bulk'}
            >
              <Archive size={16} /> 归档
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
