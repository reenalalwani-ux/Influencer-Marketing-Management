import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Send, ExternalLink, Calendar, Clock, Filter, Tag } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem, Employee, Brand } from '../types';
import { Modal } from '../components/Modal';

interface TaskManagementViewProps {
  onOpenSubmitUrlModal: (task: TaskItem) => void;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({ onOpenSubmitUrlModal }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields
  const [employeeId, setEmployeeId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [contentType, setContentType] = useState('Reel');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [deadlineHours, setDeadlineHours] = useState('4');

  const fetchData = async () => {
    try {
      const [tRes, eRes, bRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/brands')
      ]);

      if (tRes.success) setTasks(tRes.data);
      if (eRes.success) setEmployees(eRes.data);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sched = new Date(scheduledDate);
      const deadline = new Date(sched.getTime() + Number(deadlineHours) * 3600 * 1000);

      const res = await api.post('/tasks', {
        employeeId, brandId,
        platform, contentType, title, description, priority,
        scheduledDate: sched, scheduledTime, deadline
      });

      if (res.success) {
        setShowAddModal(false);
        fetchData();
        setTitle(''); setDescription('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="text-purple-600" />
            Task & Content Center
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Trackable content tasks assigned to internal staff</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>Create Task</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading content tasks...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Task ID & Title</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Platform & Type</th>
                  <th className="px-6 py-4">Scheduled</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => {
                  const emp = t.employeeId as any;
                  const brand = t.brandId as any;
                  return (
                    <tr key={t._id} className="hover:bg-purple-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-mono text-purple-700 font-extrabold block">{t.taskId}</span>
                        <div className="font-bold text-slate-900 mt-0.5">{t.title}</div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {emp?.name || 'Unassigned'}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-purple-700">
                        {brand?.brandName || 'N/A'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {t.platform} • {t.contentType}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="font-bold text-slate-800">{new Date(t.scheduledDate).toLocaleDateString()}</div>
                        <div className="text-slate-500 font-semibold">{t.scheduledTime}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.status === 'Verified' ? 'badge-verified' :
                            t.status === 'Submitted' ? 'badge-submitted' :
                              t.status === 'Pending' ? 'badge-pending' : 'badge-rejected'
                          }`}>
                          {t.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {t.status === 'Pending' && (
                            <button
                              onClick={() => onOpenSubmitUrlModal(t)}
                              className="px-3 py-1.5 btn-gradient-primary text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1"
                            >
                              <Send size={12} />
                              <span>Submit URL</span>
                            </button>
                          )}

                          {t.publishedUrl && (
                            <a
                              href={t.publishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition"
                              title="Open Published URL"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Content Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Assign Employee</label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation})</option>
              ))}
            </select>
          </div>

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
                <option key={b._id} value={b._id}>{b.brandName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Instagram Reel Promotion"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              >
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              >
                <option value="Reel">Reel</option>
                <option value="Story">Story</option>
                <option value="Short">Short</option>
                <option value="Video">Video</option>
                <option value="Post">Post</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Time</label>
              <input
                type="text"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
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
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
