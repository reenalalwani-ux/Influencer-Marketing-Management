import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Filter, CheckCircle2, Clock, AlertTriangle, Layers, User as UserIcon, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { InlineLoader } from '../components/PageLoader';
import { Pagination } from '../components/Pagination';
import { User } from '../types';

interface ReportsViewProps {
  userRole?: string;
  currentUser?: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'employee' | 'brand' | 'daily'>('employee');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isEmployeeRole = currentUser?.role === 'Employee';

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/employee-summary';
      if (activeTab === 'brand') endpoint = '/reports/brand-summary';
      if (activeTab === 'daily') endpoint = `/reports/daily-posting?date=${selectedDate}`;

      const res = await api.get(endpoint);
      if (res.success) {
        let data = res.data || [];

        // Apply Employee Role filtering if user is Employee
        if (isEmployeeRole && currentUser?.name) {
          const empNameLower = currentUser.name.toLowerCase();
          if (activeTab === 'employee') {
            data = data.filter((item: any) =>
              item.name?.toLowerCase().includes(empNameLower) ||
              item.employeeId === currentUser.id
            );
          } else if (activeTab === 'daily') {
            data = data.filter((item: any) =>
              item.employee?.toLowerCase().includes(empNameLower)
            );
          }
        }
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchReport();
  }, [activeTab, selectedDate]);

  // Metric computations for header summary cards
  const totalRecords = reportData.length;
  const totalCompleted = reportData.reduce((acc, row) => acc + (Number(row.completed) || (row.status === 'Verified' ? 1 : 0)), 0);
  const totalPending = reportData.reduce((acc, row) => acc + (Number(row.pending) || (row.status === 'Pending' ? 1 : 0)), 0);
  const avgCompletionRate = totalRecords > 0
    ? Math.round(reportData.reduce((acc, row) => acc + (parseInt(String(row.completionRate || 0)) || 0), 0) / totalRecords)
    : 0;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(reportData.length / itemsPerPage));
  const paginatedData = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export CSV function
  const downloadCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `influencer_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define static fallback column headers for each tab
  const getHeadersForTab = () => {
    if (reportData.length > 0) {
      return Object.keys(reportData[0]);
    }
    if (activeTab === 'employee') {
      return ['Employee ID', 'Name', 'Department', 'Designation', 'Assigned Brands', 'Total Tasks', 'Completed', 'Pending', 'Delayed', 'Completion Rate'];
    }
    if (activeTab === 'brand') {
      return ['Brand ID', 'Brand Name', 'Industry', 'Assigned Employees', 'Total Tasks', 'Completed', 'Pending', 'Delayed'];
    }
    return ['Task ID', 'Scheduled Date', 'Scheduled Time', 'Employee', 'Brand', 'Platform', 'Content Type', 'Task Title', 'Status', 'Published URL'];
  };

  const headers = getHeadersForTab();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Export</h2>
              {isEmployeeRole && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                  Employee View
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Essential operational reports with instant CSV data download.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-purple-500"
            />
          )}
          <button
            onClick={fetchReport}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={downloadCSV}
            disabled={reportData.length === 0}
            className="px-4 py-2.5 btn-gradient-primary disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Operational Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase mb-1">
            <span>Report Items</span>
            <Layers size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalRecords}</div>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Total data records</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase mb-1">
            <span>Completed / Verified</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalCompleted}</div>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Verified postings</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase mb-1">
            <span>Pending / In Progress</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{totalPending}</div>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Scheduled tasks</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase mb-1">
            <span>Completion Rate</span>
            <CheckCircle2 size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{avgCompletionRate}%</div>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Overall task efficiency</p>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex flex-wrap text-xs font-extrabold w-full sm:w-auto self-start">
        <button
          onClick={() => setActiveTab('employee')}
          className={`px-5 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'employee'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Employee Summary Report
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`px-5 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'brand'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Brand Summary Report ({reportData.length > 0 && activeTab === 'brand' ? reportData.length : 'All Brands'})
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`px-5 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Posting Report
        </button>
      </div>

      {/* Report Content Table & Empty State Management */}
      {loading ? (
        <InlineLoader message="Generating report data..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {reportData.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center font-bold shadow-xs">
                <FileSpreadsheet size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">No Report Data Available</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto mt-1">
                  {isEmployeeRole
                    ? `No summary entries found for ${currentUser?.name || 'your profile'} under this report tab.`
                    : 'No records match the current report filters or date selection.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={fetchReport}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} /> Refresh Report Data
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-800">
                  <thead className="bg-slate-50 text-xs uppercase font-black text-slate-500 border-b border-slate-200">
                    <tr>
                      {headers.map((key) => (
                        <th key={key} className="px-6 py-4 whitespace-nowrap">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/40 transition">
                        {Object.values(row).map((val: any, vIdx) => (
                          <td key={vIdx} className="px-6 py-4 text-slate-900 whitespace-nowrap">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={reportData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          )}

          {/* Footer Summary Strip */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-500">
            <span>Showing {paginatedData.length} of {reportData.length} total entries • Real-time Report Engine</span>
            <span>Generated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </div>
  );
};
