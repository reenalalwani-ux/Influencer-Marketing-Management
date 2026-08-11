import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, Clock, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs?limit=100');
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                {filteredLogs.map((log) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
