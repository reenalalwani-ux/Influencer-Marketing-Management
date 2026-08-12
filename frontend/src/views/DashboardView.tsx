import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, Flag, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ExternalLink, Calendar, Send, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { User, TaskItem } from '../types';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenSubmitUrlModal: (task: TaskItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate, onOpenSubmitUrlModal }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Loading dashboard metrics...
      </div>
    );
  }

  const isEmployee = user?.role === 'Employee';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome back, {user?.name}!</h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            {isEmployee ? "Here is your operational schedule and assigned content tasks for today." : "Real-time Operations & Team Performance Overview"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('daily-posting')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/20 flex items-center space-x-2"
          >
            <Clock size={16} />
            <span>Daily Posting View</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition border border-slate-700 flex items-center space-x-2"
          >
            <Calendar size={16} />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>My Brands</span>
              <Briefcase size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.myBrands?.length || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active assigned brands</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>My Campaigns</span>
              <Flag size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.myCampaigns?.length || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active campaign projects</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Today Completed</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {data?.todaySummary?.completed || 0} / {data?.todaySummary?.total || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Tasks verified or submitted</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Pending Submission</span>
              <Clock size={18} className="text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {data?.todaySummary?.pending || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Scheduled for today</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Employees</span>
              <Users size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.totalEmployees || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Company internal staff</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Total Brands</span>
              <Briefcase size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.totalBrands || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active handled brands</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Campaigns</span>
              <Flag size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.activeCampaigns || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Ongoing marketing campaigns</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Today Completion</span>
              <CheckCircle2 size={18} className="text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {data?.todaySummary?.completed || 0} / {data?.todaySummary?.total || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Daily postings status</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-purple-600" />
              Today's Posting Schedule
            </h3>
            <button
              onClick={() => onNavigate('daily-posting')}
              className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {(!data?.todaysTasks || data.todaysTasks.length === 0) ? (
              <div className="text-center py-8 text-slate-500 font-medium text-sm">
                No postings scheduled for today.
              </div>
            ) : (
              data.todaysTasks.map((t: TaskItem) => (
                <div
                  key={t._id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-purple-200 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        {t.platform} • {t.contentType}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {t.scheduledTime}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                    <div className="text-xs text-slate-600">
                      Brand: <span className="font-semibold text-slate-800">{t.brandId?.brandName || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.status === 'Verified' ? 'badge-verified' :
                        t.status === 'Submitted' ? 'badge-submitted' :
                          t.status === 'Pending' ? 'badge-pending' : 'badge-rejected'
                      }`}>
                      {t.status}
                    </span>

                    {t.status === 'Pending' && (
                      <button
                        onClick={() => onOpenSubmitUrlModal(t)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                      >
                        <Send size={12} />
                        <span>Submit URL</span>
                      </button>
                    )}

                    {t.publishedUrl && (
                      <a
                        href={t.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs transition border border-purple-200"
                        title="Open Published URL"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          {isEmployee ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">My Assigned Brands</h3>
              <div className="space-y-3">
                {data?.myBrands?.map((b: any) => (
                  <div key={b._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{b.brandId?.brandName}</div>
                      <div className="text-slate-500 mt-0.5">{b.brandId?.industry}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] badge-verified font-bold">
                      {b.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                Recent System Activity
              </h3>
              <div className="space-y-2.5">
                {data?.recentAuditLogs?.slice(0, 5).map((log: any) => (
                  <div key={log._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{log.userName}</span>
                      <span className="text-slate-500 text-[10px] font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1"><span className="text-purple-700 font-semibold">{log.action}</span> on <span className="font-semibold text-slate-800">{log.entity}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
