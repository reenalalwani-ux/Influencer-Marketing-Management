import React, { useEffect, useState } from 'react';
import { BarChart3, Award, CheckCircle2, Clock, AlertCircle, Briefcase } from 'lucide-react';
import { api } from '../services/api';
import { EmployeePerformanceData } from '../types';

export const EmployeePerformanceView: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<EmployeePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="text-purple-600" />
            Employee Performance Analytics
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Calculated directly from task completion data & schedules</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Calculating performance metrics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {performanceData.map((item) => {
            const { employee, metrics } = item;
            return (
              <div key={employee.id} className="bg-white glass-card-hover p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{employee.name}</h3>
                      <span className="text-xs text-purple-600 font-bold">{employee.employeeId} • {employee.designation}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-emerald-600">{metrics.completionRate}%</span>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Completion Rate</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                  />
                </div>

                {/* Performance Stats Grid */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned</span>
                    <span className="text-lg font-bold text-slate-900">{metrics.totalAssigned}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Completed</span>
                    <span className="text-lg font-extrabold text-emerald-700">{metrics.completed}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending</span>
                    <span className="text-lg font-extrabold text-amber-700">{metrics.pending}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Delayed</span>
                    <span className="text-lg font-extrabold text-rose-700">{metrics.delayed}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Brands Managed: <strong className="text-slate-900 font-bold">{metrics.brandsManaged}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
