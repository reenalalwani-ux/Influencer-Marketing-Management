import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, Edit3, Trash2, CheckCircle2, Award, DollarSign, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { TargetItem } from '../types';
import { api } from '../services/api';
import { PageLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

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

  if (loading) return <PageLoader message="Loading Target Module..." />;

  const columns: DataTableColumn<TargetItem>[] = [
    {
      key: 'title',
      label: 'Target Title & Period',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-extrabold text-slate-900">{row.title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Clock size={12} className="text-purple-600" />
            <span>{row.period}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'targetAmount',
      label: 'Goal Amount',
      sortable: true,
      render: (val, row) => (
        <span className="font-extrabold text-slate-900">
          {row.currency}{new Intl.NumberFormat().format(val)}
        </span>
      ),
    },
    {
      key: 'achievedAmount',
      label: 'Achieved Amount',
      sortable: true,
      render: (val, row) => (
        <span className="font-extrabold text-emerald-600">
          {row.currency}{new Intl.NumberFormat().format(val)}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (_, row) => {
        const pct = Math.min(100, Math.round(((row.achievedAmount || 0) / (row.targetAmount || 1)) * 100));
        return (
          <div className="w-36">
            <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700">
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
          val === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Top System Banner',
      render: (val, row) => val ? (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 w-max">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /> Active Top Banner
        </span>
      ) : isManagerOrAdmin ? (
        <button
          onClick={() => handleSetActive(row._id)}
          className="text-xs font-bold text-slate-500 hover:text-purple-700 hover:underline"
        >
          Set as Top Banner
        </button>
      ) : (
        <span className="text-xs text-slate-400">Inactive</span>
      ),
    },
    ...(isManagerOrAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: TargetItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition"
            title="Edit Target"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
            title="Delete Target"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    }] : []),
  ];

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
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{activeTarget.description || 'Target revenue set for current operational cycle.'}</p>
            </div>

            <div className="flex flex-col items-end shrink-0 text-right bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-md">
              <span className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider">Goal Revenue</span>
              <span className="text-3xl font-black text-white">{activeTarget.currency}{new Intl.NumberFormat().format(activeTarget.targetAmount)}</span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <Award size={14} /> Achieved: {activeTarget.currency}{new Intl.NumberFormat().format(activeTarget.achievedAmount)} ({activePercentage}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Target History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-extrabold text-slate-900">All Target Records</h3>
          <span className="text-xs text-slate-400 font-medium">{targets.length} target campaigns</span>
        </div>
        <DataTable
          columns={columns}
          data={targets}
          rowKey="_id"
          emptyMessage="No target records created yet. Click 'Set New Target' to get started."
        />
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
