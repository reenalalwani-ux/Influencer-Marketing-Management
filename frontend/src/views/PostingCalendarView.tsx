import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Square, User as UserIcon, RefreshCw, CheckCircle2, Check, Search, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem, Employee, Brand } from '../types';
import { InlineLoader } from '../components/PageLoader';

interface PostingCalendarViewProps {
  currentUser?: any;
}

export const PostingCalendarView: React.FC<PostingCalendarViewProps> = ({ currentUser }) => {
  const isEmployeeRole = currentUser?.role === 'Employee';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Sheet Matrix' | 'Monthly' | 'Weekly' | 'Daily'>('Sheet Matrix');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Matrix Sheet State
  const [matrixEmployees, setMatrixEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [matrixBrands, setMatrixBrands] = useState<Brand[]>([]);
  const [matrixDates, setMatrixDates] = useState<Array<{ dateStr: string; monthDayStr: string; dayNum: number; dayName: string; isToday: boolean }>>([]);
  const [matrixMap, setMatrixMap] = useState<Record<string, { isPosted: boolean; taskId?: string; status?: string }>>({});
  const [togglingCell, setTogglingCell] = useState<string | null>(null);

  // Staff Searchable Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      let url = `/postings/matrix?year=${year}&month=${month}`;
      if (selectedEmployeeId) url += `&employeeId=${selectedEmployeeId}`;

      const res = await api.get(url);
      if (res.success) {
        let fetchedEmployees: Employee[] = res.employees || [];
        if (isEmployeeRole && currentUser) {
          const matched = fetchedEmployees.find((e: any) =>
            e.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
            e.name?.toLowerCase() === currentUser.name?.toLowerCase()
          );
          if (matched) {
            fetchedEmployees = [matched];
            setSelectedEmployeeId(matched._id);
          }
        }
        setMatrixEmployees(fetchedEmployees);
        if (!selectedEmployeeId && res.selectedEmployeeId) {
          setSelectedEmployeeId(res.selectedEmployeeId);
        }
        setMatrixBrands(res.brands || []);
        setMatrixDates(res.dates || []);
        setMatrixMap(res.matrixMap || {});
      }
    } catch (err) {
      console.error('Failed to fetch posting matrix', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
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
    if (viewMode === 'Sheet Matrix') {
      fetchMatrixData();
    } else {
      fetchCalendarData();
    }
  }, [currentDate, viewMode, selectedEmployeeId]);

  const togglePostingCell = async (brandId: string, dateStr: string, currentIsPosted: boolean) => {
    if (!selectedEmployeeId) return;
    const cellKey = `${brandId}_${dateStr}`;
    setTogglingCell(cellKey);

    const newStatus = !currentIsPosted;

    // Optimistic UI update
    setMatrixMap(prev => ({
      ...prev,
      [cellKey]: { isPosted: newStatus }
    }));

    try {
      const res = await api.post('/postings/matrix/toggle', {
        employeeId: selectedEmployeeId,
        brandId,
        date: dateStr,
        isPosted: newStatus
      });

      if (!res.success) {
        // Rollback on failure
        setMatrixMap(prev => ({
          ...prev,
          [cellKey]: { isPosted: currentIsPosted }
        }));
      }
    } catch (err) {
      console.error('Failed to toggle matrix cell', err);
      // Rollback
      setMatrixMap(prev => ({
        ...prev,
        [cellKey]: { isPosted: currentIsPosted }
      }));
    } finally {
      setTogglingCell(null);
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Sheet Matrix' || viewMode === 'Monthly') {
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

  // Calculate Matrix Sheet stats
  const totalMatrixCells = matrixBrands.length * matrixDates.length;
  const postedMatrixCells = Object.values(matrixMap).filter(v => v.isPosted).length;
  const completionPercentage = totalMatrixCells > 0 ? Math.round((postedMatrixCells / totalMatrixCells) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Posting Calendar</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Day-wise brand posting tracking matrix & schedule.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex space-x-1 text-xs font-bold">
            {(['Sheet Matrix', 'Monthly', 'Weekly', 'Daily'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === mode ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {mode === 'Sheet Matrix' ? '📊 Sheet Matrix' : mode}
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

      {/* Mode 1: Sheet Matrix View (Google Sheet Style Day-wise Brand Posting Grid) */}
      {viewMode === 'Sheet Matrix' && (
        <div className="space-y-4">
          {/* Employee Selection Searchable Dropdown Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <UserIcon size={16} /> Staff Member:
              </span>

              {/* Searchable Dropdown */}
              {isEmployeeRole ? (
                <div className="px-4 py-2 bg-purple-100/90 border border-purple-300 text-purple-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-2xs">
                  <span>{currentUser?.name || 'Gunjan'}</span>
                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-200/80 px-2 py-0.5 rounded-md">
                    {matrixEmployees.find(e => e._id === selectedEmployeeId)?.department || 'Influencer Marketing'}
                  </span>
                </div>
              ) : (
                <div className="relative">
                {isDropdownOpen && (
                  <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                )}

                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-between gap-3 min-w-[260px] shadow-2xs transition"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="truncate">
                      {matrixEmployees.find(e => e._id === selectedEmployeeId)?.name || 'Select Staff Member'}
                    </span>
                    {matrixEmployees.find(e => e._id === selectedEmployeeId) && (
                      <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 truncate">
                        {matrixEmployees.find(e => e._id === selectedEmployeeId)?.department || 'Staff'}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 p-2.5 space-y-2 animate-fade-in">
                    {/* Search Input Bar inside Dropdown */}
                    <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                      <Search size={14} className="text-purple-600 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search staff by name or department..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-bold"
                        autoFocus
                      />
                    </div>

                    {/* Staff List Options */}
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {matrixEmployees.filter(emp =>
                        emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                        (emp.department || '').toLowerCase().includes(employeeSearchTerm.toLowerCase())
                      ).length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                          No matching staff members found
                        </div>
                      ) : (
                        matrixEmployees
                          .filter(emp =>
                            emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                            (emp.department || '').toLowerCase().includes(employeeSearchTerm.toLowerCase())
                          )
                          .map((emp) => (
                            <button
                              key={emp._id}
                              onClick={() => {
                                setSelectedEmployeeId(emp._id);
                                setIsDropdownOpen(false);
                                setEmployeeSearchTerm('');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                                selectedEmployeeId === emp._id
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-800 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                            >
                              <span className="truncate">{emp.name}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                selectedEmployeeId === emp._id ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {emp.department || 'Staff'}
                              </span>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Completion Progress Badge */}
            <div className="flex items-center space-x-3 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200 text-xs font-bold shrink-0">
              <CheckCircle2 size={16} className="text-purple-600" />
              <span className="text-slate-700">
                Monthly Progress: <strong className="text-purple-700 font-extrabold">{postedMatrixCells} / {totalMatrixCells} Days ({completionPercentage}%)</strong>
              </span>
            </div>
          </div>

          {/* Spreadsheet Table Grid */}
          {loading ? (
            <InlineLoader message="Loading posting matrix..." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white sticky top-0 z-20">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px] sticky left-0 z-30 bg-slate-800 border-b border-r border-slate-700 font-extrabold uppercase text-[11px]">
                        Brand Name ({matrixBrands.length})
                      </th>
                      {matrixDates.map((d) => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const isFuture = d.dateStr > todayStr;

                        return (
                          <th
                            key={d.dateStr}
                            className={`px-2 py-2 text-center min-w-[55px] border-b border-r border-slate-700 font-extrabold ${
                              d.isToday
                                ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                                : isFuture
                                ? 'bg-slate-900/90 text-slate-500 opacity-60'
                                : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="text-[10px] font-mono opacity-80">{d.monthDayStr}</div>
                            <div className="text-[9px] uppercase font-semibold">{d.dayName}</div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center min-w-[80px] border-b border-slate-700 font-extrabold uppercase text-[10px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matrixBrands.length === 0 ? (
                      <tr>
                        <td colSpan={matrixDates.length + 2} className="px-6 py-12 text-center text-slate-500 font-semibold">
                          No active brands assigned to this staff member.
                        </td>
                      </tr>
                    ) : (
                      matrixBrands.map((brand, bIdx) => {
                        // Calculate posted count for this row
                        let rowPostedCount = 0;
                        matrixDates.forEach(d => {
                          const cellKey = `${brand._id}_${d.dateStr}`;
                          if (matrixMap[cellKey]?.isPosted) rowPostedCount++;
                        });

                        const rowBg = bIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

                        return (
                          <tr key={brand._id} className={`${rowBg} hover:bg-purple-50/40 transition`}>
                            <td className="px-4 py-2.5 font-bold text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-xs flex items-center justify-between">
                              <span className="truncate max-w-[160px]">{brand.brandName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                {brand.industry || 'Brand'}
                              </span>
                            </td>

                            {matrixDates.map((d) => {
                              const cellKey = `${brand._id}_${d.dateStr}`;
                              const cellData = matrixMap[cellKey];
                              const isPosted = !!cellData?.isPosted;
                              const isBusy = togglingCell === cellKey;
                              const now = new Date();
                              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              const isFuture = d.dateStr > todayStr;

                              return (
                                <td
                                  key={d.dateStr}
                                  onClick={() => !isFuture && togglePostingCell(brand._id, d.dateStr, isPosted)}
                                  title={isFuture ? `Future Date (${d.monthDayStr}) - Disabled` : `Toggle posting for ${d.monthDayStr}`}
                                  className={`px-1 py-2 text-center border-r border-slate-200 select-none transition ${
                                    isFuture
                                      ? 'bg-slate-100/70 cursor-not-allowed opacity-40'
                                      : 'cursor-pointer ' + (d.isToday ? 'bg-purple-50/60' : isPosted ? 'bg-emerald-50/60 hover:bg-emerald-100/80' : 'hover:bg-purple-50')
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    {isBusy ? (
                                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : isPosted ? (
                                      <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                        <Check size={14} strokeWidth={3.5} />
                                      </div>
                                    ) : isFuture ? (
                                      <div className="w-5 h-5 rounded-md border border-slate-200 bg-slate-200/50 cursor-not-allowed">
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white hover:border-purple-500 transition">
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}

                            <td className="px-3 py-2 text-center font-bold text-purple-700 bg-purple-50/40 border-slate-200">
                              {rowPostedCount} / {matrixDates.length}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Calendar Grid Views (Monthly / Weekly / Daily) */}
      {viewMode !== 'Sheet Matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {loading ? (
            <InlineLoader message="Loading posting calendar..." />
          ) : viewMode === 'Monthly' && (
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
