import React from 'react';
import {
  LayoutDashboard, Users, Briefcase, UserCheck, Calendar,
  CheckSquare, CheckCircle, BarChart3, FileSpreadsheet, ShieldAlert,
  Settings, Link2, Clock, Database, Target, Sparkles
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView }) => {
  const isEmployee = user?.role === 'Employee';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Target Module', icon: Target },
    ...(!isEmployee ? [{ id: 'employees', label: 'Employees', icon: Users }] : []),
    { id: 'brands', label: 'Brand Portfolio', icon: Briefcase },
    { id: 'influencers', label: 'Influencer Module', icon: Sparkles },
    { id: 'employee-brands', label: 'Brand Assignments', icon: UserCheck },
    { id: 'tasks', label: 'Tasks & Content', icon: CheckSquare },
    { id: 'daily-posting', label: 'Daily Posting', icon: Clock, badge: 'Core' },
    { id: 'calendar', label: 'Posting Calendar', icon: Calendar },
    { id: 'content-calendar', label: 'Content Calendar', icon: FileSpreadsheet },
    ...(!isEmployee ? [{ id: 'verification', label: 'Verification Queue', icon: CheckCircle }] : []),
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    ...(!isEmployee ? [{ id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white/90 border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4 space-y-1 backdrop-blur-xl">
      <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-purple-600">
        Navigation Menu
      </div>

      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                window.scrollTo(0, 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-500/25'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`shrink-0 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ml-1 ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-500 mt-auto border border-slate-200">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Influencer OPS v1.0
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Modular Architecture</p>
      </div>
    </aside>
  );
};
