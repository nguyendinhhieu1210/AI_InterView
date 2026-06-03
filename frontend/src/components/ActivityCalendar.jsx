// src/components/ActivityCalendar.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles, Activity, Star } from 'lucide-react';

const ActivityCalendar = ({ sessions = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [activeDates, setActiveDates] = useState(new Map());
  const [monthlyStats, setMonthlyStats] = useState({ activeDays: 0, totalActivities: 0 });

  // Group activities by date
  useEffect(() => {
    const countMap = new Map();
    sessions.forEach((session) => {
      const d = new Date(session.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });
    setActiveDates(countMap);
  }, [sessions]);

  // Update monthly stats
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
    const offset = startWeekday === 0 ? 6 : startWeekday - 1;

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

    // Fill remaining cells
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
          Active: Interview or CV session
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
      <div className="grid grid-cols-7 gap-1.5 px-4 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 px-4 pb-4">
        {calendarDays.map((day, idx) => {
          const dateObj = new Date(day.date);
          dateObj.setHours(0, 0, 0, 0);
          const isPast = dateObj < today;
          const isToday = dateObj.getTime() === today.getTime();
          const isActive = activeDates.has(day.dateKey);
          const activityCount = activeDates.get(day.dateKey) || 0;

          let cellClasses = "relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 cursor-default transform hover:scale-[1.02]";
          let textColor = "text-gray-700 dark:text-gray-300";
          let bgClass = "hover:bg-gray-50 dark:hover:bg-gray-800/50";

          // Non-current month
          if (!day.isCurrentMonth) {
            textColor = "text-gray-300 dark:text-gray-600";
          }

          // Active day – solid green
          if (isActive) {
            bgClass = "bg-emerald-200 dark:bg-emerald-700 hover:bg-emerald-300 dark:hover:bg-emerald-600";
            textColor = "text-emerald-900 dark:text-white font-bold";
          }
          // Inactive past day – soft red
          else if (isPast && !isToday && day.isCurrentMonth) {
            bgClass = "bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-800/60";
            textColor = "text-rose-700 dark:text-rose-200";
          }
          // Future day (including today if inactive) – neutral
          else if (!isPast && !isActive && day.isCurrentMonth) {
            bgClass = "bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/50";
            textColor = "text-gray-700 dark:text-gray-300";
          }

          // Today marker: strong ring + star (bo viền rõ)
          if (isToday) {
            cellClasses += " ring-4 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-md";
          }

          let tooltipMsg = '';
          if (isActive) {
            tooltipMsg = `${activityCount} interview${activityCount > 1 ? 's' : ''} on this day`;
          } else if (isToday && !isActive) {
            tooltipMsg = 'Today - No activity yet';
          } else if (isPast && !isActive && day.isCurrentMonth) {
            tooltipMsg = 'No activity';
          } else if (!day.isCurrentMonth) {
            tooltipMsg = '';
          } else {
            tooltipMsg = 'No interviews yet';
          }

          return (
            <div
              key={idx}
              title={tooltipMsg}
              className={`${cellClasses} ${bgClass} ${textColor}`}
            >
              <span className="z-10">{dateObj.getDate()}</span>
              {/* Activity dot */}
              {isActive && (
                <div className="absolute bottom-1.5 w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-300 shadow-sm" />
              )}
              {!isActive && isPast && day.isCurrentMonth && !isToday && (
                <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-300 opacity-80" />
              )}
              {/* Today star icon */}
              {isToday && (
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
        <div className="flex flex-wrap items-center justify-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">Active day (Interview/CV/Adaptive)</span>
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
          <span>{monthlyStats.totalActivities} total interviews this month • Keep your streak green!</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;