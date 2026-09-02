import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Plus, Search, Filter, Link2, Video, CheckCircle2, Clock, Trash2, Edit2, ExternalLink, ChevronDown, User, FileSpreadsheet, Eye, Grid, List, Share2, Copy, Check, MessageSquare, Mail, Send, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ContentCalendarItem, Brand, Employee } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

// Custom Searchable Brand Dropdown with Search Bar
const SearchableBrandDropdown: React.FC<{
  brands: string[];
  selectedBrand: string;
  onSelect: (brand: string) => void;
}> = ({ brands, selectedBrand, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands.filter(b =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (brands.length <= 1) {
    return (
      <div className="flex items-center space-x-1.5 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
        <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider shrink-0">Brand:</span>
        <div className="bg-white border border-purple-300 text-purple-950 text-xs font-black rounded-lg px-3 py-1.5 shadow-2xs flex items-center gap-1.5">
          <span>🏢 {selectedBrand || 'Assigned Brand'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center space-x-1.5 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
        <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider shrink-0">Brand:</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border border-purple-300 text-purple-950 text-xs font-black rounded-lg px-3 py-1.5 focus:outline-none hover:bg-purple-100 transition flex items-center justify-between gap-2 min-w-[150px] shadow-2xs cursor-pointer"
        >
          <span className="truncate">🏢 {selectedBrand || 'Select Brand'}</span>
          <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1.5 w-64 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-purple-100 bg-purple-50/50">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-purple-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand..."
                className="w-full bg-white border border-purple-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Scrollable Brands List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-purple-50/50">
            {filteredBrands.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                No brand found
              </div>
            ) : (
              filteredBrands.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onSelect(b);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-extrabold flex items-center justify-between transition ${
                    selectedBrand === b
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                  }`}
                >
                  <span className="truncate">🏢 {b}</span>
                  {selectedBrand === b && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Floating Month Popover Dropdown
const CustomMonthDropdown: React.FC<{
  currentMonth: number;
  currentYear: number;
  onSelectMonth: (month: number) => void;
}> = ({ currentMonth, currentYear, onSelectMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    { value: 7, label: 'July 2026' },
    { value: 8, label: 'August 2026' },
    { value: 9, label: 'September 2026' },
    { value: 10, label: 'October 2026' },
    { value: 11, label: 'November 2026' },
    { value: 12, label: 'December 2026' },
  ];

  const activeMonthLabel = months.find(m => m.value === currentMonth)?.label || `${currentMonth}/${currentYear}`;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 hover:border-purple-400 text-slate-800 text-xs font-extrabold rounded-xl px-3.5 py-2 focus:outline-none flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer min-w-[140px]"
      >
        <span>📅 {activeMonthLabel}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1.5 w-48 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1 space-y-0.5">
          {months.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                onSelectMonth(m.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                currentMonth === m.value
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <span>{m.label}</span>
              {currentMonth === m.value && <CheckCircle2 size={13} className="text-white shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Floating Fortnight Popover Dropdown
const CustomFortnightDropdown: React.FC<{
  selectedFortnight: string;
  onSelectFortnight: (fortnight: string) => void;
}> = ({ selectedFortnight, onSelectFortnight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'All', label: '📅 Full Month Calendar' },
    { value: '1st-15th', label: '🗓️ 1st – 15th Cycle (1st Fortnight)' },
    { value: '16th-End', label: '🗓️ 16th – End Cycle (2nd Fortnight)' },
  ];

  const activeLabel = options.find(o => o.value === selectedFortnight)?.label || '📅 Full Month Calendar';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-50/80 border border-purple-200 hover:border-purple-400 text-purple-950 text-xs font-extrabold rounded-xl px-3.5 py-2 focus:outline-none flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer min-w-[190px]"
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1.5 w-64 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1 space-y-0.5">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onSelectFortnight(o.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                selectedFortnight === o.value
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {selectedFortnight === o.value && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Floating Modal Select Component with Auto Search
const CustomModalSelect: React.FC<{
  value: string | number;
  options: { value: string | number; label: string; icon?: string }[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}> = ({ value, options, onChange, placeholder = 'Select...', disabled = false, searchable = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  const showSearch = searchable && options.length > 5;
  const filteredOptions = showSearch
    ? options.filter(o => String(o.label).toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  if (disabled) {
    return (
      <div className="w-full bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl px-3 py-2 text-xs flex items-center justify-between cursor-not-allowed">
        <span className="truncate flex items-center gap-1.5">
          {selectedOpt?.icon && <span>{selectedOpt.icon}</span>}
          <span>{selectedOpt?.label || value || placeholder}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-purple-400 focus:border-purple-500 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer"
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOpt?.icon && <span>{selectedOpt.icon}</span>}
          <span>{selectedOpt?.label || value || placeholder}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 left-0 mt-1 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Header */}
          {showSearch && (
            <div className="p-2 border-b border-purple-100 bg-purple-50/50">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-purple-500" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search option..."
                  className="w-full bg-white border border-purple-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                No match found
              </div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    value === opt.value
                      ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                  {value === opt.value && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Floating Multi-Select Platform Popover Dropdown
const CustomMultiSelectPlatformDropdown: React.FC<{
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}> = ({ selectedPlatforms, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'Instagram', label: 'Instagram', icon: '📸' },
    { value: 'YouTube', label: 'YouTube', icon: '▶️' },
    { value: 'Facebook', label: 'Facebook', icon: '📘' },
    { value: 'LinkedIn', label: 'LinkedIn', icon: '💼' },
    { value: 'TikTok', label: 'TikTok', icon: '🎵' },
  ];

  const toggleOption = (val: string) => {
    let next: string[];
    if (selectedPlatforms.includes(val)) {
      next = selectedPlatforms.filter(v => v !== val);
      if (next.length === 0) next = ['Instagram'];
    } else {
      next = [...selectedPlatforms, val];
    }
    onChange(next);
  };

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-purple-400 focus:border-purple-500 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer min-h-[38px]"
      >
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
          {selectedPlatforms.length === 0 ? (
            <span className="text-slate-400 font-normal">Select platforms...</span>
          ) : (
            selectedPlatforms.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-extrabold shadow-2xs">
                  {opt?.icon && <span>{opt.icon}</span>}
                  <span>{val}</span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 left-0 mt-1 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Select Platforms (Multi-Select)
          </div>
          {options.map(opt => {
            const isChecked = selectedPlatforms.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  isChecked
                    ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] transition ${
                    isChecked ? 'bg-white text-purple-700 border-white font-black' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </span>
                {isChecked && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Custom Floating POC Popover Dropdown with Search Bar
const CustomPocDropdown: React.FC<{
  designers: string[];
  selectedDesigner: string;
  onSelectDesigner: (designer: string) => void;
}> = ({ designers, selectedDesigner, onSelectDesigner }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDesigners = designers.filter(d =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLabel = selectedDesigner === 'All' ? '👤 All POCs' : `👤 ${selectedDesigner}`;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 hover:border-purple-400 text-slate-800 text-xs font-extrabold rounded-xl px-3.5 py-2 focus:outline-none flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer min-w-[140px]"
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-left absolute right-0 mt-1.5 w-60 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-purple-100 bg-purple-50/50">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-purple-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search POC..."
                className="w-full bg-white border border-purple-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-purple-50/50">
            <button
              type="button"
              onClick={() => {
                onSelectDesigner('All');
                setIsOpen(false);
                setSearchQuery('');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                selectedDesigner === 'All'
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <span>👤 All POCs</span>
              {selectedDesigner === 'All' && <CheckCircle2 size={13} className="text-white shrink-0" />}
            </button>

            {filteredDesigners.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onSelectDesigner(d);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  selectedDesigner === d
                    ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                <span className="truncate">👤 {d}</span>
                {selectedDesigner === d && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Calendar Cycle Dropdown Component
const CustomCalendarCycleDropdown: React.FC<{
  cycles: { cycleId: string; cycleTitle: string; count: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}> = ({ cycles, selectedIndex, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCycle = cycles[selectedIndex] || cycles[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-950 border border-purple-200 rounded-xl font-extrabold text-xs flex items-center justify-between gap-3 transition shadow-2xs hover:shadow-xs cursor-pointer min-w-[240px]"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
            #{selectedIndex + 1}
          </span>
          <span className="truncate">🗓️ {currentCycle?.cycleTitle || 'Select Calendar'}</span>
        </div>
        <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1.5 w-72 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-purple-900 tracking-wider border-b border-purple-100">
            Select Calendar Cycle ({cycles.length})
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {cycles.map((c, idx) => (
              <button
                key={c.cycleId}
                type="button"
                onClick={() => {
                  onSelect(idx);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                    selectedIndex === idx ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="truncate">{c.cycleTitle}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  selectedIndex === idx ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {c.count} Posts
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ContentCalendarViewProps {
  currentUser?: any;
}

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({ currentUser }) => {
  const userRole = (currentUser?.role || '').toLowerCase();
  const isMemberOrEmployee = userRole === 'member' || userRole === 'employee';
  const isManagerOrAdmin = !isMemberOrEmployee;
  const isEmployeeRole = isMemberOrEmployee;

  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('Kala Kurti');
  const [selectedDesignerFilter, setSelectedDesignerFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedFortnight, setSelectedFortnight] = useState<string>('All');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // August (1-indexed)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'Spreadsheet Grid' | 'List View'>('Spreadsheet Grid');

  // Clear All Modal State
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearingLoading, setClearingLoading] = useState(false);
  const [targetDeleteCycleId, setTargetDeleteCycleId] = useState<string>('All');
  const [targetDeleteCycleTitle, setTargetDeleteCycleTitle] = useState<string>('');

  // Create New Calendar Modal State
  const [showCreateNewCalendarModal, setShowCreateNewCalendarModal] = useState(false);
  const [creatingCycleLoading, setCreatingCycleLoading] = useState(false);
  const [newCalBrandId, setNewCalBrandId] = useState('');
  const [newCalBrandName, setNewCalBrandName] = useState('');
  const [newCalMonth, setNewCalMonth] = useState(8);
  const [newCalYear, setNewCalYear] = useState(2026);
  const [newCalFortnight, setNewCalFortnight] = useState('1st-15th');
  const [newCalTypeOfPost, setNewCalTypeOfPost] = useState('Intro Post');
  const [newCalPlatforms, setNewCalPlatforms] = useState<string[]>(['Instagram']);
  const [newCalDesignerId, setNewCalDesignerId] = useState('');
  const [newCalTitle, setNewCalTitle] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentCalendarItem | null>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [selectedShareCycleId, setSelectedShareCycleId] = useState<string>('All');

  // Inline Link Editing States
  const [editingRefLinkId, setEditingRefLinkId] = useState<string | null>(null);
  const [editingMediaLinkId, setEditingMediaLinkId] = useState<string | null>(null);

  // List View Single-Calendar Page Switcher State
  const [activeListCycleIndex, setActiveListCycleIndex] = useState<number>(0);

  const handleShareCalendar = async (overrideCycleId?: string) => {
    if (!selectedBrandFilter) {
      alert('Please select a brand to share');
      return;
    }
    const cycleToShare = overrideCycleId !== undefined ? overrideCycleId : selectedShareCycleId;
    setSharingLoading(true);
    try {
      const res = await api.post('/content-calendar/share', {
        brandName: selectedBrandFilter,
        year: currentYear,
        month: currentMonth,
        cycleId: cycleToShare
      });
      if (res.success && res.token) {
        const fullUrl = `${window.location.origin}/#/share/${res.token}`;
        setShareUrl(fullUrl);
        setSelectedShareCycleId(cycleToShare);
        setShowShareModal(true);
        setCopied(false);
      } else {
        alert(res.message || 'Failed to generate share link');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate share link');
    } finally {
      setSharingLoading(false);
    }
  };

  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const msg = `Hello! 📜 Here is the Content Calendar for *${selectedBrandFilter}* (${monthName} ${currentYear}):\n\n${shareUrl}\n\nPlease review and let us know if you have any feedback or changes!`;
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const subject = `Content Calendar - ${selectedBrandFilter} (${monthName} ${currentYear})`;
    const body = `Hi,\n\nPlease find the Content Calendar for ${selectedBrandFilter} (${monthName} ${currentYear}) at the link below:\n\n${shareUrl}\n\nFeel free to review and reach out if you have any questions.\n\nBest regards,\nInfluencer Marketing Team`;
    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleShareGmail = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const subject = `Content Calendar - ${selectedBrandFilter} (${monthName} ${currentYear})`;
    const body = `Hi,\n\nPlease find the Content Calendar for ${selectedBrandFilter} (${monthName} ${currentYear}) at the link below:\n\n${shareUrl}\n\nFeel free to review and reach out if you have any questions.\n\nBest regards,\nInfluencer Marketing Team`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Form Fields
  const [brandName, setBrandName] = useState('Kala Kurti');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeOfPost, setTypeOfPost] = useState('Intro Post');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram']);
  const [referenceLink, setReferenceLink] = useState('');
  const [mediaLink, setMediaLink] = useState('');
  const [assignedDesignerName, setAssignedDesignerName] = useState('');
  const [assignedDesignerId, setSelectedDesignerId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Pending' | 'Approved' | 'Published'>('Pending');
  const [notes, setNotes] = useState('');

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.success && res.data.length > 0) {
        // If current user is a Client, strictly scope brands list to ONLY their assigned brand
        if (currentUser?.role === 'Client') {
          const clientBrandName = currentUser?.brandDetails?.brandName || currentUser?.brandDetails?.name;
          const matchedBrand = res.data.find((b: any) =>
            (currentUser.brandId && (b._id === currentUser.brandId || b._id === (currentUser.brandId as any)._id)) ||
            (clientBrandName && b.brandName.toLowerCase() === clientBrandName.toLowerCase())
          ) || res.data[0];

          if (matchedBrand) {
            setBrands([matchedBrand]);
            setSelectedBrandFilter(matchedBrand.brandName);
            return;
          }
        }

        setBrands(res.data);
        const bNames = res.data.map((b: any) => b.brandName);
        setSelectedBrandFilter(prev => {
          if (prev && bNames.includes(prev)) return prev;
          return bNames[0];
        });
      } else {
        setBrands([]);
        setSelectedBrandFilter('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.success) setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarEntries = async (overrideBrand?: string, overrideMonth?: number, overrideYear?: number) => {
    const targetBrand = overrideBrand || selectedBrandFilter;
    const targetMonth = overrideMonth !== undefined ? overrideMonth : currentMonth;
    const targetYear = overrideYear !== undefined ? overrideYear : currentYear;

    if (!targetBrand) return;
    setLoading(true);
    try {
      let url = `/content-calendar?year=${targetYear}&month=${targetMonth}&brandName=${encodeURIComponent(targetBrand)}`;
      if (selectedFortnight !== 'All') url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;
      if (selectedDesignerFilter !== 'All') url += `&designer=${encodeURIComponent(selectedDesignerFilter)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch content calendar', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllCalendar = async () => {
    setClearingLoading(true);
    try {
      let url = `/content-calendar/clear-all?brandName=${encodeURIComponent(selectedBrandFilter)}&year=${currentYear}&month=${currentMonth}`;
      if (targetDeleteCycleId && targetDeleteCycleId !== 'All') {
        url += `&cycleId=${encodeURIComponent(targetDeleteCycleId)}`;
      } else if (selectedFortnight !== 'All') {
        url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;
      }

      const res = await api.delete(url);
      if (res.success) {
        setShowClearAllModal(false);
        setTargetDeleteCycleId('All');
        setTargetDeleteCycleTitle('');
        fetchCalendarEntries();
      } else {
        alert(res.message || 'Failed to clear calendar');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to clear calendar');
    } finally {
      setClearingLoading(false);
    }
  };

  const [newCalFrequency, setNewCalFrequency] = useState<'AllDays' | 'OddDays' | 'EvenDays' | 'Custom'>('AllDays');
  const [newCalCustomDays, setNewCalCustomDays] = useState<number[]>([]);

  const openCreateNewCalendarModal = () => {
    const defaultB = selectedBrandFilter || uniqueBrands[0] || 'Zudio';
    
    // Find logged-in user's employee record if available
    const matchedEmp = employees.find(e =>
      (currentUser?.email && e.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && e.name?.toLowerCase() === currentUser.name.toLowerCase())
    );
    const loggedInName = currentUser?.name || matchedEmp?.name || 'Logged In User';
    const loggedInId = matchedEmp ? matchedEmp._id : '';

    const matchedB = brands.find(b => b.brandName === defaultB);
    setNewCalBrandId(matchedB ? matchedB._id : '');
    setNewCalBrandName(defaultB);

    setAssignedDesignerName(loggedInName);
    setNewCalDesignerId(loggedInId);

    setNewCalMonth(currentMonth);
    setNewCalYear(currentYear);
    setNewCalFortnight('All');         // Always Full Month
    setNewCalFrequency('AllDays');
    setNewCalCustomDays([]);
    setNewCalTypeOfPost('Intro Post');
    setNewCalPlatforms(['Instagram']);
    setShowCreateNewCalendarModal(true);
  };

  const handleCreateNewCalendarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCalFrequency === 'Custom' && newCalCustomDays.length === 0) {
      alert('Please select at least one posting day.');
      return;
    }
    setCreatingCycleLoading(true);
    try {
      const bObj = brands.find(b => b.brandName === newCalBrandName || b._id === newCalBrandId);
      const finalBName = newCalBrandName || (bObj ? bObj.brandName : selectedBrandFilter);

      const empObj = employees.find(e => e.name === assignedDesignerName || e._id === newCalDesignerId);
      const finalDesignerName = currentUser?.name || (empObj ? empObj.name : assignedDesignerName);

      const payload = {
        brandId: bObj ? bObj._id : undefined,
        brandName: finalBName,
        year: newCalYear,
        month: newCalMonth,
        fortnight: 'All',              // Always Full Month
        frequency: newCalFrequency,
        customDays: newCalFrequency === 'Custom' ? newCalCustomDays : undefined,
        platform: newCalPlatforms.join(', '),
        assignedDesignerId: empObj ? empObj._id : undefined,
        assignedDesignerName: finalDesignerName,
        defaultPostType: newCalTypeOfPost,
        cycleTitle: newCalTitle || undefined
      };

      const res = await api.post('/content-calendar/create-cycle', payload);
      if (res.success) {
        setShowCreateNewCalendarModal(false);
        setSelectedBrandFilter(finalBName);
        setCurrentMonth(newCalMonth);
        setCurrentYear(newCalYear);
        setSelectedFortnight('All');    // Always show full month view after creation
        setSelectedDesignerFilter('All');

        // Immediately fetch newly created calendar entries
        fetchCalendarEntries(finalBName, newCalMonth, newCalYear);
      } else {
        alert(res.message || 'Failed to create new calendar');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create new calendar');
    } finally {
      setCreatingCycleLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchEmployees();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadEntries = async () => {
      if (!selectedBrandFilter) return;
      setLoading(true);
      try {
        let url = `/content-calendar?year=${currentYear}&month=${currentMonth}&brandName=${encodeURIComponent(selectedBrandFilter)}`;
        if (selectedFortnight !== 'All') url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;
        if (selectedDesignerFilter !== 'All') url += `&designer=${encodeURIComponent(selectedDesignerFilter)}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

        const res = await api.get(url);
        if (!isCancelled && res.success) {
          setItems(res.data);
        }
      } catch (err) {
        if (!isCancelled) console.error('Failed to fetch content calendar', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadEntries();

    return () => {
      isCancelled = true;
    };
  }, [selectedBrandFilter, selectedDesignerFilter, selectedFortnight, currentYear, currentMonth, searchTerm]);

  const filteredItems = items.filter(item => {
    if (selectedStatusFilter !== 'All' && item.status !== selectedStatusFilter) return false;
    return true;
  });

  // Group items by cycle (cycleId or creation batch fallback)
  const groupedCycles = React.useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return [];

    const map: Record<string, { cycleId: string; cycleTitle: string; platform: string; items: ContentCalendarItem[] }> = {};

    filteredItems.forEach((item) => {
      let key = item.cycleId;
      if (!key) {
        if (item.createdAt) {
          const time = new Date(item.createdAt).getTime();
          key = `batch_${Math.floor(time / 120000)}_${item.platform || 'General'}`;
        } else {
          key = `general_${item.platform || 'General'}`;
        }
      }

      if (!map[key]) {
        map[key] = {
          cycleId: key,
          cycleTitle: item.cycleTitle || `Content Calendar (${item.platform || 'General'})`,
          platform: item.platform || 'General',
          items: []
        };
      }
      map[key].items.push(item);
    });

    return Object.values(map);
  }, [filteredItems]);

  const openAddModal = (dateStr?: string) => {
    setEditingItem(null);
    setBrandName(selectedBrandFilter || 'Kala Kurti');
    const matchedB = brands.find(b => b.brandName === selectedBrandFilter);
    setSelectedBrandId(matchedB ? matchedB._id : '');
    setPostDate(dateStr || new Date().toISOString().split('T')[0]);
    setTypeOfPost('Intro Post');
    setSelectedPlatforms(['Instagram']);
    setReferenceLink('');
    setMediaLink('');

    const matchedEmp = employees.find(e =>
      (currentUser?.email && e.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && e.name?.toLowerCase() === currentUser.name.toLowerCase())
    );
    const loggedInName = currentUser?.name || matchedEmp?.name || '';
    const loggedInId = matchedEmp ? matchedEmp._id : '';

    setAssignedDesignerName(loggedInName);
    setSelectedDesignerId(loggedInId);
    setStatus('Pending');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: ContentCalendarItem) => {
    setEditingItem(item);
    setBrandName(item.brandName);
    setSelectedBrandId(typeof item.brandId === 'object' ? item.brandId?._id : item.brandId || '');
    setPostDate(item.postDate ? item.postDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setTypeOfPost(item.typeOfPost);
    const existingP = item.platform ? item.platform.split(',').map(p => p.trim()).filter(Boolean) : ['Instagram'];
    setSelectedPlatforms(existingP.length > 0 ? existingP : ['Instagram']);
    setReferenceLink(item.referenceLink || '');
    setMediaLink(item.mediaLink || '');
    setAssignedDesignerName(item.assignedDesignerName || '');
    setSelectedDesignerId(typeof item.assignedDesignerId === 'object' ? item.assignedDesignerId?._id : item.assignedDesignerId || '');
    setStatus(item.status);
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPlan(true);
    try {
      const bObj = brands.find(b => b._id === selectedBrandId);
      const finalBName = bObj ? bObj.brandName : (brandName || selectedBrandFilter);

      const empObj = employees.find(e => e._id === assignedDesignerId);
      const finalDesignerName = empObj ? empObj.name : assignedDesignerName;

      const payload = {
        brandId: selectedBrandId || undefined,
        brandName: finalBName,
        postDate,
        typeOfPost,
        platform: selectedPlatforms.join(', '),
        referenceLink,
        mediaLink,
        assignedDesignerId: assignedDesignerId || undefined,
        assignedDesignerName: finalDesignerName,
        status,
        notes
      };

      let res;
      if (editingItem) {
        res = await api.put(`/content-calendar/${editingItem._id}`, payload);
      } else {
        res = await api.post('/content-calendar', payload);
      }

      if (res.success) {
        setShowModal(false);
        setEditingItem(null);

        // Parse entry date to switch filter to match the saved post
        const entryDate = new Date(postDate);
        const postMonth = entryDate.getMonth() + 1; // 1-indexed month
        const postYear = entryDate.getFullYear();

        setSelectedBrandFilter(finalBName);
        setCurrentMonth(postMonth);
        setCurrentYear(postYear);

        // Fetch calendar entries for the saved post's brand, month, and year
        fetchCalendarEntries(finalBName, postMonth, postYear);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save entry');
    } finally {
      setSubmittingPlan(false);
    }
  };

  // Delete Confirmation Panel State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemName?: string;
    loading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    loading: false,
    onConfirm: async () => {}
  });

  const requestDelete = (item: ContentCalendarItem) => {
    setDeleteModalState({
      isOpen: true,
      itemName: `${item.brandName || 'Brand'} — ${item.typeOfPost || 'Post'} (${new Date(item.postDate).toLocaleDateString()})`,
      loading: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, loading: true }));
        try {
          const res = await api.delete(`/content-calendar/${item._id}`);
          if (res.success) {
            setDeleteModalState(prev => ({ ...prev, isOpen: false }));
            fetchCalendarEntries();
          }
        } catch (err: any) {
          alert(err.message || 'Failed to delete entry');
        } finally {
          setDeleteModalState(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleInlineStatusChange = async (id: string, newStatus?: any, extraFields?: Record<string, any>) => {
    const updatePayload = extraFields ? extraFields : { status: newStatus };
    setItems(prev => prev.map(i => i._id === id ? { ...i, ...updatePayload } : i));
    try {
      await api.put(`/content-calendar/${id}`, updatePayload);
    } catch (err) {
      console.error(err);
      fetchCalendarEntries();
    }
  };

  // Unique brand list (from assigned brands API response)
  const uniqueBrands: string[] = Array.from(new Set([
    ...brands.map(b => b.brandName),
    ...(items.map(i => i.brandName))
  ].filter((b): b is string => Boolean(b)))).sort();

  const uniqueDesigners: string[] = Array.from(new Set([
    ...employees.map(e => e.name),
    ...items.map(i => i.assignedDesignerName)
  ].filter((d): d is string => Boolean(d))));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header with Integrated Brand Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Content Calendar</h2>

              {/* Searchable Brand Selection Dropdown with Search Bar */}
              <SearchableBrandDropdown
                brands={uniqueBrands}
                selectedBrand={selectedBrandFilter}
                onSelect={(b) => setSelectedBrandFilter(b)}
              />
            </div>

            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Dedicated day-wise social media content planning, reference links, POC assignments, and media assets for <strong className="text-purple-700 font-extrabold">{selectedBrandFilter}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Create New Calendar Cycle Button */}
          <button
            onClick={openCreateNewCalendarModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            title="Create a new 15-day / monthly content calendar cycle"
          >
            <CalendarIcon size={16} />
            <span>+ Create New Calendar</span>
          </button>

          {/* Share Calendar Button */}
          <button
            onClick={() => handleShareCalendar()}
            disabled={sharingLoading}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-xs transition hover:shadow-md cursor-pointer disabled:opacity-50"
            title="Share this content calendar with client"
          >
            <Share2 size={16} className="text-purple-600" />
            <span>{sharingLoading ? 'Sharing...' : 'Share Calendar'}</span>
          </button>

          {/* Add Post Button */}
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Post</span>
          </button>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Mode */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('Spreadsheet Grid')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'Spreadsheet Grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Grid size={14} /> Spreadsheet Grid
          </button>
          <button
            onClick={() => setViewMode('List View')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'List View' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <List size={14} /> List Table
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Month Popover Dropdown */}
          <CustomMonthDropdown
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSelectMonth={(m) => setCurrentMonth(m)}
          />

          {/* Custom Fortnight Popover Dropdown */}
          <CustomFortnightDropdown
            selectedFortnight={selectedFortnight}
            onSelectFortnight={(f) => setSelectedFortnight(f)}
          />

          {/* Custom POC Popover Dropdown — Show all for Managers/Admins, lock to logged in user for Members */}
          {isManagerOrAdmin ? (
            <CustomPocDropdown
              designers={uniqueDesigners}
              selectedDesigner={selectedDesignerFilter}
              onSelectDesigner={(d) => setSelectedDesignerFilter(d)}
            />
          ) : (
            <div className="bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200 text-purple-950 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <span className="text-[10px] text-purple-600 font-extrabold uppercase">POC:</span>
              <span>👤 {currentUser?.name || 'My Tasks'}</span>
            </div>
          )}

          {/* Delete All Calendar Entries Button */}
          <button
            onClick={() => {
              setTargetDeleteCycleId('All');
              setTargetDeleteCycleTitle('All Calendars for this Month');
              setShowClearAllModal(true);
            }}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer"
            title="Delete all calendar entries for this brand & period at once"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>Clear All Calendars</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET GRID OR LIST VIEW - SEPARATED BY CALENDAR CYCLE */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 font-medium shadow-xs">
          <Loader2 className="animate-spin inline-block mr-2 text-purple-600" size={20} />
          Loading content calendar...
        </div>
      ) : groupedCycles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-500 font-semibold shadow-xs space-y-2">
          <CalendarIcon size={32} className="mx-auto text-purple-400 mb-2" />
          <p className="text-sm text-slate-700 font-extrabold">No Content Calendar Created Yet</p>
          <p className="text-xs text-slate-500">Click <strong className="text-purple-700">+ Create New Calendar</strong> above to generate a calendar cycle.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* List View Single Calendar Switcher Bar */}
          {viewMode === 'List View' && groupedCycles.length > 1 && (
            <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-700 uppercase shrink-0">Select Calendar:</span>
                <CustomCalendarCycleDropdown
                  cycles={groupedCycles.map(cg => ({ cycleId: cg.cycleId, cycleTitle: cg.cycleTitle, count: cg.items.length }))}
                  selectedIndex={Math.min(activeListCycleIndex, groupedCycles.length - 1)}
                  onSelect={(idx) => setActiveListCycleIndex(idx)}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  disabled={activeListCycleIndex <= 0}
                  onClick={() => setActiveListCycleIndex(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl transition font-extrabold cursor-pointer border border-slate-200"
                >
                  ◀ Prev
                </button>
                <span className="px-2 font-black text-purple-900">
                  Calendar {Math.min(activeListCycleIndex + 1, groupedCycles.length)} of {groupedCycles.length}
                </span>
                <button
                  type="button"
                  disabled={activeListCycleIndex >= groupedCycles.length - 1}
                  onClick={() => setActiveListCycleIndex(prev => Math.min(groupedCycles.length - 1, prev + 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl transition font-extrabold cursor-pointer border border-slate-200"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}

          {(viewMode === 'List View'
            ? [groupedCycles[Math.min(activeListCycleIndex, groupedCycles.length - 1)] || groupedCycles[0]]
            : groupedCycles
          ).map((cycleGroup, cycleIndex) => {
            const actualIndex = viewMode === 'List View' ? Math.min(activeListCycleIndex, groupedCycles.length - 1) : cycleIndex;
            return (
            <div key={cycleGroup.cycleId} className="bg-white rounded-2xl border border-purple-200 shadow-md overflow-hidden transition-all">
              {/* Cycle Card Header Banner */}
              <div className="bg-gradient-to-r from-purple-50/90 via-pink-50/70 to-indigo-50/90 text-slate-800 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 border-b border-purple-200/80 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    #{actualIndex + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>🗓️ {cycleGroup.cycleTitle}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-extrabold border border-purple-200 shadow-2xs">
                        {cycleGroup.items.length} Posts
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold">
                      Brand: <strong className="text-purple-700">{selectedBrandFilter}</strong> &bull; Calendar Cycle #{actualIndex + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleShareCalendar(cycleGroup.cycleId)}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Share This Calendar</span>
                  </button>

                  <button
                    onClick={() => {
                      setTargetDeleteCycleId(cycleGroup.cycleId);
                      setTargetDeleteCycleTitle(cycleGroup.cycleTitle);
                      setShowClearAllModal(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Clear This Calendar</span>
                  </button>
                </div>
              </div>

              {/* Cycle Content View */}
              {viewMode === 'Spreadsheet Grid' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {/* Row 1: Day Header */}
                      <tr className="bg-pink-200 text-slate-900 font-black text-sm">
                        <td className="p-3 bg-pink-300 border-b border-r-2 border-pink-400 font-black w-40 sticky left-0 z-20 text-slate-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Day
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-3 text-center border-b border-r border-pink-300 min-w-[170px] font-black text-pink-950">
                            {item.dayOfWeek || new Date(item.postDate).toLocaleDateString('en-US', { weekday: 'long' })}
                          </td>
                        ))}
                      </tr>

                      {/* Row 2: Date */}
                      <tr className="bg-pink-100 text-slate-900 font-extrabold">
                        <td className="p-3 bg-pink-200 border-b border-r-2 border-pink-300 font-extrabold w-40 sticky left-0 z-20 text-slate-900 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Date
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-3 text-center border-b border-r border-pink-200 font-extrabold text-slate-900 font-mono">
                            {new Date(item.postDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                        ))}
                      </tr>

                      {/* Row 3: Type of Post */}
                      <tr className="bg-white">
                        <td className="p-3 bg-pink-100 border-b border-r-2 border-pink-200 font-extrabold text-slate-800 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Type of Post
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-1 text-center border-b border-r border-slate-200 font-bold text-purple-700 bg-purple-50/20">
                            <input
                              type="text"
                              defaultValue={item.typeOfPost}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== item.typeOfPost) {
                                  handleInlineStatusChange(item._id, undefined, { typeOfPost: val });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              className="w-full bg-transparent border-0 text-center font-extrabold text-purple-800 text-xs focus:outline-none focus:ring-0 focus:border-none cursor-text px-2 py-1"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 4: Platform */}
                      <tr className="bg-slate-50/50">
                        <td className="p-3 bg-pink-100 border-b border-r-2 border-pink-200 font-extrabold text-slate-800 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Platform
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-1 text-center border-b border-r border-slate-200 font-extrabold text-slate-800">
                            <input
                              type="text"
                              defaultValue={item.platform || 'Instagram'}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && val !== item.platform) {
                                  handleInlineStatusChange(item._id, undefined, { platform: val });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              className="w-full bg-transparent border-0 text-center font-extrabold text-purple-900 text-xs focus:outline-none focus:ring-0 focus:border-none cursor-text px-2 py-1"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 5: Reference Link */}
                      <tr className="bg-white">
                        <td className="p-3 bg-pink-100 border-b border-r-2 border-pink-200 font-extrabold text-slate-800 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Reference Link
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-1 text-center border-b border-r border-slate-200">
                            {editingRefLinkId === item._id || !item.referenceLink ? (
                              <div className="flex items-center justify-center gap-1 px-1">
                                <input
                                  type="text"
                                  autoFocus={editingRefLinkId === item._id}
                                  defaultValue={item.referenceLink || ''}
                                  placeholder="Paste link & press Enter..."
                                  onBlur={(e) => {
                                    setEditingRefLinkId(null);
                                    const val = e.target.value.trim();
                                    if (val !== (item.referenceLink || '')) {
                                      handleInlineStatusChange(item._id, undefined, { referenceLink: val });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  }}
                                  className="w-full bg-white border border-blue-300 rounded-md text-blue-600 font-medium text-[11px] placeholder:text-slate-400 focus:outline-none text-center truncate py-0.5 px-1 shadow-2xs"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 group py-1 px-1">
                                <a
                                  href={item.referenceLink.startsWith('http') ? item.referenceLink : `https://${item.referenceLink}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-[11px] inline-flex items-center gap-1 truncate max-w-[140px]"
                                  title={item.referenceLink}
                                >
                                  <span className="truncate">{item.referenceLink}</span>
                                  <ExternalLink size={11} className="shrink-0 text-blue-500" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setEditingRefLinkId(item._id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 p-0.5 rounded transition cursor-pointer shrink-0"
                                  title="Edit Link"
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Row 6: Video/Image Link */}
                      <tr className="bg-slate-50/50">
                        <td className="p-3 bg-pink-100 border-b border-r-2 border-pink-200 font-extrabold text-slate-800 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Video/Image Link
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-1 text-center border-b border-r border-slate-200">
                            {editingMediaLinkId === item._id || !item.mediaLink ? (
                              <div className="flex items-center justify-center gap-1 px-1">
                                <input
                                  type="text"
                                  autoFocus={editingMediaLinkId === item._id}
                                  defaultValue={item.mediaLink || ''}
                                  placeholder="Paste media link..."
                                  onBlur={(e) => {
                                    setEditingMediaLinkId(null);
                                    const val = e.target.value.trim();
                                    if (val !== (item.mediaLink || '')) {
                                      handleInlineStatusChange(item._id, undefined, { mediaLink: val });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  }}
                                  className="w-full bg-white border border-purple-300 rounded-md text-purple-700 font-bold text-[11px] placeholder:text-slate-400 focus:outline-none text-center truncate py-0.5 px-1 shadow-2xs"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 group py-1 px-1">
                                <a
                                  href={item.mediaLink.startsWith('http') ? item.mediaLink : `https://${item.mediaLink}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-700 hover:text-purple-900 hover:underline font-bold text-[11px] inline-flex items-center gap-1 truncate max-w-[140px]"
                                  title={item.mediaLink}
                                >
                                  <Video size={11} className="shrink-0 text-purple-600" />
                                  <span className="truncate">{item.mediaLink}</span>
                                  <ExternalLink size={11} className="shrink-0 text-purple-400" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setEditingMediaLinkId(item._id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 p-0.5 rounded transition cursor-pointer shrink-0"
                                  title="Edit Media Link"
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Row 7: Assigned POC */}
                      <tr className="bg-white">
                        <td className="p-3 bg-pink-100 border-b border-r-2 border-pink-200 font-extrabold text-slate-800 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Assigned POC
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-1 text-center border-b border-r border-slate-200 font-bold text-slate-800">
                            {isManagerOrAdmin ? (
                              <select
                                value={item.assignedDesignerId || ''}
                                onChange={(e) => {
                                  const empId = e.target.value;
                                  const emp = employees.find(eItem => eItem._id === empId);
                                  handleInlineStatusChange(item._id, undefined, {
                                    assignedDesignerId: empId || undefined,
                                    assignedDesignerName: emp ? emp.name : ''
                                  });
                                }}
                                className="w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-purple-400 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer text-center"
                              >
                                <option value="">-- Select POC --</option>
                                {employees.map(emp => (
                                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1 border border-slate-200">
                                <User size={12} className="text-purple-600" /> {item.assignedDesignerName || currentUser?.name || 'POC'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Row 8: Status & Actions */}
                      <tr className="bg-slate-100/50">
                        <td className="p-3 bg-pink-200 border-b border-r-2 border-pink-300 font-black text-slate-900 w-40 sticky left-0 z-20 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          Status & Edit
                        </td>
                        {cycleGroup.items.map((item) => (
                          <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative inline-flex items-center">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleInlineStatusChange(item._id, e.target.value)}
                                  className={`appearance-none pr-6 pl-3 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-xs hover:shadow-md hover:scale-105 transition-all ${
                                    item.status === 'Published'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                      : item.status === 'Approved'
                                      ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                                      : item.status === 'Pending'
                                      ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                                      : 'bg-slate-100 text-slate-900 border-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Published">Published</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 pointer-events-none text-slate-700 font-black" />
                              </div>

                              <div className="flex items-center space-x-1">
                                <button onClick={() => openEditModal(item)} className="p-1 hover:bg-purple-100 text-purple-600 rounded" title="Edit entry">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => requestDelete(item)} className="p-1 hover:bg-rose-100 text-rose-600 rounded" title="Delete entry">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* LIST VIEW TABLE */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-800 text-white font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 border-b border-r border-slate-700 min-w-[100px]">Date</th>
                        <th className="p-3 border-b border-r border-slate-700 min-w-[90px]">Day</th>
                        <th className="p-4 border-b border-r border-slate-700 min-w-[120px]">Brand</th>
                        <th className="p-4 border-b border-r border-slate-700 min-w-[150px]">Type of Post</th>
                        <th className="p-3 border-b border-r border-slate-700 min-w-[100px]">Platform</th>
                        <th className="p-4 border-b border-r border-slate-700 min-w-[180px]">Reference Link</th>
                        <th className="p-3 border-b border-r border-slate-700 min-w-[120px]">POC</th>
                        <th className="p-3 border-b border-r border-slate-700 min-w-[110px]">Status</th>
                        <th className="p-3 border-b border-slate-700 text-right min-w-[70px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cycleGroup.items.map((item) => (
                        <tr key={item._id} className="hover:bg-pink-50/30 transition">
                          <td className="p-3 font-mono font-bold text-slate-800 border-r border-slate-200">
                            {new Date(item.postDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3 font-bold text-slate-600 border-r border-slate-200">
                            {item.dayOfWeek}
                          </td>
                          <td className="p-4 font-black text-pink-700 border-r border-slate-200">
                            {item.brandName}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 border-r border-slate-200">
                            {item.typeOfPost}
                          </td>
                          <td className="p-3 border-r border-slate-200 font-bold text-slate-700">
                            {item.platform || 'Instagram'}
                          </td>
                          <td className="p-4 border-r border-slate-200">
                            {item.referenceLink ? (
                              <a href={item.referenceLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold flex items-center gap-1 truncate max-w-[160px]">
                                <Link2 size={12} /> Reference
                              </a>
                            ) : '—'}
                          </td>
                          <td className="p-3 font-bold text-slate-800 border-r border-slate-200">
                            {item.assignedDesignerName || '—'}
                          </td>
                          <td className="p-3 border-r border-slate-200">
                            <div className="relative inline-flex items-center">
                              <select
                                value={item.status}
                                onChange={(e) => handleInlineStatusChange(item._id, e.target.value)}
                                className={`appearance-none pr-6 pl-3 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-xs hover:shadow-md hover:scale-105 transition-all ${
                                  item.status === 'Published'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                    : item.status === 'Approved'
                                    ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                                    : item.status === 'Pending'
                                    ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-900 border-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Published">Published</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 pointer-events-none text-slate-700 font-black" />
                            </div>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button onClick={() => openEditModal(item)} className="p-1 hover:bg-purple-100 text-purple-600 rounded">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => requestDelete(item)} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* Modal: Add / Edit Content Entry */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Content Entry' : 'Add New Content Calendar Entry'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-200 space-y-3">
            <h4 className="font-extrabold text-pink-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> Content Calendar Entry Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Brand</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => {
                    setSelectedBrandId(e.target.value);
                    const b = brands.find(brand => brand._id === e.target.value);
                    if (b) setBrandName(b.brandName);
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.brandName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Post Date</label>
                <input
                  type="date"
                  required
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Type of Post</label>
                <input
                  type="text"
                  required
                  value={typeOfPost}
                  onChange={(e) => setTypeOfPost(e.target.value)}
                  placeholder="e.g. Intro Post, Founders video, BTS..."
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Platform (Multi-Select)</label>
                <CustomMultiSelectPlatformDropdown
                  selectedPlatforms={selectedPlatforms}
                  onChange={(next) => setSelectedPlatforms(next)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Reference Link (Instagram URL)</label>
              <input
                type="url"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Video / Image Asset Link</label>
              <input
                type="url"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Assigned POC (Member)</label>
                {isManagerOrAdmin ? (
                  <CustomModalSelect
                    value={assignedDesignerId || ''}
                    onChange={(val) => {
                      setSelectedDesignerId(val);
                      const emp = employees.find(employee => employee._id === val);
                      if (emp) setAssignedDesignerName(emp.name);
                    }}
                    options={[
                      { value: '', label: '-- Select POC --' },
                      ...employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.designation || 'POC'})`, icon: '👤' }))
                    ]}
                  />
                ) : (
                  <CustomModalSelect
                    disabled
                    value={assignedDesignerId || ''}
                    onChange={() => {}}
                    options={[{ value: assignedDesignerId || '', label: assignedDesignerName || currentUser?.name || 'Logged In User', icon: '👤' }]}
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Status</label>
                <CustomModalSelect
                  value={status}
                  onChange={(val) => setStatus(val)}
                  options={[
                    { value: 'Draft', label: 'Draft', icon: '📝' },
                    { value: 'Pending', label: 'Pending', icon: '⏳' },
                    { value: 'Approved', label: 'Approved', icon: '✅' },
                    { value: 'Published', label: 'Published', icon: '🚀' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Notes / Caption</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter caption ideas, tags, or notes..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl p-2.5 font-medium resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPlan}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingPlan ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{editingItem ? 'Saving...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{editingItem ? 'Update Entry' : 'Save Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Calendar Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Content Calendar with Client"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-xs font-medium text-slate-700">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
              <Share2 size={18} className="text-purple-600" />
              <span>Public Client Link Generated!</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Anyone with this link can view a clean, read-only version of the <strong className="text-purple-800 font-extrabold">{selectedBrandFilter}</strong> content calendar for month ({currentMonth}/{currentYear}). No login required!
            </p>
          </div>

          {/* Calendar Selector for Sharing Particular Calendar */}
          {groupedCycles.length > 1 && (
            <div className="space-y-1">
              <label className="block text-slate-800 font-extrabold text-xs uppercase">Select Calendar to Share</label>
              <CustomModalSelect
                value={selectedShareCycleId}
                onChange={(val) => handleShareCalendar(val)}
                options={[
                  { value: 'All', label: '📌 All Calendars Combined', icon: '✨' },
                  ...groupedCycles.map((cg, idx) => ({
                    value: cg.cycleId,
                    label: `#${idx + 1} ${cg.cycleTitle}`,
                    icon: '🗓️'
                  }))
                ]}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-slate-800 font-extrabold text-xs uppercase">Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shrink-0 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Instant Channels: WhatsApp & Email */}
          <div className="space-y-3 pt-2">
            <label className="block text-slate-800 font-extrabold text-xs uppercase">Direct Share Channels</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl font-bold flex items-center justify-start gap-3 transition shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                  <MessageSquare size={17} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-emerald-950">Share via WhatsApp</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Send link & message</p>
                </div>
              </button>

              {/* Gmail / Web Mail Button */}
              <button
                onClick={handleShareGmail}
                className="p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-950 rounded-2xl font-bold flex items-center justify-start gap-3 transition shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                  <Mail size={17} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-rose-950">Share via Email</p>
                  <p className="text-[10px] text-rose-700 font-semibold">Open Gmail composer</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-purple-700 hover:text-purple-900 font-extrabold text-xs flex items-center gap-1 hover:underline"
            >
              <ExternalLink size={13} /> Test Client View in New Tab
            </a>

            <button
              onClick={() => setShowShareModal(false)}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Bulk Delete / Clear All Calendar Entries */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear Entire Content Calendar"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs font-medium text-slate-700">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2 text-rose-950">
            <div className="flex items-center gap-2 font-black text-sm text-rose-800">
              <Trash2 size={18} className="text-rose-600 shrink-0" />
              <span>Are you sure you want to clear {targetDeleteCycleTitle ? `"${targetDeleteCycleTitle}"` : 'this calendar'}?</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-semibold">
              This will permanently delete entries for <strong className="font-extrabold text-rose-950">{selectedBrandFilter}</strong> ({targetDeleteCycleTitle || (selectedFortnight === 'All' ? 'Full Month' : selectedFortnight)}, Month {currentMonth}/{currentYear}).
            </p>
            <p className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">⚠️ Action cannot be undone!</p>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowClearAllModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAllCalendar}
              disabled={clearingLoading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Trash2 size={14} />
              <span>{clearingLoading ? 'Deleting Entries...' : 'Yes, Delete All Entries'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create New Content Calendar Cycle */}
      <Modal
        isOpen={showCreateNewCalendarModal}
        onClose={() => setShowCreateNewCalendarModal(false)}
        title="Create New Content Calendar"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateNewCalendarSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 rounded-2xl border border-purple-200 space-y-4">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
              <Sparkles size={18} className="text-purple-600" />
              <span>Full Month Calendar Setup</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium -mt-1">
              Creates a full month content calendar for the selected brand. Choose how many days to post.
            </p>

            {/* Calendar Title / Custom Name */}
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">
                Calendar Name / Title <span className="text-purple-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                placeholder="e.g. September Reels Campaign, Odd Days Reel Schedule..."
                className="w-full bg-white border border-purple-300 focus:border-purple-600 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none transition shadow-2xs placeholder:text-slate-400"
              />
            </div>

            {/* Row 1: Brand + Month */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Target Brand</label>
                <CustomModalSelect
                  value={newCalBrandName}
                  onChange={(val) => {
                    setNewCalBrandName(val);
                    const b = brands.find(brand => brand.brandName === val);
                    if (b) setNewCalBrandId(b._id);
                  }}
                  options={uniqueBrands.map(bName => ({ value: bName, label: bName, icon: '🏢' }))}
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Target Month</label>
                <CustomModalSelect
                  value={newCalMonth}
                  onChange={(val) => { setNewCalMonth(Number(val)); setNewCalCustomDays([]); }}
                  options={[
                    { value: 7, label: 'July 2026', icon: '📅' },
                    { value: 8, label: 'August 2026', icon: '📅' },
                    { value: 9, label: 'September 2026', icon: '📅' },
                    { value: 10, label: 'October 2026', icon: '📅' },
                    { value: 11, label: 'November 2026', icon: '📅' },
                    { value: 12, label: 'December 2026', icon: '📅' },
                  ]}
                />
              </div>
            </div>

            {/* Row 2: Assigned POC + Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Assigned POC</label>
                {isManagerOrAdmin ? (
                  <CustomModalSelect
                    value={assignedDesignerName || uniqueDesigners[0] || ''}
                    onChange={(val) => {
                      setAssignedDesignerName(val);
                      const emp = employees.find(empItem => empItem.name === val);
                      if (emp) setNewCalDesignerId(emp._id);
                    }}
                    options={uniqueDesigners.map(dName => ({ value: dName, label: dName, icon: '👤' }))}
                  />
                ) : (
                  <CustomModalSelect
                    disabled
                    value={currentUser?.name || assignedDesignerName || 'Current User'}
                    onChange={() => {}}
                    options={[{ value: currentUser?.name || assignedDesignerName || 'Current User', label: currentUser?.name || assignedDesignerName || 'Current User', icon: '👤' }]}
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Platform (Multi-Select)</label>
                <CustomMultiSelectPlatformDropdown
                  selectedPlatforms={newCalPlatforms}
                  onChange={(next) => setNewCalPlatforms(next)}
                />
              </div>
            </div>

            {/* Posting Frequency — pill toggle buttons */}
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-2">Posting Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'AllDays',  label: 'All Days',      icon: '⚡', desc: 'Every day' },
                  { value: 'OddDays',  label: 'Odd Days',      icon: '🗓️', desc: '1,3,5...' },
                  { value: 'EvenDays', label: 'Even Days',     icon: '🗓️', desc: '2,4,6...' },
                  { value: 'Custom',   label: 'Custom Dates',  icon: '🎯', desc: 'Pick days' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setNewCalFrequency(opt.value);
                      if (opt.value !== 'Custom') setNewCalCustomDays([]);
                    }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl border-2 font-extrabold text-[11px] transition ${
                      newCalFrequency === opt.value
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    <span className="text-base leading-none">{opt.icon}</span>
                    <span className="font-extrabold">{opt.label}</span>
                    <span className={`text-[9px] font-semibold ${ newCalFrequency === opt.value ? 'text-purple-200' : 'text-slate-400' }`}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Day Picker — shown only when 'Custom Dates' selected */}
            {newCalFrequency === 'Custom' && (() => {
              const daysInMonth = new Date(newCalYear, newCalMonth, 0).getDate();
              const dayRange = Array.from({ length: daysInMonth }, (_, i) => i + 1);

              const toggleDay = (d: number) => {
                setNewCalCustomDays(prev =>
                  prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)
                );
              };

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-extrabold uppercase text-[11px]">
                      🎯 Click days to post
                    </label>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {newCalCustomDays.length} / {daysInMonth} days
                    </span>
                  </div>

                  <div className="bg-white border border-purple-200 rounded-2xl p-3">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1.5">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-extrabold text-slate-400 uppercase">{d}</div>
                      ))}
                    </div>
                    {/* Day buttons */}
                    {(() => {
                      const firstDow = new Date(newCalYear, newCalMonth - 1, 1).getDay();
                      const slots: (number | null)[] = [...Array(firstDow).fill(null), ...dayRange];
                      while (slots.length % 7 !== 0) slots.push(null);
                      return (
                        <div className="grid grid-cols-7 gap-1">
                          {slots.map((d, idx) => {
                            if (d === null) return <div key={`e-${idx}`} />;
                            const sel = newCalCustomDays.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleDay(d)}
                                className={`w-full aspect-square rounded-lg text-[11px] font-extrabold transition ${
                                  sel
                                    ? 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quick-select chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => setNewCalCustomDays([...dayRange])}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition">Select All</button>
                    <button type="button" onClick={() => setNewCalCustomDays(dayRange.filter(d => d % 2 !== 0))}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition">Odd Days</button>
                    <button type="button" onClick={() => setNewCalCustomDays(dayRange.filter(d => d % 2 === 0))}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-pink-50 text-pink-700 border border-pink-200 rounded-lg hover:bg-pink-100 transition">Even Days</button>
                    <button type="button" onClick={() => setNewCalCustomDays([])}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100 transition">Clear</button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateNewCalendarModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingCycleLoading}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              {creatingCycleLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating Cycle...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Create Calendar Cycle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* REUSABLE DELETE CONFIRMATION MODAL PANEL */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
        title="Confirm Delete Calendar Entry"
        itemType="calendar entry"
        itemName={deleteModalState.itemName}
        loading={deleteModalState.loading}
      />
    </div>
  );
};
