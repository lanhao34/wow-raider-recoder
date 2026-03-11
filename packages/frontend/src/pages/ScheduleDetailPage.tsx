import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schedulesApi, raidKillsApi, dropsApi, distributionsApi, membersApi } from '../api';
import { useAuthStore } from '../store/auth';
import { RAIDS } from '@guild/shared';
import { DIFFICULTY_NAMES, SLOT_NAMES, WOW_CLASS_COLORS } from '@guild/shared';
import type { Difficulty, Item, WowClass } from '@guild/shared';
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
  const { isLeader } = useAuthStore();
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
    Promise.all([schedulesApi.get(numId), membersApi.list()])
      .then(([sched, mems]) => {
        setSchedule(sched);
        setAllMembers(mems.filter((m: Member & { status: string }) =>
          m.status === 'active' || m.status === 'backup'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const refresh = async () => {
    const sched = await schedulesApi.get(parseInt(id!));
    setSchedule(sched);
  };

  const participantIds: number[] = schedule ? JSON.parse(schedule.participantIds || '[]') : [];
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
    if (!isLeader || !schedule) return;
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
    }));
    await dropsApi.createBatch({ raidKillId: dropModal.id, items });
    await refresh();
    setDropModal(null);
    setPendingDrops([]);
  };

  const handleDeleteDrop = async (dropId: number) => {
    await dropsApi.delete(dropId);
    await refresh();
  };

  const handleDistribute = async () => {
    if (!distributeModal || !selectedMemberId) return;
    await distributionsApi.create({ dropId: distributeModal.id, memberId: selectedMemberId });
    await refresh();
    setDistributeModal(null);
    setSelectedMemberId(null);
  };

  const findBoss = (raidId: string, bossId: string) =>
    RAIDS.find((r) => r.id === raidId)?.bosses.find((b) => b.id === bossId);

  if (loading) return <div className="text-center text-[#475569] py-12 animate-pulse">加载中...</div>;
  if (!schedule) return <div className="text-center text-red-400 py-12">日程不存在</div>;

  const killGroups: Record<string, RaidKill[]> = {};
  for (const kill of schedule.kills) {
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
        {isLeader && (
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
      {showParticipants && isLeader && (
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
      {showAddRaid && isLeader && (
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

      {schedule.raids.length === 0 ? (
        <div className="card text-center py-12 text-[#475569]">
          <Package className="mx-auto mb-3 opacity-30" size={40} />
          <p>本日程尚未选择团本</p>
          {isLeader && <p className="text-sm mt-1">点击上方「添加团本」开始</p>}
        </div>
      ) : (
        schedule.raids.map((sr) => {
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
                            {isLeader && (
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
                        ) : isLeader ? (
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
                        <div className="border-t border-[#2a2a4a] px-3 pb-3 pt-2 space-y-2">
                          {kill.drops.length === 0 ? (
                            <p className="text-xs text-[#475569]">暂无掉落记录</p>
                          ) : (
                            kill.drops.map((drop) => (
                              <div key={drop.id} className="flex items-center gap-3 text-sm group">
                                <div className="flex-1 flex items-center gap-2 flex-wrap">
                                  <span className="text-purple-200">{drop.itemName}</span>
                                  <span className="text-xs text-[#475569]">
                                    {SLOT_NAMES[drop.slot as keyof typeof SLOT_NAMES] || drop.slot}
                                  </span>
                                  <span className="text-xs text-amber-400">{drop.itemLevel}装等</span>
                                  {drop.isTier && <span className="badge-tier flex items-center gap-1"><Star size={9} />套装</span>}
                                </div>
                                {drop.distribution ? (
                                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                                    <div
                                      className="font-medium"
                                      style={{ color: WOW_CLASS_COLORS[drop.distribution.member.wowClass as WowClass] || '#4ade80' }}
                                    >
                                      {drop.distribution.member.displayName}
                                    </div>
                                  </div>
                                ) : isLeader ? (
                                  <button
                                    className="text-xs btn-secondary py-0.5 px-2 shrink-0"
                                    onClick={() => { setDistributeModal(drop); setSelectedMemberId(null); }}
                                  >
                                    分配
                                  </button>
                                ) : (
                                  <span className="text-xs text-yellow-500 shrink-0">待分配</span>
                                )}
                                {isLeader && !drop.distribution && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-red-400 transition-all p-0.5"
                                    onClick={() => handleDeleteDrop(drop.id)}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            ))
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
        <Modal title={`分配：${distributeModal.itemName}`} onClose={() => setDistributeModal(null)}>
          <div className="space-y-3">
            {participants.length > 0 && (
              <>
                <p className="text-xs text-purple-400 font-medium">本次参团成员</p>
                <div className="space-y-1">
                  {participants.map((m) => (
                    <MemberOption key={m.id} member={m} selected={selectedMemberId === m.id} onSelect={setSelectedMemberId} highlight />
                  ))}
                </div>
              </>
            )}
            {nonParticipants.length > 0 && (
              <>
                {participants.length > 0 && (
                  <p className="text-xs text-[#475569] font-medium pt-1">其他成员</p>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {nonParticipants.map((m) => (
                    <MemberOption key={m.id} member={m} selected={selectedMemberId === m.id} onSelect={setSelectedMemberId} />
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setDistributeModal(null)}>取消</button>
              <button className="btn-primary" onClick={handleDistribute} disabled={!selectedMemberId}>确认分配</button>
            </div>
          </div>
        </Modal>
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
  if (!boss) return null;

  const addItem = (item: Item) => {
    setPendingDrops([...pendingDrops, item]);
  };

  const removeItem = (index: number) => {
    setPendingDrops(pendingDrops.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a] shrink-0">
          <div>
            <h2 className="font-bold">{boss.name} — 录入掉落</h2>
            <p className="text-xs text-[#475569] mt-0.5">点击装备加入本次掉落清单，可重复添加同一件</p>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-white p-1"><X size={18} /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: boss loot list */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-[#2a2a4a] space-y-1.5">
            <p className="text-xs text-[#475569] mb-2">可能掉落（{boss.loot.length} 件）</p>
            {boss.loot.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="w-full text-left p-2.5 rounded-lg border border-[#2a2a4a] hover:bg-purple-900/20 hover:border-purple-800/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Plus size={13} className="text-purple-400 shrink-0" />
                  <span className="text-sm text-purple-200">{item.name}</span>
                  {item.isTier && (
                    <span className="badge-tier flex items-center gap-1 shrink-0"><Star size={9} />套装</span>
                  )}
                </div>
                <div className="text-xs text-[#475569] ml-5 mt-0.5">
                  {SLOT_NAMES[item.slot] || item.slot} · ilvl {item.baseItemLevel}
                </div>
              </button>
            ))}
          </div>

          {/* Right: pending list */}
          <div className="w-52 flex flex-col shrink-0">
            <div className="p-3 border-b border-[#2a2a4a]">
              <p className="text-xs font-medium text-[#94a3b8]">
                本次掉落清单
                {pendingDrops.length > 0 && (
                  <span className="text-purple-400 ml-1">({pendingDrops.length})</span>
                )}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pendingDrops.length === 0 ? (
                <p className="text-xs text-[#475569] text-center mt-4">点击左侧装备添加</p>
              ) : (
                pendingDrops.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 bg-[#0f0f1a] rounded-lg p-2 group">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-purple-200 truncate">{item.name}</div>
                      {item.isTier && <div className="text-xs text-yellow-400">套装</div>}
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-[#475569] hover:text-red-400 transition-colors shrink-0 mt-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#2a2a4a] flex gap-3 justify-end shrink-0">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={onConfirm} disabled={pendingDrops.length === 0}>
            确认录入 {pendingDrops.length > 0 ? `(${pendingDrops.length} 件)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
