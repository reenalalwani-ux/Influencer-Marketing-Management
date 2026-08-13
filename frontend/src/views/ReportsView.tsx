import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { InlineLoader } from '../components/PageLoader';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employee' | 'brand' | 'daily'>('employee');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/employee-summary';
      if (activeTab === 'brand') endpoint = '/reports/brand-summary';
      if (activeTab === 'daily') endpoint = '/reports/daily-posting';

      const res = await api.get(endpoint);
      if (res.success) setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Export</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Essential business reports with instant CSV data download.</p>
          </div>
        </div>

        <button
          onClick={downloadCSV}
          disabled={reportData.length === 0}
          className="px-4 py-2.5 btn-gradient-primary disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('employee')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'employee' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Employee Summary Report
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'brand' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Brand Summary Report
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'daily' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daily Posting Report
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <InlineLoader message="Generating report data..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 border-b border-slate-200">
                <tr>
                  {reportData.length > 0 && Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="px-6 py-4">{key.replace(/([A-Z])/g, ' $1')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/50 transition">
                    {Object.values(row).map((val: any, vIdx) => (
                      <td key={vIdx} className="px-6 py-4 font-semibold text-slate-900">
                        {String(val)}
                      </td>
                    ))}
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
