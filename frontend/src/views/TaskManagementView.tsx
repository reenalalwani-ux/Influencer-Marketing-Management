import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Send, ExternalLink, Calendar, Clock, Filter, Tag } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem, Employee, Brand, User } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';

interface TaskManagementViewProps {
  currentUser?: User | null;
  refreshTrigger?: number;
  onOpenSubmitUrlModal: (task: TaskItem) => void;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({ currentUser, refreshTrigger, onOpenSubmitUrlModal }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  // Manager Verification Modal state
  const [selectedVerifyTask, setSelectedVerifyTask] = useState<TaskItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState('');

  const handleVerifyDecision = async (decision: 'Verified' | 'Rejected') => {
    if (!selectedVerifyTask) return;
    if (decision === 'Rejected' && !rejectionReason) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      const res = await api.post(`/verification/${selectedVerifyTask._id}/verify`, {
        decision,
        rejectionReason,
        comments
      });
      if (res.success) {
        setSelectedVerifyTask(null);
        setRejectionReason('');
        setComments('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete verification');
    }
  };

  const fetchData = async () => {
    try {
      const [tRes, eRes, bRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/brands')
      ]);

      if (tRes.success) setTasks(tRes.data);
      let empList: Employee[] = eRes.success ? eRes.data : [];

      // If user is employee and not in empList, auto-synthesize their profile for selection
      if (currentUser && empList.length === 0) {
        empList = [{
          _id: currentUser.id || (currentUser as any)._id || 'self',
          employeeId: 'EMP-SELF',
          name: currentUser.name,
          email: currentUser.email,
          designation: 'Employee',
          department: 'Marketing',
          phone: '',
          status: 'Active',
          role: currentUser.role
        } as any];
      }

      setEmployees(empList);
      if (bRes.success) setBrands(bRes.data);

      // Auto-select current employee and first brand
      if (currentUser) {
        const myEmp = empList.find(e =>
          e.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
          e.name?.toLowerCase() === currentUser.name?.toLowerCase()
        ) || empList[0];

        if (myEmp) setEmployeeId(myEmp._id);
      }
      if (bRes.success && bRes.data.length > 0) {
        setBrandId(bRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <CheckSquare size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tasks & Content</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Trackable content tasks assigned to internal staff.</p>
          </div>
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
        <InlineLoader message="Loading content tasks..." />
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
                {tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t) => {
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
                        {t.status === 'Verified' || t.verificationStatus === 'Verified' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ✓ Verified
                          </span>
                        ) : t.status === 'Submitted' || t.verificationStatus === 'Pending Verification' ? (
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                              <Clock size={12} className="text-amber-700" />
                              ⏳ Pending Verification
                            </span>
                            <span className="block text-[10px] font-semibold text-slate-500">Waiting for Manager</span>
                          </div>
                        ) : t.status === 'Rejected' || t.verificationStatus === 'Rejected' ? (
                          <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                              ✕ Rejected
                            </span>
                            {t.rejectionReason && (
                              <span className="block text-[10px] font-semibold text-rose-600 truncate max-w-[130px]" title={t.rejectionReason}>
                                Reason: {t.rejectionReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-1">
                            <Clock size={12} />
                            Pending URL
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(t.status === 'Pending' || t.status === 'Rejected') && (
                            <button
                              onClick={() => onOpenSubmitUrlModal(t)}
                              className="px-3 py-1.5 btn-gradient-primary text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 hover:shadow-md transition"
                            >
                              <Send size={12} />
                              <span>{t.status === 'Rejected' ? 'Re-submit URL' : 'Submit URL'}</span>
                            </button>
                          )}

                          {/* Manager Quick Verify Button */}
                          {currentUser?.role?.toLowerCase() !== 'employee' && (t.status === 'Submitted' || t.verificationStatus === 'Pending Verification') && (
                            <button
                              onClick={() => setSelectedVerifyTask(t)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center space-x-1 transition"
                            >
                              <CheckSquare size={12} />
                              <span>Verify Task</span>
                            </button>
                          )}

                          {t.publishedUrl && (
                            <a
                              href={t.publishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                              title="Open Published URL"
                            >
                              <ExternalLink size={13} />
                              <span>Link</span>
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

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(tasks.length / itemsPerPage)}
              totalItems={tasks.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
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
              disabled={currentUser?.role?.toLowerCase() === 'employee'}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {currentUser?.role?.toLowerCase() !== 'employee' && (
                <option value="">-- Select Employee --</option>
              )}
              {(currentUser?.role?.toLowerCase() === 'employee'
                ? employees.filter(emp =>
                    emp.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
                    emp.name?.toLowerCase() === currentUser?.name?.toLowerCase()
                  )
                : employees
              ).map((emp) => (
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

      {/* Manager Task Verification Modal */}
      <Modal
        isOpen={!!selectedVerifyTask}
        onClose={() => setSelectedVerifyTask(null)}
        title="Manager Task Verification"
      >
        {selectedVerifyTask && (
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-purple-700 font-extrabold">Task #{selectedVerifyTask.taskId}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px]">
                  ⏳ Pending Manager Approval
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">{selectedVerifyTask.title}</h4>
              <p className="text-slate-600">
                Submitted URL:{' '}
                <a href={selectedVerifyTask.publishedUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold break-all">
                  {selectedVerifyTask.publishedUrl}
                </a>
              </p>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Manager Comments / Feedback</label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional notes or feedback for employee..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Rejection Reason (Required if Rejecting)</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incorrect Reel audio, missing brand tag, or broken link..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleVerifyDecision('Rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                ✕ Reject Task
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDecision('Verified')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
              >
                ✓ Approve & Complete Task
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
