import React, { useEffect, useState } from 'react';
import { Flag, Plus, Calendar, Tag, Briefcase, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Brand } from '../types';
import { Modal } from '../components/Modal';

export const CampaignManagementView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [brandId, setBrandId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Instagram']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [priority, setPriority] = useState('High');

  const fetchData = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/brands')
      ]);
      if (cRes.success) setCampaigns(cRes.data);
      if (bRes.success) setBrands(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/campaigns', {
        brandId, title, description, platforms, startDate, endDate, priority
      });
      if (res.success) {
        setShowAddModal(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Flag className="text-purple-600" />
            Campaign Management
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Marketing campaigns under each brand portfolio</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>New Campaign</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading campaign board...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const brand = c.brandId as any;
            return (
              <div key={c._id} className="bg-white glass-card-hover p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {brand?.brandName || 'Brand'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg mt-1.5">{c.title}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-submitted">
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {c.description || 'No campaign description provided.'}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Platforms:</span>
                      <span className="font-semibold text-slate-800">{c.platforms?.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span className="text-slate-800">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Priority: <strong className="text-amber-600">{c.priority}</strong></span>
                  <span className="text-emerald-600 font-bold">Active Campaign</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Campaign Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Campaign"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Brand</label>
            <select
              required
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
            >
              <option value="">-- Select Brand --</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.brandName} ({b.industry})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Campaign Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Fitness Fest 2026"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign brief & requirements..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 h-20 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
