import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, Sparkles, X, Globe } from 'lucide-react';

interface MonthDatePickerProps {
  timeframe: string;
  onChange: (timeframe: string) => void;
}

export const MonthDatePicker: React.FC<MonthDatePickerProps> = ({ timeframe, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 7 for August
  const currentYear = now.getFullYear(); // 2026

  // Parse currently selected timeframe to year & monthIndex
  const getSelectedDetails = () => {
    if (!timeframe || timeframe === 'all') {
      return { isAll: true, year: currentYear, monthIdx: currentMonthIdx, label: 'All Months (Lifetime)' };
    }
    const parts = timeframe.split('_');
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const mIdx = monthNames.indexOf(parts[0]?.toLowerCase());
    const yr = Number(parts[1]) || currentYear;
    
    if (mIdx !== -1) {
      const properName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return { isAll: false, year: yr, monthIdx: mIdx, label: `${properName} ${yr}` };
    }
    return { isAll: false, year: currentYear, monthIdx: currentMonthIdx, label: 'Current Month' };
  };

  const selected = getSelectedDetails();
  const [pickerYear, setPickerYear] = useState<number>(selected.year || currentYear);

  // Sync picker year when selection changes externally
  useEffect(() => {
    if (!selected.isAll && selected.year) {
      setPickerYear(selected.year);
    }
  }, [timeframe]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const months = [
    { name: 'January', short: 'Jan', key: 'january' },
    { name: 'February', short: 'Feb', key: 'february' },
    { name: 'March', short: 'Mar', key: 'march' },
    { name: 'April', short: 'Apr', key: 'april' },
    { name: 'May', short: 'May', key: 'may' },
    { name: 'June', short: 'Jun', key: 'june' },
    { name: 'July', short: 'Jul', key: 'july' },
    { name: 'August', short: 'Aug', key: 'august' },
    { name: 'September', short: 'Sep', key: 'september' },
    { name: 'October', short: 'Oct', key: 'october' },
    { name: 'November', short: 'Nov', key: 'november' },
    { name: 'December', short: 'Dec', key: 'december' }
  ];

  const handleSelectMonth = (monthKey: string, year: number) => {
    onChange(`${monthKey}_${year}`);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onChange('all');
    setIsOpen(false);
  };

  const handleSelectCurrent = () => {
    const monthKey = months[currentMonthIdx].key;
    onChange(`${monthKey}_${currentYear}`);
    setPickerYear(currentYear);
    setIsOpen(false);
  };

  const handlePrevStep = () => {
    if (selected.isAll) {
      const monthKey = months[currentMonthIdx].key;
      onChange(`${monthKey}_${currentYear}`);
      return;
    }
    let prevMonth = selected.monthIdx - 1;
    let prevYear = selected.year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const monthKey = months[prevMonth].key;
    onChange(`${monthKey}_${prevYear}`);
  };

  const handleNextStep = () => {
    if (selected.isAll) {
      const monthKey = months[currentMonthIdx].key;
      onChange(`${monthKey}_${currentYear}`);
      return;
    }
    let nextMonth = selected.monthIdx + 1;
    let nextYear = selected.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const monthKey = months[nextMonth].key;
    onChange(`${monthKey}_${nextYear}`);
  };

  const isCurrentMonthActive = !selected.isAll && selected.monthIdx === currentMonthIdx && selected.year === currentYear;

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Calendar Control Trigger Bar */}
      <div className="inline-flex items-center bg-white rounded-2xl border border-purple-200/90 shadow-2xs p-1">
        {/* Step Prev Month */}
        <button
          type="button"
          onClick={handlePrevStep}
          title="Previous Month"
          className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-700 rounded-xl transition"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Main Interactive Button that opens Calendar Popover */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black transition ${
            isOpen 
              ? 'bg-purple-100 text-purple-900 shadow-2xs' 
              : 'text-slate-900 hover:bg-purple-50/70 hover:text-purple-800'
          }`}
        >
          <Calendar size={15} className="text-purple-600" />
          <span className="font-extrabold">{selected.label}</span>
          {isCurrentMonthActive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              Current
            </span>
          )}
        </button>

        {/* Step Next Month */}
        <button
          type="button"
          onClick={handleNextStep}
          title="Next Month"
          className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-700 rounded-xl transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick "This Month" Pill */}
      <button
        type="button"
        onClick={handleSelectCurrent}
        className={`ml-2 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 transition shadow-2xs ${
          isCurrentMonthActive
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
        }`}
      >
        <Sparkles size={13} className={isCurrentMonthActive ? 'text-amber-300' : 'text-purple-500'} />
        <span>This Month</span>
      </button>

      {/* VISUAL CALENDAR POPOVER MODAL */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-purple-100 shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Year Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Calendar size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Select Month & Year</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Filter quotas, targets & revenue</p>
              </div>
            </div>

            {/* Year Step Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPickerYear(pickerYear - 1)}
                className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs font-black text-slate-800">{pickerYear}</span>
              <button
                type="button"
                onClick={() => setPickerYear(pickerYear + 1)}
                className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 12-Month Calendar Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {months.map((m, idx) => {
              const isSelected = !selected.isAll && selected.monthIdx === idx && selected.year === pickerYear;
              const isThisCurrentMonth = idx === currentMonthIdx && pickerYear === currentYear;

              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleSelectMonth(m.key, pickerYear)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md scale-[1.02]'
                      : isThisCurrentMonth
                        ? 'bg-purple-50/70 hover:bg-purple-100/80 text-purple-900 border-purple-300 font-extrabold'
                        : 'bg-slate-50/60 hover:bg-slate-100 text-slate-700 border-slate-200/80 font-bold'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {m.short}
                    </span>
                    {isSelected ? (
                      <Check size={13} className="text-white" />
                    ) : isThisCurrentMonth ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    ) : null}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold truncate ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Presets Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1.5 transition ${
                selected.isAll
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Globe size={12} />
              <span>All Months (Lifetime)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-[11px] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
