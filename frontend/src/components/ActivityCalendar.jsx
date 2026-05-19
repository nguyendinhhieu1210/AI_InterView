// src/components/ActivityCalendar.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';

const ActivityCalendar = ({ sessions = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Map());
  const [monthlyStats, setMonthlyStats] = useState({ activeDays: 0, totalActivities: 0 });

  // Group activities by date & compute stats
  useEffect(() => {
    const countMap = new Map();

    sessions.forEach((session) => {
      const d = new Date(session.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    setActiveDates(countMap);
  }, [sessions]);

  // Update monthly stats when currentDate or activeDates change
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

  // Generate calendar grid (Monday first)
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();
    const offset = startWeekday === 0 ? 6 : startWeekday - 1; // shift to Monday first

    const days = [];

    // Previous month days
    for (let i = offset; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateKey: `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    // Next month days to fill 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateKey: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`,
      });
    }

    setCalendarDays(days);
  }, [currentDate]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Header with title & stats */}
      <div className="px-5 pt-5 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Activity Calendar
            </h2>
          </div>
          <div className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {monthlyStats.activeDays} active days
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          🟢 Upload CV / Interview / Submit answer &nbsp;|&nbsp; 🔴 No activity (past)
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => changeMonth(-1)}
          className="group p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white" />
        </button>

        <h3 className="text-base font-semibold text-gray-800 dark:text-white tracking-tight">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <button
          onClick={() => changeMonth(1)}
          className="group p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 px-4 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-3">
        {calendarDays.map((day, idx) => {
          const dateObj = new Date(day.date);
          dateObj.setHours(0, 0, 0, 0);
          const isPast = dateObj < today;
          const isToday = dateObj.getTime() === today.getTime();
          const isActive = activeDates.has(day.dateKey);
          const activityCount = activeDates.get(day.dateKey) || 0;

          // Determine styles
          let cellBg = 'hover:bg-gray-50 dark:hover:bg-gray-800/50';
          let textColor = 'text-gray-700 dark:text-gray-300';
          let ringClass = '';
          let dotColor = '';

          // Non-current month
          if (!day.isCurrentMonth) {
            textColor = 'text-gray-300 dark:text-gray-700';
          }

          // Active day (green)
          if (isActive) {
            cellBg = 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40';
            textColor = 'text-emerald-700 dark:text-emerald-300 font-semibold';
            dotColor = 'bg-emerald-500';
          }
          // Inactive past day (red)
          else if (isPast && !isToday && day.isCurrentMonth) {
            cellBg = 'bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40';
            textColor = 'text-rose-500 dark:text-rose-300';
            dotColor = 'bg-rose-400';
          }

          // Today highlight (indigo ring)
          if (isToday) {
            ringClass = 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900';
            if (!isActive) {
              cellBg = 'bg-indigo-50 dark:bg-indigo-900/20';
              textColor = 'text-indigo-600 dark:text-indigo-300 font-bold';
            }
          }

          // Tooltip message
          let tooltipMsg = '';
          if (isActive) {
            tooltipMsg = `${activityCount} activity${activityCount > 1 ? 's' : ''} (CV/Interview/Answer)`;
          } else if (isPast && !isToday && day.isCurrentMonth) {
            tooltipMsg = 'No activity on this day';
          } else if (!day.isCurrentMonth) {
            tooltipMsg = '';
          } else {
            tooltipMsg = 'No records yet';
          }

          return (
            <div
              key={idx}
              title={tooltipMsg}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center
                text-sm font-medium transition-all duration-200 ease-out
                ${cellBg} ${textColor} ${ringClass}
                cursor-default transform hover:scale-[1.02]
              `}
            >
              <span className="z-10">{dateObj.getDate()}</span>
              {isActive && (
                <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm`} />
              )}
              {!isActive && isPast && day.isCurrentMonth && !isToday && (
                <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 opacity-60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced legend */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span>Active day (CV / Interview / Answer)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></div>
            <span>Inactive past day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-400 ring-2 ring-indigo-200 ring-offset-1"></div>
            <span>Today</span>
          </div>
        </div>
        <div className="text-center mt-3 text-[10px] text-gray-400 dark:text-gray-500">
          💡 {monthlyStats.totalActivities} total activities this month • Keep your streak green!
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;