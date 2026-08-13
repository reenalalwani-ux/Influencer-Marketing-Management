import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Briefcase, UserCheck, Calendar,
  CheckSquare, CheckCircle, BarChart3, FileSpreadsheet, ShieldAlert,
  Settings, Clock, Target, Sparkles, ChevronDown, ChevronRight, Layers
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  subItems: SubMenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView }) => {
  const isEmployee = user?.role === 'Employee';

  // Grouped Menu Definitions
  const menuGroups: MenuGroup[] = [
    {
      id: 'targets-collab',
      label: 'Targets & Revenue',
      icon: Target,
      subItems: [
        { id: 'targets', label: 'Target Module', icon: Target },
        { id: 'influencers', label: 'Influencer Module', icon: Sparkles },
      ]
    },
    {
      id: 'brand-management',
      label: 'Brand',
      icon: Briefcase,
      subItems: [
        { id: 'brands', label: 'Brand Portfolio', icon: Briefcase },
        { id: 'employee-brands', label: 'Brand Assignments', icon: UserCheck },
      ]
    },
    {
      id: 'content-tasks',
      label: 'Tasks & Postings',
      icon: CheckSquare,
      subItems: [
        { id: 'tasks', label: 'Tasks & Content', icon: CheckSquare },
        { id: 'daily-posting', label: 'Daily Posting', icon: Clock, badge: 'Core' },
        { id: 'calendar', label: 'Posting Calendar', icon: Calendar },
        { id: 'content-calendar', label: 'Content Calendar', icon: FileSpreadsheet },
      ]
    },
    {
      id: 'team-performance',
      label: 'Team & Performance',
      icon: Users,
      subItems: [
        ...(!isEmployee ? [{ id: 'employees', label: 'Employees Directory', icon: Users }] : []),
        { id: 'performance', label: 'Performance', icon: BarChart3 },
      ]
    },
    {
      id: 'system-reports',
      label: 'Reports & Settings',
      icon: Settings,
      subItems: [
        { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
        ...(!isEmployee ? [{ id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert }] : []),
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  // Track expanded groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuGroups.forEach(group => {
      if (group.subItems.some(sub => sub.id === activeView)) {
        initialState[group.id] = true;
      }
    });
    return initialState;
  });

  // Auto-expand parent group when activeView changes
  useEffect(() => {
    menuGroups.forEach(group => {
      if (group.subItems.some(sub => sub.id === activeView)) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [activeView]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <aside className="w-64 bg-white/90 border-r border-slate-200/80 flex flex-col shrink-0 h-full p-4 space-y-1 backdrop-blur-xl overflow-y-auto">
      <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-widest text-purple-600 flex items-center gap-1.5">
        <Layers size={13} /> Navigation
      </div>

      <nav className="space-y-2 flex-1">
        {/* Single Standalone Item: Dashboard */}
        <button
          onClick={() => {
            setActiveView('dashboard');
            window.scrollTo(0, 0);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            activeView === 'dashboard'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50/60 border border-transparent'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <LayoutDashboard size={18} className={`shrink-0 ${activeView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap truncate">Dashboard</span>
          </div>
        </button>

        {/* Grouped Accordion Parent Modules */}
        {menuGroups.map((group) => {
          // If all subItems in this group are hidden for the user, skip rendering group
          if (group.subItems.length === 0) return null;

          const GroupIcon = group.icon;
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.subItems.some(sub => sub.id === activeView);

          return (
            <div key={group.id} className="rounded-xl overflow-hidden border border-slate-100/80 bg-slate-50/40">
              {/* Group Header Button */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-150 ${
                  hasActiveChild
                    ? 'text-purple-900 bg-purple-100/60 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <GroupIcon size={16} className={hasActiveChild ? 'text-purple-600' : 'text-slate-400'} />
                  <span className="truncate">{group.label}</span>
                </div>
                {isOpen ? (
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                )}
              </button>

              {/* Sub-Modules List */}
              {isOpen && (
                <div className="py-1 px-1.5 space-y-1 bg-white/70">
                  {group.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeView === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveView(sub.id);
                          window.scrollTo(0, 0);
                        }}
                        className={`w-full flex items-center justify-between pl-4 pr-3 py-2 rounded-lg font-semibold text-xs transition-all duration-150 ${
                          isSubActive
                            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-sm shadow-purple-500/20 font-bold'
                            : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <SubIcon size={15} className={`shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {sub.badge && (
                          <span
                            className={`shrink-0 text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ml-1 ${
                              isSubActive
                                ? 'bg-white/20 text-white border border-white/30'
                                : 'bg-purple-100 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-500 mt-auto border border-slate-200">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Influencer OPS v1.0
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Modular Navigation</p>
      </div>
    </aside>
  );
};

