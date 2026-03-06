import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { schedulesApi } from '../api';
import { useAuthStore } from '../store/auth';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface ScheduleSummary {
  id: number;
  date: string;
  weekId: string;
  kills: unknown[];
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [creating, setCreating] = useState(false);
  const { isLeader } = useAuthStore();
  const navigate = useNavigate();

  const monthStr = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    schedulesApi.list({ month: monthStr }).then(setSchedules);
  }, [monthStr]);

  const handleDayClick = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = schedules.find((s) => s.date === dateStr);
    if (existing) {
      navigate(`/schedules/${existing.id}`);
      return;
    }
    if (!isLeader) {
      // Non-leaders: silently ignore empty days (no schedule to view)
      return;
    }
    setCreating(true);
    try {
      const schedule = await schedulesApi.create({ date: dateStr });
      setSchedules((prev) => [...prev, schedule]);
      navigate(`/schedules/${schedule.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || '创建日程失败');
    } finally {
      setCreating(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfWeek = getDay(days[0]); // 0=Sun
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon-first

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="text-purple-400" size={24} />
        <h1 className="text-xl font-bold">Raid 日历</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[#e2e8f0] font-semibold min-w-28 text-center">
            {format(currentMonth, 'yyyy年 M月')}
          </span>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-[#2a2a4a]">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs text-[#475569] font-medium py-2">周{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Padding */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r border-[#2a2a4a]/50 min-h-16 bg-[#0f0f1a]/30" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const schedule = schedules.find((s) => s.date === dateStr);
            const today = isToday(day);
            const dayOfWeek = getDay(day);
            const isLastCol = dayOfWeek === 0; // Sunday

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`border-b border-r border-[#2a2a4a]/50 min-h-16 p-2 transition-colors
                  ${isLastCol ? 'border-r-0' : ''}
                  ${schedule
                    ? 'cursor-pointer hover:bg-purple-900/20'
                    : isLeader
                      ? 'cursor-pointer hover:bg-[#2a2a4a]/40'
                      : 'cursor-default'
                  }
                  ${today ? 'bg-blue-900/10' : ''}
                `}
              >
                <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${today ? 'bg-blue-500 text-white' : 'text-[#94a3b8]'}
                `}>
                  {format(day, 'd')}
                </div>
                {schedule ? (
                  <div className="space-y-0.5">
                    <div className="text-xs bg-purple-900/50 border border-purple-800/50 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span>有日程</span>
                    </div>
                    {schedule.kills && (schedule.kills as unknown[]).length > 0 && (
                      <div className="text-xs text-green-400/70">
                        {(schedule.kills as unknown[]).length} 次击杀
                      </div>
                    )}
                  </div>
                ) : isLeader ? (
                  <div className="opacity-0 group-hover:opacity-100">
                    <Plus size={12} className="text-[#2a2a4a]" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-purple-300 animate-pulse">创建日程中...</div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-[#475569]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-900/50 border border-purple-800/50" />
          已有 Raid 日程
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          今天
        </div>
        {isLeader && <span>点击空白日期可创建日程</span>}
      </div>
    </div>
  );
}
