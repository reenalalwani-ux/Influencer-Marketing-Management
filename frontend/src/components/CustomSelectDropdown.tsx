import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, CheckCircle2 } from 'lucide-react';

export interface CustomSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface CustomSelectDropdownProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  allLabel: string;
  allValue?: string;
}

export const CustomSelectDropdown: React.FC<CustomSelectDropdownProps> = ({
  label,
  icon,
  value,
  onChange,
  options,
  allLabel,
  allValue = 'All'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = !value || value === allValue;
  const selectedOpt = options.find(o => o.value === value);
  const activeDisplayLabel = isAllSelected ? allLabel : (selectedOpt ? selectedOpt.label : value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all duration-150 shadow-2xs border cursor-pointer select-none ${
          !isAllSelected
            ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20'
            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700'
        }`}
      >
        {icon}
        <span className="truncate max-w-[150px] tracking-tight">{activeDisplayLabel}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${!isAllSelected ? 'text-white' : 'text-slate-400'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Popover Panel - Opaque White */}
      {isOpen && (
        <div className="absolute left-0 mt-2 min-w-[220px] max-w-[280px] rounded-2xl bg-white border border-slate-200 shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Box Header */}
          {options.length > 4 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${label}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 text-slate-800 placeholder-slate-400"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin bg-white">
            {/* All Options Default Button */}
            <button
              type="button"
              onClick={() => { onChange(allValue); setIsOpen(false); setSearch(''); }}
              className={`w-full px-3 py-2 text-left text-xs font-extrabold rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                isAllSelected
                  ? 'bg-purple-600 text-white font-extrabold'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {icon}
                <span className="truncate">{allLabel}</span>
              </div>
              {isAllSelected && <CheckCircle2 size={13} className="text-white shrink-0" />}
            </button>

            {/* Filtered Option Items */}
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                    className={`w-full px-3 py-2 text-left text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white font-extrabold'
                        : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={13} className="text-white shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
