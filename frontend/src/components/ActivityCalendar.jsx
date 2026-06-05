// src/components/ActivityCalendar.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, Activity, Star } from 'lucide-react';
import api from '../services/api';

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

const ActivityCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Map());
  const [monthlyStats, setMonthlyStats] = useState({ activeDays: 0, totalActivities: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gọi API calendar activity
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/activity/calendar');
        const activities = response.data?.activities || [];
        
        const countMap = new Map();
        activities.forEach(activity => {
          let dateKey = activity.dateVN;
          if (!dateKey && activity.date) {
            dateKey = toVNKey(activity.date);
          }
          if (dateKey) {
            countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
          }
        });
        
        setActiveDates(countMap);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch calendar activity:', err);
        setError('Unable to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

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

  if (loading) {
    return <div className="text-center p-4">Loading calendar...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Activity Calendar
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full shadow-inner">
            <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {monthlyStats.activeDays} active days
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          Active: Interview / CV / Adaptive / Coding
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => changeMonth(-1)} className="group p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95">
          <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white" />
        </button>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white tracking-tight">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="group p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95">
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1.5 px-4 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
              let textColor = "text-gray-700 dark:text-gray-300";
              let bgClass = "hover:bg-gray-50 dark:hover:bg-gray-800/50";

              if (isActive) {
                bgClass = "bg-emerald-200 dark:bg-emerald-700 hover:bg-emerald-300 dark:hover:bg-emerald-600";
                textColor = "text-emerald-900 dark:text-white font-bold";
              } else if (isPast && !isToday) {
                bgClass = "bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-800/60";
                textColor = "text-rose-700 dark:text-rose-200";
              } else {
                bgClass = "bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/50";
                textColor = "text-gray-700 dark:text-gray-300";
              }

              if (isToday) {
                cellClasses += " ring-4 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-md";
              }

              let tooltipMsg = '';
              if (isActive) tooltipMsg = `${activityCount} activity${activityCount > 1 ? 's' : ''} on this day`;
              else if (isToday && !isActive) tooltipMsg = 'Today - No activity yet';
              else if (isPast && !isActive) tooltipMsg = 'No activity';
              else tooltipMsg = 'No activities';

              return (
                <div key={colIndex} title={tooltipMsg} className={`${cellClasses} ${bgClass} ${textColor}`}>
                  <span className="z-10">{dayNumber}</span>
                  {/* Đã bỏ hoàn toàn vòng tròn số hoạt động */}
                  {!isActive && isPast && !isToday && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-300 opacity-80" />
                  )}
                  {isToday && !isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend & footer */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
        <div className="flex flex-wrap items-center justify-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">Active day (any session)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">Inactive day (past)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 ring-4 ring-indigo-500 ring-offset-1 flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-medium">Today</span>
          </div>
        </div>
        <div className="text-center mt-4 text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{monthlyStats.totalActivities} total activities this month • Keep your streak green!</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;