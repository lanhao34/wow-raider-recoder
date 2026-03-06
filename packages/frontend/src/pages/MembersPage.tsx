import { useState, useEffect } from 'react';
import { membersApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Users, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { WOW_CLASS_ZH_MAP, WowClass, WOW_CLASS_COLORS } from '@guild/shared';

interface Member {
  id: number;
  displayName: string;
  wowClass: WowClass;
  wowClassZh: string;
  isLeader: boolean;
  status: string;
  userId?: number;
}

const STATUS_LABELS: Record<string, string> = { active: '在队', backup: '替补', inactive: '非活跃' };
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-900/20',
  backup: 'text-yellow-400 bg-yellow-900/20',
  inactive: 'text-[#475569] bg-[#2a2a4a]/50',
};

const WOW_CLASSES: WowClass[] = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'deathknight', 'shaman', 'mage', 'warlock', 'monk',
  'druid', 'demonhunter', 'evoker',
];

interface FormState {
  displayName: string;
  wowClass: WowClass;
  isLeader: boolean;
  status: string;
}

const emptyForm: FormState = { displayName: '', wowClass: 'warrior', isLeader: false, status: 'active' };

export default function MembersPage() {
  const { isLeader } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    membersApi.list().then(setMembers).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const data = { ...form, wowClassZh: WOW_CLASS_ZH_MAP[form.wowClass] };
    const member = await membersApi.create(data);
    setMembers((prev) => [...prev, member]);
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleUpdate = async (id: number) => {
    const data = { ...form, wowClassZh: WOW_CLASS_ZH_MAP[form.wowClass] };
    const member = await membersApi.update(id, data);
    setMembers((prev) => prev.map((m) => (m.id === id ? member : m)));
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该成员？')) return;
    await membersApi.delete(id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const startEdit = (m: Member) => {
    setEditing(m.id);
    setForm({ displayName: m.displayName, wowClass: m.wowClass, isLeader: m.isLeader, status: m.status });
  };

  if (!isLeader) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-purple-400" size={24} />
          <h1 className="text-xl font-bold">成员列表</h1>
        </div>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="card flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: (WOW_CLASS_COLORS[m.wowClass as WowClass] || '#7c3aed') + '33',
                  color: WOW_CLASS_COLORS[m.wowClass as WowClass] || '#a78bfa',
                  border: `1px solid ${WOW_CLASS_COLORS[m.wowClass as WowClass] || '#7c3aed'}55`,
                }}
              >
                {m.displayName[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {m.displayName}
                  {m.isLeader && <span className="text-yellow-400 text-xs">团长</span>}
                </div>
                <div className="text-xs" style={{ color: WOW_CLASS_COLORS[m.wowClass as WowClass] || '#94a3b8' }}>
                  {m.wowClassZh}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[m.status]}`}>
                {STATUS_LABELS[m.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">成员管理</h1>
        <button className="btn-primary ml-auto flex items-center gap-2" onClick={() => { setShowAdd(true); setForm(emptyForm); }}>
          <Plus size={16} /> 添加成员
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#475569] py-12">加载中...</div>
      ) : (
        <div className="space-y-2">
          {/* Add form */}
          {showAdd && (
            <MemberForm
              form={form}
              setForm={setForm}
              onSave={handleAdd}
              onCancel={() => { setShowAdd(false); setForm(emptyForm); }}
            />
          )}
          {members.map((m) =>
            editing === m.id ? (
              <MemberForm
                key={m.id}
                form={form}
                setForm={setForm}
                onSave={() => handleUpdate(m.id)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div key={m.id} className="card flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: (WOW_CLASS_COLORS[m.wowClass as WowClass] || '#7c3aed') + '33',
                    color: WOW_CLASS_COLORS[m.wowClass as WowClass] || '#a78bfa',
                    border: `1px solid ${WOW_CLASS_COLORS[m.wowClass as WowClass] || '#7c3aed'}55`,
                  }}
                >
                  {m.displayName[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {m.displayName}
                    {m.isLeader && <span className="text-yellow-400 text-xs">团长</span>}
                  </div>
                  <div className="text-xs" style={{ color: WOW_CLASS_COLORS[m.wowClass as WowClass] || '#94a3b8' }}>
                    {m.wowClassZh}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[m.status]}`}>
                  {STATUS_LABELS[m.status]}
                </span>
                <button onClick={() => startEdit(m)} className="text-[#475569] hover:text-purple-400 p-1 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="text-[#475569] hover:text-red-400 p-1 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function MemberForm({
  form, setForm, onSave, onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card border-purple-800/50 bg-purple-900/10">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1">角色名</label>
          <input className="input text-sm" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1">职业</label>
          <select className="select w-full text-sm" value={form.wowClass} onChange={(e) => setForm({ ...form, wowClass: e.target.value as WowClass })}>
            {WOW_CLASSES.map((c) => (
              <option key={c} value={c}>{WOW_CLASS_ZH_MAP[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1">状态</label>
          <select className="select w-full text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">在队</option>
            <option value="backup">替补</option>
            <option value="inactive">非活跃</option>
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isLeader} onChange={(e) => setForm({ ...form, isLeader: e.target.checked })} className="w-4 h-4 accent-purple-600" />
            <span className="text-[#94a3b8]">设为团长</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary flex items-center gap-1 text-sm" onClick={onCancel}><X size={14} />取消</button>
        <button className="btn-primary flex items-center gap-1 text-sm" onClick={onSave}><Check size={14} />保存</button>
      </div>
    </div>
  );
}
