import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Task, Campus } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { useFilters } from '../../context/FilterContext.js';

interface CalendarViewProps {
  tasks: Task[];
  campuses: Campus[];
  onOpenTaskModal: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  campuses,
  onOpenTaskModal,
}) => {
  const { selectedCampus, setSelectedCampus } = useFilters();
  const [calendarMode, setCalendarMode] = useState<'week' | 'day' | 'month'>('week');
  
  // Week anchor: Oct 19, 2026 is Monday
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedCampus === 'all') return true;
    return t.campusId === selectedCampus;
  });

  // Generate 7 days of the current week based on offset
  const baseMonday = new Date(2026, 9, 19 + currentWeekOffset * 7); // Month is 0-indexed: 9 = Oct
  const daysOfWeek = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(baseMonday);
    d.setDate(baseMonday.getDate() + idx);
    return d;
  });

  const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  return (
    <div className="space-y-6">
      {/* Top Header & Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Lịch công tác điều hành</h2>
          <p className="text-xs text-[#64748B]">
            Theo dõi tổng thể lịch làm việc, hội họp, thao giảng và sự kiện tại 2 điểm trường
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Navigator */}
          <div className="flex items-center bg-[#F5F7FB] p-1 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-600"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 text-[#172B4D]">
              Tuần {8 + currentWeekOffset} (19/10 - 25/10/2026)
            </span>
            <button
              onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-600"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentWeekOffset(0)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* Week Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {daysOfWeek.map((dayDate, dayIdx) => {
          const dayDateStr = dayDate.toISOString().slice(0, 10);
          const isToday = dayDate.getDate() === 19 && dayDate.getMonth() === 9 && dayDate.getFullYear() === 2026;

          // Find tasks for this day
          const dayTasks = filteredTasks.filter((t) => {
            if (!t.startAt) return false;
            return t.startAt.startsWith(dayDateStr);
          });

          return (
            <div
              key={dayIdx}
              className={`bg-white rounded-xl border flex flex-col min-h-[500px] shadow-2xs transition-all ${
                isToday ? 'border-[#12366B] ring-2 ring-[#12366B]/10' : 'border-[#E2E8F0]'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 text-center border-b ${
                  isToday
                    ? 'bg-[#12366B] text-white rounded-t-xl'
                    : 'bg-[#F5F7FB] text-[#172B4D] border-slate-200'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wide">{dayNames[dayIdx]}</p>
                <p className={`text-base font-extrabold mt-0.5 ${isToday ? 'text-teal-300' : 'text-[#12366B]'}`}>
                  {dayDate.getDate().toString().padStart(2, '0')}/{ (dayDate.getMonth() + 1).toString().padStart(2, '0') }
                </p>
                {isToday && (
                  <span className="inline-block bg-teal-400 text-[#0B2145] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase mt-1">
                    Hôm nay
                  </span>
                )}
              </div>

              {/* Tasks List in Day */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-300 italic py-6">
                    Không có lịch
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskModal(task)}
                      className={`p-2.5 rounded-lg border text-xs space-y-1.5 cursor-pointer hover:shadow-xs transition-all ${
                        task.campusId === 'CAMPUS-MAIN'
                          ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400'
                          : 'bg-teal-50/40 border-teal-200 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#12366B] flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(task.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <StatusBadge type="campus" value={task.campusId} />
                      </div>

                      <h4 className="font-bold text-[#172B4D] hover:text-[#0D9488] leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{task.locationName || 'Chưa xếp phòng'}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-700">
                            {task.ownerNames.join(', ') || 'Chưa phân công'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                        <StatusBadge type="execution" value={task.executionStatus} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
