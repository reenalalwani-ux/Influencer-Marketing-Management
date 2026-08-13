import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, Target, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ExternalLink, Calendar, Send, ShieldCheck,
  BarChart3, Trophy, Medal, TrendingUp, Award
} from 'lucide-react';
import { api } from '../services/api';
import { User, TaskItem, EmployeePerformanceData } from '../types';
import { Pagination } from '../components/Pagination';
import { PageLoader } from '../components/PageLoader';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenSubmitUrlModal: (task: TaskItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate, onOpenSubmitUrlModal }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState<EmployeePerformanceData[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const itemsPerPage = 3;

  const fetchDashboardStats = async () => {
    try {
      const [dashRes, perfRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/performance'),
      ]);
      if (dashRes.success) setData(dashRes.data);
      if (perfRes.success) setPerfData(perfRes.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) return <PageLoader message="Loading dashboard metrics..." />;

  const isEmployee = user?.role === 'Employee';

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('brands')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>My Brands</span>
              <Briefcase size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.myBrands?.length || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active assigned brands</p>
          </div>

          <div
            onClick={() => onNavigate('targets')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Target</span>
              <Target size={18} className="text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 truncate">
              {data?.activeTarget ? `${data.activeTarget.currency || '$'}${Number(data.activeTarget.targetAmount).toLocaleString()}` : '$0'}
            </div>
            <p className="text-xs text-purple-600 font-bold mt-1 truncate">
              {data?.activeTarget
                ? `${Math.round(((data.activeTarget.achievedAmount || 0) / (data.activeTarget.targetAmount || 1)) * 100)}% Achieved`
                : 'No target set'}
            </p>
          </div>

          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Today Completed</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {data?.todaySummary?.completed || 0} / {data?.todaySummary?.total || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Tasks verified or submitted</p>
          </div>

          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Employees</span>
              <Users size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.totalEmployees || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Company internal staff</p>
          </div>

          <div
            onClick={() => onNavigate('brands')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Total Brands</span>
              <Briefcase size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{data?.totalBrands || 0}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">Active handled brands</p>
          </div>

          <div
            onClick={() => onNavigate('targets')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Target</span>
              <Target size={18} className="text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 truncate">
              {data?.activeTarget ? `${data.activeTarget.currency || '$'}${Number(data.activeTarget.targetAmount).toLocaleString()}` : '$0'}
            </div>
            <p className="text-xs text-purple-600 font-bold mt-1 truncate">
              {data?.activeTarget
                ? `${Math.round(((data.activeTarget.achievedAmount || 0) / (data.activeTarget.targetAmount || 1)) * 100)}% Achieved (${data.activeTarget.currency || '$'}${Number(data.activeTarget.achievedAmount).toLocaleString()})`
                : 'Click to set target'}
            </p>
          </div>

          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-sm transition"
          >
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Today's Schedule Table */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
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

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {(!data?.todaysTasks || data.todaysTasks.length === 0) ? (
              <div className="text-center py-8 text-slate-500 font-medium text-sm">
                No postings scheduled for today.
              </div>
            ) : (
              (data.todaysTasks || []).map((t: TaskItem) => (
                <div
                  key={t._id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-purple-200 transition"
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

          {/* Quick Stats Strip */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-base font-extrabold text-emerald-600">{data?.todaySummary?.completed || 0}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-500">Verified</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-base font-extrabold text-amber-600">{data?.todaySummary?.pending || 0}</div>
              <div className="text-[10px] uppercase font-bold text-amber-500">Pending</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-base font-extrabold text-slate-700">{data?.todaySummary?.total || 0}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-3">
          {isEmployee ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-900 mb-3">My Assigned Brands</h3>
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                Recent System Activity
              </h3>
              <div className="space-y-2.5">
                {(data?.recentAuditLogs || []).slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage).map((log: any) => (
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

              <Pagination
                currentPage={logPage}
                totalPages={Math.ceil((data?.recentAuditLogs?.length || 0) / itemsPerPage)}
                totalItems={data?.recentAuditLogs?.length || 0}
                itemsPerPage={itemsPerPage}
                onPageChange={setLogPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Employee Performance Leaderboard — Admin/Manager only */}
      {!isEmployee && perfData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" />
              Employee Performance Leaderboard
            </h3>
            <button
              onClick={() => onNavigate('performance')}
              className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Bar Chart + Ranked List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: Visual Bar Chart */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-slate-500 mb-3">Completion Rate Chart</p>
              {[...perfData]
                .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate)
                .slice(0, 6)
                .map((item, idx) => {
                  const rate = item.metrics.completionRate;
                  const barColor =
                    rate >= 80 ? 'from-emerald-500 to-green-400' :
                    rate >= 50 ? 'from-purple-500 to-indigo-400' :
                    'from-amber-500 to-orange-400';
                  return (
                    <div key={item.employee.id} className="flex items-center gap-3">
                      <div className="w-5 text-xs font-extrabold text-slate-400 text-right shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="w-24 shrink-0">
                        <div className="font-bold text-slate-800 text-xs truncate">{item.employee.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">{item.employee.designation}</div>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(rate, 3)}%` }}
                        >
                          {rate >= 20 && (
                            <span className="text-[9px] font-extrabold text-white">{rate}%</span>
                          )}
                        </div>
                      </div>
                      {rate < 20 && (
                        <span className="text-[10px] font-extrabold text-slate-500 w-8">{rate}%</span>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Right: Ranked Leaderboard Table */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-3">Top Performers</p>
              <div className="space-y-2">
                {[...perfData]
                  .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate)
                  .slice(0, 6)
                  .map((item, idx) => {
                    const rate = item.metrics.completionRate;
                    const onTime = item.metrics.onTimeRate;
                    const score = Math.round((rate * 0.7) + (onTime * 0.3));

                    const medalEl =
                      idx === 0 ? <Trophy size={14} className="text-yellow-500" /> :
                      idx === 1 ? <Medal size={14} className="text-slate-400" /> :
                      idx === 2 ? <Award size={14} className="text-amber-600" /> :
                      <span className="text-[10px] font-extrabold text-slate-400 w-3.5 text-center">#{idx + 1}</span>;

                    const scoreBadge =
                      score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      score >= 50 ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      'bg-amber-100 text-amber-700 border-amber-200';

                    return (
                      <div
                        key={item.employee.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                          idx === 0
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-5">{medalEl}</div>
                          <div
                            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-xs shadow"
                          >
                            {item.employee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.employee.name}</div>
                            <div className="text-[10px] text-slate-500">{item.metrics.completed}/{item.metrics.totalAssigned} tasks · {item.metrics.brandsManaged} brands</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-1">
                            <div className="text-[10px] text-slate-400 font-medium">On-time</div>
                            <div className="font-bold text-slate-700">{onTime}%</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border ${scoreBadge}`}>
                            {score} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-xl font-extrabold text-emerald-600">
                {perfData.length > 0 ? Math.round(perfData.reduce((s, d) => s + d.metrics.completionRate, 0) / perfData.length) : 0}%
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Avg Completion</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-purple-600">
                {perfData.reduce((s, d) => s + d.metrics.completed, 0)}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-amber-600">
                {perfData.reduce((s, d) => s + d.metrics.pending, 0)}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
