import React, { useEffect, useState } from 'react';
import { Clock, Calendar as CalendarIcon, Filter, CheckCircle2, AlertTriangle, Send, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem, Employee, Brand } from '../types';

interface DailyPostingViewProps {
  onOpenSubmitUrlModal: (task: TaskItem) => void;
}

export const DailyPostingView: React.FC<DailyPostingViewProps> = ({ onOpenSubmitUrlModal }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [metrics, setMetrics] = useState<any>({ total: 0, completed: 0, pending: 0, delayed: 0, missed: 0 });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedEmployee) params.append('employeeId', selectedEmployee);
      if (selectedBrand) params.append('brandId', selectedBrand);
      if (selectedPlatform) params.append('platform', selectedPlatform);

      const res = await api.get(`/postings/daily?${params.toString()}`);
      if (res.success) {
        setTasks(res.data);
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate, selectedEmployee, selectedBrand, selectedPlatform]);

  useEffect(() => {
    const fetchLookup = async () => {
      try {
        const [eRes, bRes] = await Promise.all([api.get('/employees'), api.get('/brands')]);
        if (eRes.success) setEmployees(eRes.data);
        if (bRes.success) setBrands(bRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLookup();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Date Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className="text-purple-600" size={24} />
            <h2 className="text-2xl font-extrabold text-slate-900">Daily Posting Operations</h2>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-1">Real-time daily content tracking workspace for internal staff</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition"
          >
            Today
          </button>
          <button
            onClick={fetchDailyData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Operational Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs uppercase font-extrabold text-slate-500 block">Total Postings</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{metrics.total}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs uppercase font-extrabold text-emerald-700 block">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{metrics.completed}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs uppercase font-extrabold text-amber-700 block">Pending</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">{metrics.pending}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs uppercase font-extrabold text-amber-600 block">Delayed</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{metrics.delayed}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center col-span-2 sm:col-span-1">
          <span className="text-xs uppercase font-extrabold text-rose-700 block">Rejected / Missed</span>
          <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{metrics.rejected + metrics.missed}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1">
          <Filter size={14} /> Filters:
        </span>

        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e._id} value={e._id}>{e.name}</option>
          ))}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>{b.brandName}</option>
          ))}
        </select>

        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
        >
          <option value="">All Platforms</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
          <option value="TikTok">TikTok</option>
          <option value="X (Twitter)">X (Twitter)</option>
        </select>
      </div>

      {/* Operational List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading daily postings...</div>
      ) : (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-500 font-medium">
              No postings scheduled for this date matching the selected filters.
            </div>
          ) : (
            tasks.map((t) => {
              const emp = t.employeeId as any;
              const brand = t.brandId as any;
              return (
                <div
                  key={t._id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-200 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 text-center border-r border-slate-200 pr-4 shrink-0">
                      <div className="font-extrabold text-purple-700 text-sm">{t.scheduledTime}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Time</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {t.platform} • {t.contentType}
                        </span>
                        <span className="text-xs font-bold text-purple-700">
                          {brand?.brandName || 'Brand'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-base">{t.title}</div>

                      <div className="text-xs text-slate-600">
                        Assigned Employee: <span className="text-slate-900 font-bold">{emp?.name || 'Unassigned'}</span> ({emp?.designation})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      t.status === 'Verified' ? 'badge-verified' :
                      t.status === 'Submitted' ? 'badge-submitted' :
                      t.status === 'Pending' ? 'badge-pending' : 'badge-rejected'
                    }`}>
                      {t.status}
                    </span>

                    {t.status === 'Pending' && (
                      <button
                        onClick={() => onOpenSubmitUrlModal(t)}
                        className="px-3.5 py-2 btn-gradient-primary rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5"
                      >
                        <Send size={13} />
                        <span>Submit Published URL</span>
                      </button>
                    )}

                    {t.publishedUrl && (
                      <a
                        href={t.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <ExternalLink size={13} />
                        <span>Open Link</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
