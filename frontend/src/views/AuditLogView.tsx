import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, Clock, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-logs?page=${page}&limit=${limit}`);
      if (res.success) {
        setLogs(res.data);
        setTotal(res.total || res.data.length);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const filteredLogs = logs.filter(l => 
    (l.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.module || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startCount = total === 0 ? 0 : (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="text-purple-600" />
            Activity & Audit Logs
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Immutable audit trail of important system actions</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search size={18} className="text-purple-600 ml-1" />
        <input
          type="text"
          placeholder="Filter logs by user, action, or module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading audit trail...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-purple-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                        <UserIcon size={14} className="text-purple-600" />
                        <span>{log.userName}</span>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-purple-700">
                        {log.action}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {log.module}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ''}
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-mono font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center space-x-3">
              <span>
                Showing <strong className="text-slate-900 font-extrabold">{startCount}</strong> to{' '}
                <strong className="text-slate-900 font-extrabold">{endCount}</strong> of{' '}
                <strong className="text-slate-900 font-extrabold">{total}</strong> entries
              </span>
              <div className="flex items-center space-x-1.5 ml-2">
                <span className="text-slate-500 text-[11px] font-bold uppercase">Per Page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold shadow-xs">
                {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
