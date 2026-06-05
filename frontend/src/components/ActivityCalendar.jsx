// src/components/ActivityCalendar.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, Activity, Star } from 'lucide-react';

// Helper: chuyển bất kỳ đầu vào ngày tháng thành key "YYYY-MM-DD" theo giờ Việt Nam
const toVNKey = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const ActivityCalendar = ({ sessions = [] }) => {   // 👈 Nhận sessions từ props
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Map());
  const [monthlyStats, setMonthlyStats] = useState({ activeDays: 0, totalActivities: 0 });

  // ✅ Chỉ tính activeDates từ sessions, không gọi API
  useEffect(() => {
    const countMap = new Map();
    sessions.forEach(activity => {
      let dateKey = activity.dateVN;
      if (!dateKey && activity.date) {
        dateKey = toVNKey(activity.date);
      }
      if (dateKey) {
        countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
      }
    });
    setActiveDates(countMap);
  }, [sessions]);   // Chạy lại khi sessions thay đổi

  // Thống kê tháng hiện tại
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let activeDaysCount = 0;
    let totalActivitiesCount = 0;

    activeDates.forEach((count, dateKey) => {
      const [y, m] = dateKey.split('-');
      if (parseInt(y) === year && parseInt(m) === month + 1) {
        activeDaysCount++;
        totalActivitiesCount += count;
      }
    });

    setMonthlyStats({ activeDays: activeDaysCount, totalActivities: totalActivitiesCount });
  }, [currentDate, activeDates]);

  // Tạo mảng các ô lịch
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startWeekday = firstDayOfMonth.getDay();
    const offset = startWeekday === 0 ? 6 : startWeekday - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = offset + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const totalCellsNeeded = rows * 7;

    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push({ date: null, isCurrentMonth: false, vnDateKey: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const vnKey = toVNKey(date);
      days.push({
        date: date,
        isCurrentMonth: true,
        vnDateKey: vnKey,
      });
    }
    const remaining = totalCellsNeeded - days.length;
    for (let i = 0; i < remaining; i++) {
      days.push({ date: null, isCurrentMonth: false, vnDateKey: null });
    }
    setCalendarDays(days);
  }, [currentDate]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayKey = toVNKey(new Date());

  const rows = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    rows.push(calendarDays.slice(i, i + 7));
  }

  // Không còn loading/error vì dữ liệu đến từ parent
  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card backdrop-blur-sm shadow-soft transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-success to-teal-500 shadow-md">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-text">
              Activity Calendar
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-full shadow-inner">
            <Activity className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-semibold text-success">
              {monthlyStats.activeDays} active days
            </span>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
          Active: Interview / CV / Adaptive / Coding
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => changeMonth(-1)} className="group p-2 rounded-xl hover:bg-muted/10 transition-all duration-200 active:scale-95">
          <ChevronLeft className="w-5 h-5 text-muted group-hover:text-text" />
        </button>
        <h3 className="text-base font-semibold text-text tracking-tight">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="group p-2 rounded-xl hover:bg-muted/10 transition-all duration-200 active:scale-95">
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-text" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1.5 px-4 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[11px] font-bold text-muted uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-4 pb-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1.5 mb-1.5">
            {row.map((day, colIndex) => {
              if (!day.isCurrentMonth) {
                return <div key={colIndex} className="aspect-square rounded-xl" />;
              }

              const vnKey = day.vnDateKey;
              const activityCount = activeDates.get(vnKey) || 0;
              const isActive = activityCount > 0;
              const isToday = vnKey === todayKey;
              const isPast = vnKey < todayKey;
              const dayNumber = day.date.getDate();

              let cellClasses = "relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-default transform hover:scale-[1.02]";
              let textColor = "text-text";
              let bgClass = "hover:bg-muted/10";

              if (isActive) {
                bgClass = "bg-success/20 hover:bg-success/30";
                textColor = "text-success font-bold";
              } else if (isPast && !isToday) {
                bgClass = "bg-error/10 hover:bg-error/20";
                textColor = "text-error";
              } else {
                bgClass = "bg-muted/5 hover:bg-muted/10";
                textColor = "text-text";
              }

              if (isToday) {
                cellClasses += " ring-2 ring-primary ring-offset-2 ring-offset-card shadow-md";
              }

              let tooltipMsg = '';
              if (isActive) tooltipMsg = `${activityCount} activity${activityCount > 1 ? 's' : ''} on this day`;
              else if (isToday && !isActive) tooltipMsg = 'Today - No activity yet';
              else if (isPast && !isActive) tooltipMsg = 'No activity';
              else tooltipMsg = 'No activities';

              return (
                <div key={colIndex} title={tooltipMsg} className={`${cellClasses} ${bgClass} ${textColor}`}>
                  <span className="z-10">{dayNumber}</span>
                  {!isActive && isPast && !isToday && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-error opacity-80" />
                  )}
                  {isToday && !isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4">
                      <Star className="w-3 h-3 text-warning fill-warning drop-shadow-sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend & footer */}
      <div className="px-5 pb-5 pt-2 border-t border-border mt-1">
        <div className="flex flex-wrap items-center justify-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-success shadow-sm"></div>
            <span className="text-muted">Active day (any session)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-error shadow-sm"></div>
            <span className="text-muted">Inactive day (past)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 ring-2 ring-primary ring-offset-1 flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-warning fill-warning" />
            </div>
            <span className="text-muted font-medium">Today</span>
          </div>
        </div>
        <div className="text-center mt-4 text-[10px] text-muted flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{monthlyStats.totalActivities} total activities this month • Keep your streak green!</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;