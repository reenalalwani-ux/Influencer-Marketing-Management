import React, { useEffect, useState } from 'react';
import { 
  Shield, Search, Activity, CheckCircle2, RefreshCw, Edit2, 
  Filter, Users, ArrowUpRight, Clock, ShieldAlert, FileText, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';
import { CustomSelectDropdown } from '../components/CustomSelectDropdown';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterUser, setFilterUser] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterModule, setFilterModule] = useState('All');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/audit-logs?page=${page}&limit=${limit}`;
      if (filterUser !== 'All') url += `&userName=${encodeURIComponent(filterUser)}`;
      if (filterRole !== 'All') url += `&userRole=${encodeURIComponent(filterRole)}`;
      if (filterAction !== 'All') url += `&action=${encodeURIComponent(filterAction)}`;
      if (filterModule !== 'All') url += `&module=${encodeURIComponent(filterModule)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.total || (res.data ? res.data.length : 0));
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, filterUser, filterRole, filterAction, filterModule, searchTerm]);

  // Unique lists for dropdown filters
  const uniqueUsers = Array.from(new Set(logs.map(l => l.userName).filter(Boolean)));
  const uniqueModules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2 bg-purple-50 px-3 py-0.5 rounded-full text-xs font-extrabold text-purple-700 border border-purple-200 mb-1">
              <Shield size={13} className="text-purple-600" />
              <span>Reports & Settings Module</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Activity & System Audit Logs</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Comprehensive real-time tracking of every team member login, status update, record edit, and activity.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-extrabold border border-purple-200 transition flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Activity Log
        </button>
      </div>

      {/* KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total System Logs</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{total}</h4>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Tracked Activity Events</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Activity size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">User Logins</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">
              {logs.filter(l => l.action.includes('LOGIN')).length}
            </h4>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Authenticated Sessions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Status Updates</p>
            <h4 className="text-2xl font-black text-blue-600 mt-1">
              {logs.filter(l => l.action === 'UPDATE_STATUS').length}
            </h4>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Deal Status Progression</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <RefreshCw size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Creations & Edits</p>
            <h4 className="text-2xl font-black text-indigo-600 mt-1">
              {logs.filter(l => l.action === 'CREATE_RECORD' || l.action === 'EDIT_RECORD').length}
            </h4>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Data Mutations</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Edit2 size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
              <Filter size={14} className="text-purple-600" /> Filter Logs:
            </span>

            {/* Filter User */}
            <CustomSelectDropdown
              label="Members & Users"
              icon={<Users size={14} className="text-purple-500" />}
              value={filterUser}
              onChange={(val) => { setFilterUser(val || 'All'); setPage(1); }}
              allLabel="All Members & Users"
              allValue="All"
              options={uniqueUsers.map(u => ({ label: u, value: u }))}
            />

            {/* Filter Role */}
            <CustomSelectDropdown
              label="Roles"
              icon={<Shield size={14} className="text-blue-500" />}
              value={filterRole}
              onChange={(val) => { setFilterRole(val || 'All'); setPage(1); }}
              allLabel="All Roles"
              allValue="All"
              options={[
                { label: 'Marketing Manager', value: 'Marketing Manager' },
                { label: 'Assistant Manager', value: 'Assistant Manager' },
                { label: 'Employee / Executive', value: 'Employee' },
                { label: 'Super Admin', value: 'Super Admin' }
              ]}
            />

            {/* Filter Action */}
            <CustomSelectDropdown
              label="Action Types"
              icon={<Activity size={14} className="text-emerald-500" />}
              value={filterAction}
              onChange={(val) => { setFilterAction(val || 'All'); setPage(1); }}
              allLabel="All Action Types"
              allValue="All"
              options={[
                { label: 'User Logins & Auth', value: 'USER_LOGIN' },
                { label: 'Status Updates', value: 'UPDATE_STATUS' },
                { label: 'Record Creation', value: 'CREATE_RECORD' },
                { label: 'Record Edits', value: 'EDIT_RECORD' },
                { label: 'Record Deletions', value: 'DELETE_RECORD' }
              ]}
            />

            {/* Filter Module */}
            <CustomSelectDropdown
              label="Modules"
              icon={<Layers size={14} className="text-indigo-500" />}
              value={filterModule}
              onChange={(val) => { setFilterModule(val || 'All'); setPage(1); }}
              allLabel="All Modules"
              allValue="All"
              options={uniqueModules.map(m => ({ label: m, value: m }))}
            />
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity log..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-medium w-64 shadow-2xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Activity Feed Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-purple-600" />
              Live User Activity & Audit Log Feed
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Showing detailed audit trail of user activities, logins, and operational changes.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-extrabold outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12">
            <InlineLoader message="Fetching live user activity logs..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Timestamp</th>
                    <th className="p-3.5">User / Member</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5 text-center">Action</th>
                    <th className="p-3.5">Module</th>
                    <th className="p-3.5">Activity Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">
                        No activity logs found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                      const isLogin = log.action.includes('LOGIN');
                      const isStatus = log.action === 'UPDATE_STATUS';
                      const isCreate = log.action === 'CREATE_RECORD' || log.action === 'CREATE_BRAND';
                      const isDelete = log.action === 'DELETE_RECORD';

                      return (
                        <tr key={log._id} className="hover:bg-purple-50/40 transition">
                          <td className="p-3.5 pl-6 whitespace-nowrap text-slate-500 font-semibold text-[11px]">
                            <div>{formattedDate}</div>
                            <div className="text-slate-400 text-[10px]">{formattedTime}</div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                                {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900">{log.userName}</div>
                                {log.userEmail && <div className="text-[10px] text-slate-400 font-medium">{log.userEmail}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.userRole?.includes('Manager') ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {log.userRole || 'Employee'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              isLogin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              isStatus ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              isCreate ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              isDelete ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-bold text-slate-600 text-[11px]">
                            {log.module}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 text-xs">
                              {log.details || `${log.action} performed on ${log.entity}`}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
