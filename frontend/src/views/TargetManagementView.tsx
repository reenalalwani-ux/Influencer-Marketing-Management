import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Edit3, Trash2, CheckCircle2, Award, DollarSign, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { TargetItem } from '../types';
import { api } from '../services/api';

interface TargetManagementViewProps {
  userRole?: string;
  onTargetUpdated?: () => void;
}

export const TargetManagementView: React.FC<TargetManagementViewProps> = ({ userRole, onTargetUpdated }) => {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    achievedAmount: '',
    currency: '$',
    period: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    status: 'Active'
  });

  const [saving, setSaving] = useState(false);

  const isManagerOrAdmin = userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Marketing Manager' || userRole === 'Team Leader';

  const fetchTargets = async () => {
    try {
      const res = await api.get('/targets');
      if (res.success) {
        setTargets(res.data);
      }
    } catch (err) {
      console.error('Error fetching targets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleOpenCreateModal = () => {
    const defaultPeriod = `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`;
    setFormData({
      title: '',
      targetAmount: '100000',
      achievedAmount: '0',
      currency: '$',
      period: defaultPeriod,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
      isActive: true,
      status: 'Active'
    });
    setEditingTarget(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (target: TargetItem) => {
    setEditingTarget(target);
    setFormData({
      title: target.title,
      targetAmount: target.targetAmount.toString(),
      achievedAmount: target.achievedAmount.toString(),
      currency: target.currency || '$',
      period: target.period,
      startDate: target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : '',
      endDate: target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : '',
      description: target.description || '',
      isActive: target.isActive,
      status: target.status
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        targetAmount: Number(formData.targetAmount),
        achievedAmount: Number(formData.achievedAmount || 0),
        currency: formData.currency,
        period: formData.period,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        description: formData.description,
        isActive: formData.isActive,
        status: formData.status
      };

      let res;
      if (editingTarget) {
        res = await api.put(`/targets/${editingTarget._id}`, payload);
      } else {
        res = await api.post('/targets', payload);
      }

      if (res.success) {
        setShowCreateModal(false);
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save target');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      const res = await api.patch(`/targets/${id}/active`);
      if (res.success) {
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to set active target');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target record?')) return;
    try {
      const res = await api.get(`/targets`); // Or delete API
      await api.get(`/targets`);
      const resDel = await fetch(`http://localhost:5000/api/v1/targets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await resDel.json();
      if (data.success) {
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete target');
    }
  };

  const activeTarget = targets.find(t => t.isActive && t.status === 'Active') || targets[0];
  const activePercentage = activeTarget ? Math.min(100, Math.round((activeTarget.achievedAmount / activeTarget.targetAmount) * 100)) : 0;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Loading Target Module...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Target Management Module</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Set revenue goals, track employee sales performance & display real-time targets across system headers.
              </p>
            </div>
          </div>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-purple-500/20 flex items-center space-x-2 shrink-0"
          >
            <Plus size={18} />
            <span>Set New Target</span>
          </button>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
            <span>Current Active Target</span>
            <Target size={18} className="text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {activeTarget ? `${activeTarget.currency}${new Intl.NumberFormat().format(activeTarget.targetAmount)}` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Period: {activeTarget?.period || 'None'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
            <span>Total Achieved</span>
            <Award size={18} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {activeTarget ? `${activeTarget.currency}${new Intl.NumberFormat().format(activeTarget.achievedAmount)}` : '$0'}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Current total achieved revenue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
            <span>Completion Rate</span>
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">{activePercentage}%</div>
          <p className="text-xs text-slate-500 font-medium mt-1">Goal completion metric</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2 text-xs uppercase font-extrabold">
            <span>Total Target Records</span>
            <CheckCircle2 size={18} className="text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{targets.length}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">Target campaigns tracked</p>
        </div>
      </div>

      {/* Featured Active Target Hero Card */}
      {activeTarget && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Primary Active System Target
                </span>
                <span className="text-xs font-bold text-slate-300">{activeTarget.period}</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white">{activeTarget.title}</h3>
              {activeTarget.description && (
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{activeTarget.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shrink-0">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-extrabold">Target Goal</div>
                <div className="text-2xl font-extrabold text-white">{activeTarget.currency}{new Intl.NumberFormat().format(activeTarget.targetAmount)}</div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <div className="text-[11px] text-purple-300 uppercase font-extrabold">Achieved</div>
                <div className="text-2xl font-extrabold text-emerald-400">{activeTarget.currency}{new Intl.NumberFormat().format(activeTarget.achievedAmount)}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="mt-6 space-y-2 relative z-10">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-purple-300 flex items-center gap-1.5">
                <TrendingUp size={14} /> {activePercentage}% Achieved
              </span>
              <span className="text-slate-300">
                Remaining: <span className="font-extrabold text-amber-400">{activeTarget.currency}{new Intl.NumberFormat().format(Math.max(0, activeTarget.targetAmount - activeTarget.achievedAmount))}</span>
              </span>
            </div>
            <div className="w-full bg-slate-800/90 rounded-full h-4 overflow-hidden border border-slate-700/80 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Target History Table & Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">All Target Records</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage revenue goals and set system-wide active target banners</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase font-extrabold text-slate-500 border-b border-slate-200">
                <th className="py-3.5 px-6">Target Title & Period</th>
                <th className="py-3.5 px-6">Goal Amount</th>
                <th className="py-3.5 px-6">Achieved Amount</th>
                <th className="py-3.5 px-6">Progress</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Top System Banner</th>
                {isManagerOrAdmin && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {targets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    No target records created yet. Click "Set New Target" to get started.
                  </td>
                </tr>
              ) : (
                targets.map((t) => {
                  const pct = Math.min(100, Math.round(((t.achievedAmount || 0) / (t.targetAmount || 1)) * 100));
                  return (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900">{t.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12} className="text-purple-600" />
                          <span>{t.period}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        {t.currency}{new Intl.NumberFormat().format(t.targetAmount)}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-600">
                        {t.currency}{new Intl.NumberFormat().format(t.achievedAmount)}
                      </td>
                      <td className="py-4 px-6 w-48">
                        <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700">
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          t.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {t.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 w-max">
                            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /> Active Top Banner
                          </span>
                        ) : isManagerOrAdmin ? (
                          <button
                            onClick={() => handleSetActive(t._id)}
                            className="text-xs font-bold text-slate-500 hover:text-purple-700 hover:underline"
                          >
                            Set as Top Banner
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Inactive</span>
                        )}
                      </td>

                      {isManagerOrAdmin && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition"
                              title="Edit Target"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(t._id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                              title="Delete Target"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating / Editing Target */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Target className="text-purple-600" size={22} />
                {editingTarget ? 'Edit Target Record' : 'Set New Target'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Target Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. August 2026 Influencer Sales Target"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Target Goal Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Achieved Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.achievedAmount}
                    onChange={(e) => setFormData({ ...formData, achievedAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-bold text-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Target Period / Month *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. August 2026"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context or campaign goal notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 focus:ring-2 focus:ring-purple-500 rounded-xl text-sm font-medium outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-extrabold text-slate-800">
                  Set as primary active target shown on system top banner
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving Target...' : editingTarget ? 'Update Target' : 'Create Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
