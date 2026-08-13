import React, { useEffect, useState } from 'react';
import { BarChart3, Search, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { api } from '../services/api';
import { EmployeePerformanceData } from '../types';
import { Pagination } from '../components/Pagination';
import { PageLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

export const EmployeePerformanceView: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<EmployeePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 10 : 4;

  const fetchPerformance = async () => {
    try {
      const res = await api.get('/performance');
      if (res.success) setPerformanceData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  // Filter performance data by search term
  const filteredData = performanceData.filter(item => {
    const term = searchTerm.toLowerCase();
    const empName = item.employee?.name?.toLowerCase() || '';
    const empId = item.employee?.employeeId?.toLowerCase() || '';
    const designation = item.employee?.designation?.toLowerCase() || '';
    return empName.includes(term) || empId.includes(term) || designation.includes(term);
  });

  // Calculate total pages & safe page index
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedData = filteredData.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const columns: DataTableColumn<EmployeePerformanceData>[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-xs shadow shrink-0">
            {row.employee?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">{row.employee?.name || 'Unknown'}</div>
            <div className="text-[10px] text-purple-600 font-bold">
              {row.employee?.employeeId} • {row.employee?.designation}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAssigned',
      label: 'Assigned',
      sortable: true,
      render: (_, row) => (
        <span className="font-bold text-slate-900">{row.metrics.totalAssigned}</span>
      ),
    },
    {
      key: 'completed',
      label: 'Completed',
      sortable: true,
      render: (_, row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
          {row.metrics.completed}
        </span>
      ),
    },
    {
      key: 'pending',
      label: 'Pending',
      sortable: true,
      render: (_, row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200">
          {row.metrics.pending}
        </span>
      ),
    },
    {
      key: 'delayed',
      label: 'Delayed',
      sortable: true,
      render: (_, row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
          {row.metrics.delayed}
        </span>
      ),
    },
    {
      key: 'brandsManaged',
      label: 'Brands',
      sortable: true,
      render: (_, row) => (
        <span className="font-semibold text-slate-700">{row.metrics.brandsManaged}</span>
      ),
    },
    {
      key: 'completionRate',
      label: 'Completion Rate',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5 w-36">
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(row.metrics.completionRate, 100)}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-emerald-600 shrink-0">
            {row.metrics.completionRate}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Performance Analytics</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Calculated directly from task completion data & schedules.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => { setViewMode('table'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or role..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader message="Calculating performance metrics..." />
      ) : filteredData.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 font-medium text-sm">
          No employee performance records found matching "{searchTerm}".
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'table' ? (
            <DataTable
              columns={columns}
              data={paginatedData}
              rowKey={(item) => item.employee?.id || item.employee?.employeeId}
              emptyMessage="No performance data available."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedData.map((item) => {
                const { employee, metrics } = item;
                return (
                  <div key={employee.id} className="bg-white glass-card-hover p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-base shadow">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{employee.name}</h3>
                          <span className="text-[11px] text-purple-600 font-bold">{employee.employeeId} • {employee.designation}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-emerald-600">{metrics.completionRate}%</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Completion</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 border border-slate-200">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Assigned</span>
                        <span className="text-base font-bold text-slate-900">{metrics.totalAssigned}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Completed</span>
                        <span className="text-base font-extrabold text-emerald-700">{metrics.completed}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-[9px] uppercase font-bold text-amber-700 block">Pending</span>
                        <span className="text-base font-extrabold text-amber-700">{metrics.pending}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                        <span className="text-[9px] uppercase font-bold text-rose-700 block">Delayed</span>
                        <span className="text-base font-extrabold text-rose-700">{metrics.delayed}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Brands Managed: <strong className="text-slate-900 font-bold">{metrics.brandsManaged}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

