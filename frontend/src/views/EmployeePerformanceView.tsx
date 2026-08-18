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
      key: 'netMargin',
      label: 'Ad2ship Net Margin',
      sortable: true,
      render: (_, row) => {
        const margin = row.incentiveSummary?.netMargin || 0;
        return (
          <div className="space-y-0.5">
            <span className="font-black text-slate-900 text-xs">
              ₹{new Intl.NumberFormat().format(margin)}
            </span>
            <div className="text-[10px] text-slate-400 font-semibold">
              Target: ₹1,20,000 ({row.incentiveSummary?.targetAchievedPercent || 0}%)
            </div>
          </div>
        );
      }
    },
    {
      key: 'targetTier',
      label: 'Incentive Slab',
      render: (_, row) => {
        const tier = row.incentiveSummary?.targetTier || '0%';
        const isTier1 = tier === '10%';
        const isTier2 = tier === '5%';

        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isTier1 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : isTier2 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {isTier1 ? '🏆 10% Slab (1L+)' : isTier2 ? '🥈 5% Slab (80k+)' : '0% (Below 80k)'}
            </span>
            <div className="text-[11px] font-bold text-emerald-700">
              ₹{new Intl.NumberFormat().format(row.incentiveSummary?.targetIncentiveAmount || 0)}
            </div>
          </div>
        );
      }
    },
    {
      key: 'orderBonus',
      label: '100+ Order Bonus',
      render: (_, row) => {
        const bonusCount = row.incentiveSummary?.qualifyingBonusDealsCount || 0;
        const bonusAmount = row.incentiveSummary?.orderBonusAmount || 0;

        return (
          <div className="space-y-0.5">
            {bonusCount > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  🌟 {bonusCount} Videos (100+ Orders)
                </span>
                <div className="text-[11px] font-black text-amber-700">
                  +₹{new Intl.NumberFormat().format(bonusAmount)}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No qualifying videos</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalIncentive',
      label: 'Total Take-Home',
      render: (_, row) => {
        const total = row.incentiveSummary?.totalTakeHomeIncentive || 0;
        return (
          <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs font-black text-emerald-700">
              ₹{new Intl.NumberFormat().format(total)}
            </span>
            <span className="text-[9px] block text-emerald-600 font-extrabold uppercase tracking-wider">Total Incentive</span>
          </div>
        );
      }
    },
    {
      key: 'collabs',
      label: 'Collabs Done',
      render: (_, row) => (
        <div className="text-xs font-bold text-slate-800">
          <span className="text-purple-700">{row.incentiveSummary?.barterCount || 0}B</span> : <span className="text-indigo-700">{row.incentiveSummary?.paidCount || 0}P</span>
          <div className="text-[10px] text-slate-400 font-semibold">{row.metrics.brandsManaged} brands managed</div>
        </div>
      ),
    },
    {
      key: 'completionRate',
      label: 'Completion Rate',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2 w-28">
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
                const { employee, metrics, incentiveSummary, qualifyingDeals } = item;
                const margin = incentiveSummary?.netMargin || 0;
                const targetPct = incentiveSummary?.targetAchievedPercent || 0;
                const tier = incentiveSummary?.targetTier || '0%';
                const totalIncentive = incentiveSummary?.totalTakeHomeIncentive || 0;
                const bonusCount = incentiveSummary?.qualifyingBonusDealsCount || 0;

                return (
                  <div key={employee.id} className="bg-white glass-card-hover p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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
                        <span className="text-xl font-black text-emerald-600">₹{new Intl.NumberFormat().format(totalIncentive)}</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Total Incentive</span>
                      </div>
                    </div>

                    {/* Net Margin & Slabs Box */}
                    <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-bold">Net Ad2ship Margin:</span>
                        <span className="text-base font-black text-emerald-400">
                          ₹{new Intl.NumberFormat().format(margin)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                          <span>Target Progress ({targetPct}%)</span>
                          <span>Target: ₹1,20,000</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(targetPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-700 text-xs">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          tier === '10%' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : tier === '5%' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {tier === '10%' ? '🏆 10% Slab (1L+)' : tier === '5%' ? '🥈 5% Slab (80k+)' : '0% Slab (<80k)'}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          Target Bonus: <strong className="text-emerald-400 font-black">₹{new Intl.NumberFormat().format(incentiveSummary?.targetIncentiveAmount || 0)}</strong>
                        </span>
                      </div>

                      {bonusCount > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-700 text-xs">
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                            🌟 {bonusCount} Videos (100+ Orders)
                          </span>
                          <span className="text-amber-300 font-black text-xs">
                            +₹{new Intl.NumberFormat().format(incentiveSummary?.orderBonusAmount || 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Collab Counts & Tasks */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                        <span className="text-[10px] uppercase font-bold text-purple-700 block">Barter Collabs</span>
                        <span className="text-base font-extrabold text-purple-900">{incentiveSummary?.barterCount || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 block">Paid Collabs</span>
                        <span className="text-base font-extrabold text-indigo-900">{incentiveSummary?.paidCount || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">Brands Managed</span>
                        <span className="text-base font-bold text-slate-900">{metrics.brandsManaged}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Task Completion Rate: <strong className="text-emerald-600 font-bold">{metrics.completionRate}%</strong></span>
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

