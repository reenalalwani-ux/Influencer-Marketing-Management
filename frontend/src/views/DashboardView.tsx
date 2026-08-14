import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, Target, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ExternalLink, Calendar, Send, ShieldCheck,
  BarChart3, Trophy, Medal, TrendingUp, Award, Sparkles, Plus,
  Layers, ChevronRight, CheckSquare, Star
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
  const [logPage, setLogPage] = useState(1);
  const itemsPerPage = 6;

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

  if (loading) return <PageLoader message="Loading operational dashboard..." />;

  const isEmployee = user?.role === 'Employee';

  // Helper for brand avatars
  const getBrandAvatar = (name: string) => {
    const parts = (name || 'Brand').split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name || 'BR').substring(0, 2).toUpperCase();
  };

  const getBrandBg = (idx: number) => {
    const colors = [
      'bg-purple-600 text-white',
      'bg-indigo-600 text-white',
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-pink-600 text-white',
      'bg-amber-600 text-white',
      'bg-violet-600 text-white'
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Dynamic Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 text-purple-800 text-xs font-black mb-2 border border-purple-200">
            <Sparkles size={14} className="text-purple-600" />
            <span>{isEmployee ? 'Employee Operations Portal' : 'Executive Overview'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Vikram Sethi'}! 👋
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 max-w-2xl">
            {isEmployee
              ? 'Your daily content posting schedule, assigned brand portfolio, and operational task hub.'
              : 'Real-time Operations, Multi-Month Campaign Ledger & Team Performance Overview.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('daily-posting')}
            className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-extrabold text-xs transition shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Clock size={16} />
            <span>Daily Postings</span>
          </button>
          <button
            onClick={() => onNavigate('influencers')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition border border-slate-200 flex items-center space-x-2 cursor-pointer"
          >
            <Layers size={16} />
            <span>Influencer Ledger</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition border border-slate-200 flex items-center space-x-2 cursor-pointer"
          >
            <Calendar size={16} />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: My Assigned Brands */}
          <div
            onClick={() => onNavigate('brands')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>My Assigned Brands</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{data?.myBrands?.length || 10}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold">Active brand portfolio</span>
              <span className="text-purple-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition">
                View <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* Card 2: Active Target Goal */}
          <div
            onClick={() => onNavigate('targets')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Target Goal</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Target size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 truncate">
              {data?.activeTarget?.targetType === 'Barter'
                ? `${data.activeTarget.targetCount || 120} Collabs`
                : 'Revenue Target'}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">
                {data?.activeTarget
                  ? `${Math.round(((data.activeTarget.achievedAmount || 1) / (data.activeTarget.targetAmount || 1)) * 100)}% Progress`
                  : 'Goal Active'}
              </span>
              <span className="text-slate-400 font-semibold">Monthly Goal</span>
            </div>
          </div>

          {/* Card 3: Today Completed */}
          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Today Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600">
              {data?.todaySummary?.completed || 0} / {data?.todaySummary?.total || 0}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold">Verified submissions</span>
              <span className="text-emerald-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition">
                Manage <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* Card 4: Pending Submissions */}
          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Pending Submission</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600">
              {data?.todaySummary?.pending || 0}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-semibold">Scheduled for today</span>
              <span className="text-amber-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition">
                Submit <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Employees</span>
              <Users size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{data?.totalEmployees || 0}</div>
            <p className="text-xs text-slate-500 font-semibold mt-1">Company internal staff</p>
          </div>

          <div
            onClick={() => onNavigate('brands')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Total Brands</span>
              <Briefcase size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{data?.totalBrands || 0}</div>
            <p className="text-xs text-slate-500 font-semibold mt-1">Active handled brands</p>
          </div>

          <div
            onClick={() => onNavigate('targets')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Active Target</span>
              <Target size={18} className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 truncate">
              {data?.activeTarget ? `₹${Number(data.activeTarget.targetAmount).toLocaleString()}` : '₹0'}
            </div>
            <p className="text-xs text-purple-600 font-bold mt-1 truncate">
              {data?.activeTarget
                ? `${Math.round(((data.activeTarget.achievedAmount || 0) / (data.activeTarget.targetAmount || 1)) * 100)}% Achieved`
                : 'Click to set target'}
            </p>
          </div>

          <div
            onClick={() => onNavigate('daily-posting')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
              <span>Today Completion</span>
              <CheckCircle2 size={18} className="text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-600">
              {data?.todaySummary?.completed || 0} / {data?.todaySummary?.total || 0}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">Daily postings status</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Schedule & Work Hub Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock size={20} className="text-purple-600" />
                  Today's Operational Schedule
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Daily content posting schedule & URL submissions for assigned brands.
                </p>
              </div>

              <button
                onClick={() => onNavigate('daily-posting')}
                className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-extrabold text-xs transition border border-purple-200 flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {(!data?.todaysTasks || data.todaysTasks.length === 0) ? (
                <div className="p-8 bg-gradient-to-br from-purple-50/50 to-slate-50 rounded-2xl border border-purple-100/80 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-semibold">No operational tasks found in database for today.</p>
                </div>
              ) : (
                data.todaysTasks.map((t: any) => (
                  <div
                    key={t._id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-purple-300 transition shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-purple-100 text-purple-700 border border-purple-200">
                          {t.platform || 'Instagram'} • {t.contentType || 'Post'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {t.scheduledTime || '10:00 AM'}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm">{t.title}</div>
                      <div className="text-xs text-slate-600">
                        Brand: <span className="font-extrabold text-slate-900">{typeof t.brandId === 'object' ? t.brandId?.brandName : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        t.status === 'Verified' ? 'badge-verified' :
                          t.status === 'Submitted' ? 'badge-submitted' :
                            t.status === 'Pending' ? 'badge-pending' : 'badge-rejected'
                      }`}>
                        {t.status}
                      </span>

                      {t.status === 'Pending' && (
                        <button
                          onClick={() => onOpenSubmitUrlModal(t)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1 shadow-xs cursor-pointer"
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

          {/* Quick Metrics Summary Bar */}
          <div className={`pt-3 border-t border-slate-100 grid ${isEmployee ? 'grid-cols-3' : 'grid-cols-2'} gap-3 text-center`}>
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100">
              <div className="text-lg font-black text-emerald-700">{data?.todaySummary?.completed || 0}</div>
              <div className="text-[10px] uppercase font-black text-emerald-600">Verified</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100">
              <div className="text-lg font-black text-amber-700">{data?.todaySummary?.pending || 0}</div>
              <div className="text-[10px] uppercase font-black text-amber-600">Pending</div>
            </div>
            {isEmployee && (
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100">
                <div className="text-lg font-black text-purple-700">{data?.myBrands?.length || 0}</div>
                <div className="text-[10px] uppercase font-black text-purple-600">Assigned Brands</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel: My Assigned Brands / System Activity */}
        <div className="space-y-4">
          {isEmployee ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Star size={18} className="text-yellow-500 fill-yellow-400" />
                  My Assigned Brands
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                  {data?.myBrands?.length || 10} Active
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {(data?.myBrands || [
                  { _id: '1', brandId: { brandName: 'Kala Kurti', industry: 'Fashion' }, priority: 'High' },
                  { _id: '2', brandId: { brandName: 'Vexo Trend', industry: 'Apparel' }, priority: 'Medium' },
                  { _id: '3', brandId: { brandName: 'Fake Losser', industry: 'E-commerce' }, priority: 'Medium' },
                  { _id: '4', brandId: { brandName: 'Royal Design', industry: 'Jewelry' }, priority: 'Medium' },
                  { _id: '5', brandId: { brandName: 'Rivaayath House', industry: 'Ethnic' }, priority: 'Medium' },
                  { _id: '6', brandId: { brandName: 'KD Design', industry: 'Textile' }, priority: 'Medium' },
                  { _id: '7', brandId: { brandName: 'Walkin Wardrobe', industry: 'Footwear' }, priority: 'Medium' },
                  { _id: '8', brandId: { brandName: 'Sanwarlyanghee', industry: 'Couture' }, priority: 'Medium' },
                  { _id: '9', brandId: { brandName: 'Suchira', industry: 'Boutique' }, priority: 'Medium' },
                  { _id: '10', brandId: { brandName: 'House of Rashmi', industry: 'Designer' }, priority: 'Medium' }
                ]).map((b: any, idx: number) => {
                  const bName = b.brandId?.brandName || 'Brand';
                  return (
                    <div
                      key={b._id}
                      onClick={() => onNavigate('daily-posting')}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 flex items-center justify-between text-xs cursor-pointer transition shadow-2xs group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl ${getBrandBg(idx)} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                          {getBrandAvatar(bName)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm group-hover:text-purple-700 transition">{bName}</div>
                          <div className="text-slate-500 font-medium text-[11px]">{b.brandId?.industry || 'General Industry'}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          b.priority === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {b.priority || 'Active'}
                        </span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onNavigate('brands')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center border border-slate-200"
              >
                View Brand Directory
              </button>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600" />
                Recent System Activity
              </h3>
              <div className="space-y-2.5">
                {(data?.recentAuditLogs || []).slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage).map((log: any) => (
                  <div key={log._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
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

      {/* Team Performance & Employee Leaderboard Section for Manager / Admin */}
      {!isEmployee && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500 fill-amber-400" />
                Team Performance & Employee Productivity
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Real-time operational task completion, verification rates, and employee performance rankings.
              </p>
            </div>
            <button
              onClick={() => onNavigate('performance')}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-extrabold text-xs transition border border-purple-200 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Analytics</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase font-black text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Assigned Brands</th>
                  <th className="px-4 py-3">Completed Tasks</th>
                  <th className="px-4 py-3">Verification Rate</th>
                  <th className="px-4 py-3">Performance Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {perfData.map((emp: any, idx: number) => {
                  const empName = emp.employee?.name || emp.employeeName || 'Employee';
                  const empCode = emp.employee?.employeeId || emp.employeeId || `EMP-${1000 + idx}`;
                  const empDesig = emp.employee?.designation || emp.designation || 'Influencer Executive';
                  const brandsManaged = emp.metrics?.brandsManaged ?? emp.assignedBrands ?? 0;
                  const completedTasks = emp.metrics?.completed ?? emp.completedTasks ?? 0;
                  const compRate = emp.metrics?.completionRate !== undefined ? `${emp.metrics.completionRate}%` : (emp.verifiedRate || '0%');

                  return (
                    <tr key={idx} className="hover:bg-purple-50/40 transition">
                      <td className="px-4 py-3 font-black text-slate-900">
                        {idx === 0 ? <span className="text-amber-500 font-extrabold flex items-center gap-1"><Medal size={14} /> #1</span> : `#${idx + 1}`}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs shadow-2xs">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{empName}</div>
                            <div className="text-[10px] text-purple-600 font-bold">{empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{empDesig}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{brandsManaged} Brands</td>
                      <td className="px-4 py-3 font-black text-emerald-600">{completedTasks} Tasks</td>
                      <td className="px-4 py-3 font-extrabold text-purple-700">{compRate}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {parseInt(compRate) >= 80 ? 'High Performer' : parseInt(compRate) >= 50 ? 'Steady' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
