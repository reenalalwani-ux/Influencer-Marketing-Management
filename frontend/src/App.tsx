import React, { useState, useEffect } from 'react';
import { User, TaskItem } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { EmployeeManagementView } from './views/EmployeeManagementView';
import { BrandManagementView } from './views/BrandManagementView';
import { EmployeeBrandAssignmentView } from './views/EmployeeBrandAssignmentView';
import { CampaignManagementView } from './views/CampaignManagementView';
import { TaskManagementView } from './views/TaskManagementView';
import { DailyPostingView } from './views/DailyPostingView';
import { PostingCalendarView } from './views/PostingCalendarView';
import { VerificationQueueView } from './views/VerificationQueueView';
import { EmployeePerformanceView } from './views/EmployeePerformanceView';
import { AuditLogView } from './views/AuditLogView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { URLSubmissionModal } from './components/URLSubmissionModal';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to read initial active view from browser URL hash
  const getViewFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'dashboard';
  };

  const [activeView, setActiveView] = useState<string>(getViewFromHash);
  const [submitUrlTask, setSubmitUrlTask] = useState<TaskItem | null>(null);

  // Custom view navigator that updates browser URL bar
  const handleNavigate = (view: string) => {
    setActiveView(view);
    window.location.hash = `#/${view}`;
  };

  // Sync state when browser back/forward buttons are clicked or URL changes directly
  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: User, token: string) => {
    setUser(userData);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.hash = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
        Loading application...
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-purple-500 selection:text-white">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={handleNavigate}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          activeView={activeView}
          setActiveView={handleNavigate}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeView === 'dashboard' && (
            <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
            />
          )}

          {activeView === 'employees' && <EmployeeManagementView />}
          {activeView === 'brands' && <BrandManagementView />}
          {activeView === 'employee-brands' && <EmployeeBrandAssignmentView />}
          {activeView === 'campaigns' && <CampaignManagementView />}
          {activeView === 'tasks' && (
            <TaskManagementView
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
            />
          )}

          {activeView === 'daily-posting' && (
            <DailyPostingView
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
            />
          )}

          {activeView === 'calendar' && <PostingCalendarView />}
          {activeView === 'verification' && <VerificationQueueView />}
          {activeView === 'performance' && <EmployeePerformanceView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'audit-logs' && <AuditLogView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* URL Submission Modal */}
      {submitUrlTask && (
        <URLSubmissionModal
          task={submitUrlTask}
          onClose={() => setSubmitUrlTask(null)}
          onSuccess={() => {
            // Trigger refresh or notification
          }}
        />
      )}
    </div>
  );
};
