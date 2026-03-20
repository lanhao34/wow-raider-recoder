import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schedulesApi, raidKillsApi, dropsApi, distributionsApi, membersApi } from '../api';
import { useAuthStore } from '../store/auth';
import { RAIDS, type WoWItem, type ItemSlot } from '@guild/shared';
import { DIFFICULTY_NAMES, SLOT_NAMES, WOW_CLASS_COLORS, CLASS_WEAPON_TYPES, CLASS_ARMOR_TYPES, WEAPON_TYPE_NAMES, ARMOR_TYPE_NAMES, ALL_ITEMS } from '@guild/shared';
import { WoWItemCard } from '../components/WoWItemCard';
import type { Difficulty, WowClass } from '@guild/shared';

// 使用 WoWItem 替代 Item
type Item = WoWItem;
import {
  ArrowLeft, Plus, ChevronDown, ChevronRight, Sword, Package,
  Users, Check, X, Trash2, Star
} from 'lucide-react';

interface Member { id: number; displayName: string; wowClass: string; wowClassZh: string; }
interface Distribution { id: number; memberId: number; member: Member; status: string; }
interface Drop {
  id: number;
  itemId: string;
  itemName: string;
  itemLevel: number;
  baseItemLevel?: number;
  slot: string;
  isTier: boolean;
  bonusDrop: boolean;
  quality?: string;
  armorType?: string;
  distribution?: Distribution;
}
interface RaidKill {
  id: number;
  raidId: string;
  bossId: string;
  bossName: string;
  difficulty: Difficulty;
  participantCount: number;
  drops: Drop[];
}
interface ScheduleRaid { id: number; raidId: string; raidName: string; difficulty: Difficulty; }
interface Schedule {
  id: number;
  date: string;
  weekId: string;
  participantIds: string;
  raids: ScheduleRaid[];
  kills: RaidKill[];
}

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddRaid, setShowAddRaid] = useState(false);
  const [addRaidId, setAddRaidId] = useState('');
  const [addDifficulty, setAddDifficulty] = useState<Difficulty>('normal');
  const [showParticipants, setShowParticipants] = useState(false);
  const [expandedKill, setExpandedKill] = useState<number | null>(null);
  const [dropModal, setDropModal] = useState<RaidKill | null>(null);
  const [pendingDrops, setPendingDrops] = useState<Item[]>([]);
  const [distributeModal, setDistributeModal] = useState<Drop | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  useEffect(() => {
    const numId = parseInt(id!);
    Promise.all([schedulesApi.get(numId), membersApi.publicList()])
      .then(([sched, mems]) => {
        setSchedule(sched);
        setAllMembers(mems);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = async () => {
    const sched = await schedulesApi.get(parseInt(id!));
    setSchedule(sched);
  };

  const participantIds: number[] = schedule?.participantIds ? JSON.parse(schedule.participantIds) : [];
  const participants = allMembers.filter((m) => participantIds.includes(m.id));
  const nonParticipants = allMembers.filter((m) => !participantIds.includes(m.id));

  const toggleParticipant = async (memberId: number) => {
    if (!schedule) return;
    const next = participantIds.includes(memberId)
      ? participantIds.filter((i) => i !== memberId)
      : [...participantIds, memberId];
    await schedulesApi.updateParticipants(schedule.id, next);
    await refresh();
  };

  const handleAddRaid = async () => {
    const raid = RAIDS.find((r) => r.id === addRaidId);
    if (!raid || !schedule) return;
    await schedulesApi.addRaid(schedule.id, { raidId: addRaidId, raidName: raid.name, difficulty: addDifficulty });
    await refresh();
    setShowAddRaid(false);
  };

  // Click boss → immediately create kill + open drop modal
  const handleBossClick = async (sr: ScheduleRaid, bossId: string, bossName: string) => {
    if (!isAdmin || !schedule) return;
    const kill = await raidKillsApi.create({
      scheduleId: schedule.id,
      raidId: sr.raidId,
      bossId,
      bossName,
      difficulty: sr.difficulty,
    });
    await refresh();
    setPendingDrops([]);
    setDropModal(kill);
  };

  const handleAddDrops = async () => {
    if (!dropModal || pendingDrops.length === 0) return;
    const items = pendingDrops.map((item) => ({
      itemId: item.id,
      itemName: item.name,
      slot: item.slot,
      isTier: item.isTier || false,
      itemLevel: item.itemLevel,
      quality: item.quality,
      armorType: item.armorType,
      weaponType: item.weaponType,
    }));
    await dropsApi.createBatch({ raidKillId: dropModal.id, items });
    await refresh();
    setDropModal(null);
    setPendingDrops([]);
  };

  const handleDeleteDrop = async (dropId: number) => {
    if (!isAdmin || !confirm('彻底删除此掉落及其分配记录吗？')) return;
    await dropsApi.delete(dropId);
    await refresh();
  };

  const handleRevokeDistribution = async (distId: number) => {
    if (!isAdmin || !confirm('确定要撤销分配，没收该装备吗？')) return;
    await distributionsApi.delete(distId);
    await refresh();
  };

  const handleDistribute = async () => {
    if (!distributeModal || !selectedMemberId) return;
    await distributionsApi.create({ dropId: distributeModal.id, memberId: selectedMemberId });
    await refresh();
    setDistributeModal(null);
    setSelectedMemberId(null);
  };

  const renderItemType = (item: any) => {
    if (item.weaponType) return WEAPON_TYPE_NAMES[item.weaponType as keyof typeof WEAPON_TYPE_NAMES] || item.weaponType;
    if (item.armorType) return ARMOR_TYPE_NAMES[item.armorType as keyof typeof ARMOR_TYPE_NAMES] || item.armorType;
    return SLOT_NAMES[item.slot as keyof typeof SLOT_NAMES] || item.slot;
  };

  const findBoss = (raidId: string, bossId: string) =>
    RAIDS.find((r) => r.id === raidId)?.bosses.find((b) => b.id === bossId);

  if (loading) return <div className="text-center text-[#475569] py-12 animate-pulse">加载中...</div>;
  if (!schedule) return <div className="text-center text-red-400 py-12">日程不存在</div>;

  const killGroups: Record<string, RaidKill[]> = {};
  for (const kill of (schedule?.kills || [])) {
    const key = `${kill.raidId}-${kill.difficulty}`;
    if (!killGroups[key]) killGroups[key] = [];
    killGroups[key].push(kill);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/calendar')} className="text-[#475569] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{schedule.date} Raid 日程</h1>
          <div className="text-xs text-[#475569]">周次：{schedule.weekId}</div>
        </div>
        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <button
              className={`btn-secondary flex items-center gap-2 text-sm ${showParticipants ? 'border-purple-600 text-purple-300' : ''}`}
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users size={15} />
              参团名单 {participantIds.length > 0 && <span className="text-purple-300">({participantIds.length})</span>}
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowAddRaid(!showAddRaid)}>
              <Plus size={15} /> 添加团本
            </button>
          </div>
        )}
      </div>

      {/* Participant Panel */}
      {showParticipants && isAdmin && (
        <div className="card border-purple-800/40">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users size={15} className="text-purple-400" />
            参团成员
            <span className="text-xs text-[#475569] font-normal">（点击勾选/取消）</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {allMembers.map((m) => {
              const inRaid = participantIds.includes(m.id);
              const color = WOW_CLASS_COLORS[m.wowClass as WowClass] || '#94a3b8';
              return (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    inRaid
                      ? 'border-green-600/60 bg-green-900/20'
                      : 'border-[#2a2a4a] hover:border-[#3a3a5a]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    inRaid ? 'bg-green-500 border-green-400' : 'border-[#475569]'
                  }`}>
                    {inRaid && <Check size={10} className="text-white" />}
                  </div>
                  <span style={{ color }}>{m.displayName}</span>
                  <span className="text-xs" style={{ color: color + '99' }}>{m.wowClassZh}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add raid form */}
      {showAddRaid && isAdmin && (
        <div className="card border-purple-800/50">
          <h3 className="text-sm font-semibold mb-3">选择团本与难度</h3>
          <div className="flex gap-3 flex-wrap">
            <select className="select flex-1 min-w-40 text-sm" value={addRaidId} onChange={(e) => setAddRaidId(e.target.value)}>
              <option value="">选择副本...</option>
              {RAIDS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="select text-sm" value={addDifficulty} onChange={(e) => setAddDifficulty(e.target.value as Difficulty)}>
              {(['normal', 'heroic', 'mythic'] as Difficulty[]).map((d) => (
                <option key={d} value={d}>{DIFFICULTY_NAMES[d]}</option>
              ))}
            </select>
            <button className="btn-primary text-sm" onClick={handleAddRaid} disabled={!addRaidId}>确认</button>
            <button className="btn-secondary text-sm" onClick={() => setShowAddRaid(false)}>取消</button>
          </div>
        </div>
      )}

      {(schedule?.raids?.length || 0) === 0 ? (
        <div className="card text-center py-12 text-[#475569]">
          <Package className="mx-auto mb-3 opacity-30" size={40} />
          <p>本日程尚未选择团本</p>
          {isAdmin && <p className="text-sm mt-1">点击上方「添加团本」开始</p>}
        </div>
      ) : (
        (schedule?.raids || []).map((sr) => {
          const raid = RAIDS.find((r) => r.id === sr.raidId);
          const killKey = `${sr.raidId}-${sr.difficulty}`;
          const kills = killGroups[killKey] || [];

          return (
            <div key={sr.id} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Sword className="text-purple-400" size={18} />
                <h2 className="font-bold">{sr.raidName}</h2>
                <span className={`text-xs px-2 py-0.5 rounded badge-${sr.difficulty}`}>
                  {DIFFICULTY_NAMES[sr.difficulty]}
                </span>
                <span className="text-xs text-[#475569] ml-auto">
                  {kills.length}/{raid?.bosses.length} Boss 已击杀
                </span>
              </div>

              <div className="space-y-2">
                {raid?.bosses.map((boss) => {
                  const kill = kills.find((k) => k.bossId === boss.id);
                  const isExpanded = expandedKill === kill?.id;
                  const undistributed = kill?.drops.filter((d) => !d.distribution).length ?? 0;

                  return (
                    <div key={boss.id} className={`rounded-lg border transition-colors ${
                      kill ? 'border-green-800/50 bg-green-900/10' : 'border-[#2a2a4a]'
                    }`}>
                      <div className="flex items-center gap-3 p-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          kill ? 'bg-green-500 border-green-400' : 'border-[#475569]'
                        }`}>
                          {kill && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium flex-1">{boss.name}</span>

                        {kill ? (
                          <>
                            <span className="text-xs text-[#475569]">{kill.drops.length} 件掉落</span>
                            {undistributed > 0 && (
                              <span className="text-xs text-yellow-500">{undistributed} 待分配</span>
                            )}
                            {isAdmin && (
                              <button
                                className="text-xs btn-secondary py-1 px-2"
                                onClick={() => { setPendingDrops([]); setDropModal(kill); }}
                              >
                                + 掉落
                              </button>
                            )}
                            <button
                              className="text-[#475569] hover:text-white transition-colors p-1"
                              onClick={() => setExpandedKill(isExpanded ? null : kill.id)}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </>
                        ) : isAdmin ? (
                          <button
                            className="text-xs btn-primary py-1 px-3"
                            onClick={() => handleBossClick(sr, boss.id, boss.name)}
                          >
                            标记击杀
                          </button>
                        ) : (
                          <span className="text-xs text-[#475569]">未击杀</span>
                        )}
                      </div>

                      {/* Drops list */}
                      {kill && isExpanded && (
                        <div className="border-t border-[#2a2a4a] px-3 pb-4 pt-4">
                          {kill.drops.length === 0 ? (
                            <p className="text-xs text-[#475569]">暂无掉落记录</p>
                          ) : (
                            <div className="flex flex-wrap gap-4">
                              {kill.drops.map((drop) => {
                                const itemData = ALL_ITEMS.find((i) => i.id === drop.itemId);
                                const enrichedDrop = {
                                  ...drop,
                                  icon: itemData?.icon,
                                  primaryStats: itemData?.primaryStats,
                                  stamina: itemData?.stamina,
                                  secondaryStats: itemData?.secondaryStats,
                                };
                                return (
                                  <WoWItemCard
                                    key={drop.id}
                                    item={enrichedDrop}
                                    renderItemType={renderItemType}
                                    onDelete={isAdmin && !drop.distribution ? () => handleDeleteDrop(drop.id) : undefined}
                                    actionButton={
                                      drop.distribution ? (
                                        <div 
                                          className="flex items-center justify-between gap-1.5 text-xs bg-black/40 px-3 py-2 rounded-md border border-white/5 cursor-pointer hover:bg-black/60 hover:border-purple-500/50 transition-all select-none group/dist"
                                          onDoubleClick={() => {
                                            if (isAdmin) {
                                              setDistributeModal(drop);
                                              setSelectedMemberId(drop.distribution!.member.id);
                                            }
                                          }}
                                          title={isAdmin ? "双击重新换绑" : ""}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Package size={12} className="text-purple-400" />
                                            <div
                                              className="font-bold tracking-wide"
                                              style={{ color: WOW_CLASS_COLORS[drop.distribution.member.wowClass as WowClass] || '#4ade80' }}
                                            >
                                              {drop.distribution.member.displayName}
                                            </div>
                                          </div>
                                          {isAdmin && (
                                            <button 
                                              className="opacity-0 group-hover/dist:opacity-100 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-all ml-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRevokeDistribution(drop.distribution!.id);
                                              }}
                                              title="回收装备"
                                            >
                                              <X size={12} strokeWidth={3} />
                                            </button>
                                          )}
                                        </div>
                                      ) : isAdmin ? (
                                        <button
                                          className="w-full justify-center flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-white border border-purple-500/50 hover:from-purple-500 hover:to-pink-500 hover:border-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95"
                                          onClick={() => { setDistributeModal(drop); setSelectedMemberId(null); }}
                                          title="将此装备分配给团员"
                                        >
                                          发工资
                                        </button>
                                      ) : (
                                        <div className="w-full text-center py-2 text-xs text-yellow-500/80 font-medium">待分配</div>
                                      )
                                    }
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Drop Entry Modal */}
      {dropModal && (
        <DropEntryModal
          kill={dropModal}
          pendingDrops={pendingDrops}
          setPendingDrops={setPendingDrops}
          onConfirm={handleAddDrops}
          onClose={() => { setDropModal(null); setPendingDrops([]); }}
        />
      )}

      {/* Distribute Modal */}
      {distributeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#12121f] border border-purple-500/30 rounded-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a4a] bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] shrink-0">
              <div className="flex-1 pr-4">
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200 truncate">
                  分配：{distributeModal.itemName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[#94a3b8]">{renderItemType(distributeModal)}</span>
                  <span className="text-[#334155] mx-1 text-[10px]">|</span>
                  <span className="text-[12px] text-amber-500/90 font-bold">{distributeModal.itemLevel} 装等</span>
                </div>
              </div>
              <button onClick={() => setDistributeModal(null)} className="text-[#64748b] hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-all active:scale-95 bg-black/20 border border-[#2a2a4a] shrink-0"><X size={18} /></button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0f0f1a] scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
              {participants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} /> 本次参团成员
                    </p>
                    <span className="text-[11px] text-[#64748b]">双击卡片极速分配</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {participants.map((m) => (
                      <div key={m.id} onDoubleClick={() => { setSelectedMemberId(m.id); setTimeout(handleDistribute, 0); }}>
                        <MemberOption member={m} selected={selectedMemberId === m.id} onSelect={setSelectedMemberId} highlight />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {nonParticipants.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <div className="h-px bg-gradient-to-r from-[#2a2a4a] to-transparent flex-1"></div>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest px-2">其他成员 (未参团)</p>
                    <div className="h-px bg-gradient-to-l from-[#2a2a4a] to-transparent flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a4a] pr-1">
                    {nonParticipants.map((m) => (
                      <div key={m.id} onDoubleClick={() => { setSelectedMemberId(m.id); setTimeout(handleDistribute, 0); }}>
                        <MemberOption member={m} selected={selectedMemberId === m.id} onSelect={setSelectedMemberId} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sticky footer for confirming */}
            <div className="p-4 bg-[#0a0a14] border-t border-[#2a2a4a] relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <button 
                className="w-full h-[46px] rounded-xl font-bold flex items-center justify-center transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none border border-purple-500/50" 
                onClick={handleDistribute} 
                disabled={!selectedMemberId}
              >
                确认下发装备
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberOption({
  member, selected, onSelect, highlight = false,
}: {
  member: Member;
  selected: boolean;
  onSelect: (id: number) => void;
  highlight?: boolean;
}) {
  const color = WOW_CLASS_COLORS[member.wowClass as WowClass] || '#94a3b8';
  return (
    <button
      onClick={() => onSelect(member.id)}
      className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm flex items-center gap-3 ${
        selected
          ? 'bg-purple-900/40 border-purple-600'
          : highlight
            ? 'border-[#2a2a4a] bg-[#1a2a1a]/40 hover:bg-[#2a3a2a]/40'
            : 'border-transparent hover:bg-[#2a2a4a]'
      }`}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
        selected ? 'bg-purple-500 border-purple-400' : 'border-[#475569]'
      }`}>
        {selected && <Check size={10} className="text-white" />}
      </div>
      <span style={{ color }}>{member.displayName}</span>
      <span className="text-xs ml-auto" style={{ color: color + '80' }}>{member.wowClassZh}</span>
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a] shrink-0">
          <h2 className="font-bold">{title}</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-white p-1"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function DropEntryModal({
  kill, pendingDrops, setPendingDrops, onConfirm, onClose,
}: {
  kill: RaidKill;
  pendingDrops: Item[];
  setPendingDrops: (items: Item[]) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const boss = RAIDS.find((r) => r.id === kill.raidId)?.bosses.find((b) => b.id === kill.bossId);
  const difficulty = kill.difficulty;
  
  // Calculate item level based on difficulty
  const calculateIlvl = (baseLevel: number, diff: Difficulty) => {
    switch(diff) {
      case 'normal': return baseLevel - 13;
      case 'heroic': return baseLevel;
      case 'mythic': return baseLevel + 13;
      default: return baseLevel;
    }
  };

  if (!boss) return null;

  const addItem = (item: Item) => {
    setPendingDrops([...pendingDrops, item]);
  };

  const removeItem = (index: number) => {
    setPendingDrops(pendingDrops.filter((_, i) => i !== index));
  };
  
  const renderItemType = (item: any) => {
    if (item.weaponType) return WEAPON_TYPE_NAMES[item.weaponType as keyof typeof WEAPON_TYPE_NAMES] || item.weaponType;
    if (item.armorType) return ARMOR_TYPE_NAMES[item.armorType as keyof typeof ARMOR_TYPE_NAMES] || item.armorType;
    return SLOT_NAMES[item.slot as keyof typeof SLOT_NAMES] || item.slot;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-[#2a2a4a] rounded-2xl w-full max-w-[1240px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a4a] bg-[#1a1a2e] shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Sword size={22} className="text-purple-400" />
              {boss.name} — 记录掉落包裹
            </h2>
            <p className="text-[13px] text-[#64748b] mt-1">从左侧点击卡片快速封存装备包裹。</p>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-all border border-[#2a2a4a] bg-black/20"><X size={18} /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: boss loot list (CARDS GRID) */}
          <div className="flex-[4] overflow-y-auto p-6 border-r border-[#2a2a4a] bg-[#0a0a14] scrollbar-thin scrollbar-thumb-[#2a2a4a] scrollbar-track-transparent">
             <div className="flex flex-wrap gap-4 pb-8">
                {boss.loot.map((item) => {
                  const realIlvl = calculateIlvl(item.itemLevel, difficulty);
                  const selectedCount = pendingDrops.filter(p => p.id === item.id).length;
                  const isSelected = selectedCount > 0;
                  
                  const itemData = ALL_ITEMS.find((i) => i.id === item.id);
                  const enrichedItem = {
                    ...item,
                    itemLevel: realIlvl,
                    icon: itemData?.icon,
                    primaryStats: itemData?.primaryStats,
                    stamina: itemData?.stamina,
                    secondaryStats: itemData?.secondaryStats,
                  };
                  
                  return (
                    <div key={item.id} className="relative group">
                      <WoWItemCard
                        item={enrichedItem}
                        renderItemType={renderItemType}
                        onClick={() => addItem({...item, itemLevel: realIlvl, icon: itemData?.icon})}
                        selected={isSelected}
                      />
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 py-1 px-2.5 bg-emerald-500/90 rounded-full shadow-lg border border-emerald-400 flex items-center justify-center backdrop-blur-md z-10 pointer-events-none transition-all scale-110">
                          {selectedCount > 1 ? (
                            <span className="text-[12px] font-bold text-white flex items-center gap-1"><Check size={12} strokeWidth={4} /> {selectedCount}</span>
                          ) : (
                            <Check size={14} strokeWidth={4} className="text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Right: pending list */}
          <div className="flex-[2] max-w-[340px] flex flex-col shrink-0 bg-[#0a0a14] relative z-10 border-l border-[#2a2a4a] shadow-[-15px_0_30px_rgba(0,0,0,0.5)]">
            <div className="p-5 border-b border-[#2a2a4a] bg-gradient-to-b from-[#151525] to-transparent">
              <h3 className="text-[16px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white flex items-center justify-between">
                准备装箱清单
                {pendingDrops.length > 0 && (
                  <span className="bg-purple-500 text-white text-[12px] px-2.5 py-0.5 rounded-full shadow-lg border border-purple-400 font-black">
                    {pendingDrops.length}
                  </span>
                )}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-[#2a2a4a] scrollbar-track-transparent">
              {pendingDrops.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-[-20px]">
                  <Package size={48} className="mb-4 text-purple-300" strokeWidth={1} />
                  <p className="text-[14px] text-white font-medium text-center px-4 mb-1">空空如也</p>
                  <p className="text-[12px] text-[#94a3b8] text-center px-6">点击左侧装备卡片以加入清单</p>
                </div>
              ) : (
                pendingDrops.map((item, idx) => {
                  const isLegendary = item.quality === 'legendary';
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-[#12121f] border border-[#2a2a4a] hover:border-red-500/30 shadow-sm rounded-xl p-3 group transition-all relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isLegendary ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
                      <div className="flex-1 min-w-0 pl-1">
                        <div className={`text-[13px] font-bold truncate pr-2 ${isLegendary ? 'text-orange-400' : 'text-purple-200'}`}>{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#64748b] font-medium">{renderItemType(item)}</span>
                          <span className="text-[#334155] mx-0.5 text-[10px]">|</span>
                          <span className="text-[11px] text-amber-500/80 font-bold">{item.itemLevel}</span>
                          {item.isTier && <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1 py-0 rounded font-medium">套装</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-[#475569] hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 bg-[#0f0f1a] border-t border-[#2a2a4a] relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
              <button 
                className="w-full h-[46px] rounded-xl font-bold flex items-center justify-center transition-all bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-20 disabled:cursor-not-allowed" 
                onClick={onConfirm} 
                disabled={pendingDrops.length === 0}
              >
                确认录入 {pendingDrops.length > 0 ? `(${pendingDrops.length} 件)` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
