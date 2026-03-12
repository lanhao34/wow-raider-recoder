import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { schedulesApi, membersApi, distributionsApi } from '../api';
import { useAuthStore } from '../store/auth';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Plus, Sword, 
  Users, Package, CheckCircle, TrendingUp, Calendar
} from 'lucide-react';

interface ScheduleSummary {
  id: number;
  date: string;
  weekId: string;
  kills: unknown[];
}

interface Stats {
  totalSchedules: number;
  totalKills: number;
  totalDrops: number;
  totalDistributions: number;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSchedules: 0, totalKills: 0, totalDrops: 0, totalDistributions: 0 });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLeader } = useAuthStore();
  const navigate = useNavigate();

  const monthStr = format(currentMonth, 'yyyy-MM');

  // 获取日程和统计数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [schedulesData, distributionsData] = await Promise.all([
          schedulesApi.list({ month: monthStr }),
          distributionsApi.list(),
        ]);
        setSchedules(schedulesData);
        
        // 计算统计数据
        const totalKills = schedulesData.reduce((sum: number, s: ScheduleSummary) => 
          sum + ((s.kills as unknown[])?.length || 0), 0);
        
        setStats({
          totalSchedules: schedulesData.length,
          totalKills,
          totalDrops: distributionsData.length * 2, // 估算
          totalDistributions: distributionsData.length,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [monthStr]);

  const handleDayClick = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = schedules.find((s) => s.date === dateStr);
    if (existing) {
      navigate(`/schedules/${existing.id}`);
      return;
    }
    if (!isLeader) return;
    
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

  // 获取日历数据
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 周一开始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  // 获取某天的日程
  const getDaySchedule = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.find((s) => s.date === dateStr);
  };

  // 获取某天击杀数
  const getDayKills = (date: Date) => {
    const schedule = getDaySchedule(date);
    return (schedule?.kills as unknown[])?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <CalendarDays className="text-purple-400" size={24} />
          <div>
            <h1 className="text-xl font-bold">Raid 日历</h1>
            <p className="text-xs text-muted-foreground">按周 CD 记录团本活动</p>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))} 
            className="btn-ghost p-2"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-semibold text-foreground min-w-32 text-center">
            {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
          </span>
          <button 
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))} 
            className="btn-ghost p-2"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">本月活动</span>
          </div>
          <p className="stat-card-value text-purple-400">{stats.totalSchedules}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Sword className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">BOSS击杀</span>
          </div>
          <p className="stat-card-value text-amber-400">{stats.totalKills}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">装备掉落</span>
          </div>
          <p className="stat-card-value text-green-400">{stats.totalDrops}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">已分配</span>
          </div>
          <p className="stat-card-value text-blue-400">{stats.totalDistributions}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-sm font-medium py-3 text-muted-foreground">
              周{d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarData.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const schedule = getDaySchedule(day);
            const kills = getDayKills(day);
            const today = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isFirstRow = index < 7;
            
            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-24 p-2 transition-all duration-200 border-b border-r border-border
                  ${isFirstRow ? '' : 'border-t-0'}
                  ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}
                  ${!isCurrentMonth ? 'bg-muted/30' : 'bg-card'}
                  ${schedule
                    ? 'cursor-pointer hover:bg-primary/10'
                    : isLeader
                      ? 'cursor-pointer hover:bg-muted'
                      : 'cursor-default'
                  }
                  ${today ? 'ring-2 ring-inset ring-primary/50' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                  ${today ? 'bg-primary text-primary-foreground' : ''}
                  ${!isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}
                `}>
                  {format(day, 'd')}
                </div>
                
                {schedule && (
                  <div className="space-y-1">
                    <div className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-md flex items-center gap-1">
                      <Calendar size={10} />
                      <span>有日程</span>
                    </div>
                    {kills > 0 && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <Sword size={10} />
                        {kills} 击杀
                      </div>
                    )}
                  </div>
                )}
                
                {isLeader && !schedule && isCurrentMonth && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center h-12">
                    <Plus size={16} className="text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
          已有 Raid 日程
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          今天
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted/50" />
          其他月份
        </div>
        {isLeader && <span className="text-primary">点击空白日期可创建日程</span>}
      </div>

      {/* Loading Modal */}
      {creating && (
        <div className="modal-overlay">
          <div className="card flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary">创建日程中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
