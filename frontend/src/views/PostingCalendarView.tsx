import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem } from '../types';

export const PostingCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // Calculate start and end date for current view
      let start: Date;
      let end: Date;

      if (viewMode === 'Monthly') {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      } else if (viewMode === 'Weekly') {
        const day = currentDate.getDay();
        start = new Date(currentDate);
        start.setDate(currentDate.getDate() - day);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
      } else {
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
      }

      const res = await api.get(`/postings/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Monthly') {
      newDate.setMonth(currentDate.getMonth() + delta);
    } else if (viewMode === 'Weekly') {
      newDate.setDate(currentDate.getDate() + delta * 7);
    } else {
      newDate.setDate(currentDate.getDate() + delta);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days for monthly view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CalendarIcon className="text-purple-600" />
            Posting Calendar
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Visual schedule of upcoming influencer postings</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex space-x-1 text-xs font-bold">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === mode ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center space-x-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-800">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:text-purple-600">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:text-purple-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading posting calendar...</div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {viewMode === 'Monthly' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold text-slate-500 uppercase">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-28 bg-slate-50 rounded-xl border border-slate-100" />;
                  }

                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayTasks = tasks.filter(t => {
                    const tDate = new Date(t.scheduledDate).toISOString().split('T')[0];
                    return tDate === dateStr;
                  });

                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div
                      key={`day-${day}`}
                      className={`h-28 p-2 rounded-xl border text-xs flex flex-col justify-between overflow-hidden transition ${isToday ? 'bg-purple-50 border-purple-300 shadow-xs' : 'bg-white border-slate-200 hover:border-purple-200'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-extrabold text-xs ${isToday ? 'text-purple-700' : 'text-slate-800'}`}>
                          {day}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                            {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 overflow-y-auto max-h-20 pr-0.5">
                        {dayTasks.map((t) => (
                          <div
                            key={t._id}
                            className={`p-1 rounded text-[10px] truncate font-bold border ${t.status === 'Verified' ? 'badge-verified' :
                                t.status === 'Submitted' ? 'badge-submitted' : 'badge-pending'
                              }`}
                            title={`${t.scheduledTime} - ${t.title} (${t.platform})`}
                          >
                            {t.scheduledTime}: {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
