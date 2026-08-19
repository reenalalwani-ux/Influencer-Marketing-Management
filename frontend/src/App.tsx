import React, { useState, useEffect, useRef } from 'react';
import { User, TaskItem } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TargetTopBanner } from './components/TargetTopBanner';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { TargetManagementView } from './views/TargetManagementView';
import { EmployeeManagementView } from './views/EmployeeManagementView';
import { BrandManagementView } from './views/BrandManagementView';
import { InfluencerManagementView } from './views/InfluencerManagementView';
import { EmployeeBrandAssignmentView } from './views/EmployeeBrandAssignmentView';
import { TaskManagementView } from './views/TaskManagementView';
import { DailyPostingView } from './views/DailyPostingView';
import { PostingCalendarView } from './views/PostingCalendarView';
import { ContentCalendarView } from './views/ContentCalendarView';
import { VerificationQueueView } from './views/VerificationQueueView';
import { EmployeePerformanceView } from './views/EmployeePerformanceView';
import { AuditLogView } from './views/AuditLogView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { URLSubmissionModal } from './components/URLSubmissionModal';

import { PublicCalendarShareView } from './views/PublicCalendarShareView';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetRefreshCount, setTargetRefreshCount] = useState(0);

  // Check if current hash is a public share route, e.g. #/share/token
  const getShareTokenFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/share/') || hash.startsWith('#share/')) {
      return hash.replace('#/share/', '').replace('#share/', '');
    }
    return null;
  };

  const [shareToken, setShareToken] = useState<string | null>(getShareTokenFromHash);

  // Helper to read initial active view from browser URL hash
  const getViewFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'dashboard';
  };

  const [activeView, setActiveView] = useState<string>(getViewFromHash);
  const [submitUrlTask, setSubmitUrlTask] = useState<TaskItem | null>(null);
  const [taskRefreshCount, setTaskRefreshCount] = useState(0);

  // Ref to DashboardView's local task updater — called on URL submit so dashboard card updates instantly
  const dashboardTaskUpdaterRef = useRef<((taskId: string, url: string) => void) | null>(null);

  // Custom view navigator that updates browser URL bar
  const handleNavigate = (view: string) => {
    setActiveView(view);
    window.location.hash = `#/${view}`;
    window.scrollTo(0, 0);
  };

  // Scroll to top whenever active view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  // Sync state when browser back/forward buttons are clicked or URL changes directly
  useEffect(() => {
    const handleHashChange = () => {
      setShareToken(getShareTokenFromHash());
      setActiveView(getViewFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If URL has a public share token, render public share view immediately (no login required)
  if (shareToken) {
    return <PublicCalendarShareView token={shareToken} />;
  }

  const checkAuth = async () => {
    // 6-second fallback timeout so application never hangs on slow cold starts
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 6000);

    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Session check:', err);
    } finally {
      clearTimeout(timeoutId);
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

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});  // Clears HttpOnly cookie server-side
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      window.location.hash = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col selection:bg-purple-500 selection:text-white">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={handleNavigate}
        onUpdateUser={(updatedUser) => setUser(updatedUser)}
      />

      {/* Target Module Top System Banner */}
      <TargetTopBanner
        user={user}
        onNavigateToTargets={() => handleNavigate('targets')}
        refreshTrigger={targetRefreshCount}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          activeView={activeView}
          setActiveView={handleNavigate}
        />

        <main className="flex-1 p-4 overflow-y-auto w-full">
          {activeView === 'dashboard' && (
          <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
              onRegisterTaskUpdater={(fn) => { dashboardTaskUpdaterRef.current = fn; }}
            />
          )}

          {activeView === 'targets' && (
            <InfluencerManagementView
              userRole={user.role}
              currentUser={user}
              initialTab="targets"
              onTargetUpdated={() => setTargetRefreshCount(prev => prev + 1)}
            />
          )}

          {activeView === 'employees' && <EmployeeManagementView />}
          {activeView === 'brands' && <BrandManagementView />}
          {activeView === 'influencers' && (
            <InfluencerManagementView
              userRole={user.role}
              currentUser={user}
              initialTab="paid"
              onTargetUpdated={() => setTargetRefreshCount(prev => prev + 1)}
            />
          )}
          {activeView === 'employee-brands' && (
            <EmployeeBrandAssignmentView userRole={user.role} currentUser={user} />
          )}
          {activeView === 'tasks' && (
            <TaskManagementView
              currentUser={user}
              refreshTrigger={taskRefreshCount}
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
            />
          )}

          {activeView === 'daily-posting' && (
            <DailyPostingView currentUser={user} refreshTrigger={taskRefreshCount} />
          )}

          {activeView === 'calendar' && <PostingCalendarView currentUser={user} />}
          {activeView === 'content-calendar' && <ContentCalendarView currentUser={user} />}
          {activeView === 'verification' && (
            <TaskManagementView
              currentUser={user}
              refreshTrigger={taskRefreshCount}
              onOpenSubmitUrlModal={(task) => setSubmitUrlTask(task)}
            />
          )}
          {activeView === 'performance' && <EmployeePerformanceView />}
          {activeView === 'reports' && <ReportsView userRole={user.role} currentUser={user} />}
          {activeView === 'audit-logs' && <AuditLogView />}
          {activeView === 'settings' && <SettingsView userRole={user.role} currentUser={user} />}
        </main>
      </div>

      {/* URL Submission Modal */}
      {submitUrlTask && (
        <URLSubmissionModal
          task={submitUrlTask}
          onClose={() => setSubmitUrlTask(null)}
          onSuccess={(taskId, submittedUrl) => {
            setTaskRefreshCount(prev => prev + 1);
            // Update dashboard task card instantly without full reload
            if (dashboardTaskUpdaterRef.current) {
              dashboardTaskUpdaterRef.current(taskId, submittedUrl);
            }
          }}
        />
      )}
    </div>
  );
};
