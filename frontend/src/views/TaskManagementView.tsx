import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Send, ExternalLink, Calendar, Clock, Filter, Tag, ChevronDown, ChevronRight, Layers, FolderPlus, User as UserIcon, Eye, Edit2, Trash2, Loader2 } from 'lucide-react';
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Creation & Editing State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [verifyingTask, setVerifyingTask] = useState(false);
  const [creationType, setCreationType] = useState<'main' | 'sub'>('sub');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState('');

  // Expanded main tasks state
  const [expandedMainTasks, setExpandedMainTasks] = useState<Record<string, boolean>>({});

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

  const isManagerOrAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Marketing Manager' || currentUser?.role === 'Team Leader';

  const fetchData = async () => {
    try {
      const [tRes, eRes, bRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/brands')
      ]);

      if (tRes.success) {
        setTasks(tRes.data);
        const initialExpanded: Record<string, boolean> = {};
        tRes.data.forEach((t: TaskItem) => {
          if (t.isMainTask) initialExpanded[t._id] = true;
        });
        setExpandedMainTasks(initialExpanded);
      }

      let empList: Employee[] = eRes.success ? eRes.data : [];

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

  const toggleMainTaskExpanded = (id: string) => {
    setExpandedMainTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateMainTaskModal = () => {
    setEditingTask(null);
    setCreationType('main');
    setSelectedParentTaskId('');
    setTitle('');
    setDescription('');
    setPlatform('Instagram');
    setContentType('Reel');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00 AM');
    setShowAddModal(true);
  };

  const openCreateSubTaskModal = (parentTask?: TaskItem) => {
    setEditingTask(null);
    setCreationType('sub');
    if (parentTask) {
      setSelectedParentTaskId(parentTask._id);
      const bId = typeof parentTask.brandId === 'object' ? parentTask.brandId._id : parentTask.brandId;
      if (bId) setBrandId(bId);
    } else {
      setSelectedParentTaskId('');
    }
    setTitle('');
    setDescription('');
    setPlatform('Instagram');
    setContentType('Reel');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00 AM');
    setShowAddModal(true);
  };

  const openEditTaskModal = (task: TaskItem) => {
    setEditingTask(task);
    setCreationType(task.isMainTask ? 'main' : 'sub');

    const pId = typeof task.parentTaskId === 'object' ? task.parentTaskId?._id : task.parentTaskId;
    setSelectedParentTaskId(pId || '');

    const eId = typeof task.employeeId === 'object' ? task.employeeId?._id : task.employeeId;
    if (eId) setEmployeeId(eId);

    const bId = typeof task.brandId === 'object' ? task.brandId?._id : task.brandId;
    if (bId) setBrandId(bId);

    setTitle(task.title || '');
    setDescription(task.description || '');
    setPlatform(task.platform || 'Instagram');
    setContentType(task.contentType || 'Reel');
    setPriority(task.priority || 'High');
    setScheduledDate(task.scheduledDate ? new Date(task.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setScheduledTime(task.scheduledTime || '10:00 AM');
    setShowAddModal(true);
  };

  const handleDeleteTask = async (id: string, isMain: boolean) => {
    const msg = isMain
      ? 'Deleting this Brand Task will also delete all associated sub-tasks. Are you sure?'
      : 'Are you sure you want to delete this sub-task?';
    if (!window.confirm(msg)) return;

    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      const sched = new Date(scheduledDate);
      const deadline = new Date(sched.getTime() + Number(deadlineHours) * 3600 * 1000);

      const isMain = creationType === 'main';

      const payload: any = {
        isMainTask: isMain,
        parentTaskId: !isMain && selectedParentTaskId ? selectedParentTaskId : undefined,
        employeeId: isMain ? (employeeId || undefined) : employeeId,
        brandId,
        platform: isMain ? 'All Platforms' : platform,
        contentType: isMain ? 'Master Task' : contentType,
        title,
        description,
        priority,
        scheduledDate: sched,
        scheduledTime: isMain ? '09:00 AM' : scheduledTime,
        deadline
      };

      let res;
      if (editingTask) {
        res = await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        res = await api.post('/tasks', payload);
      }

      if (res.success) {
        setShowAddModal(false);
        setEditingTask(null);
        fetchData();
        setTitle('');
        setDescription('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleVerifyDecision = async (decision: 'Verified' | 'Rejected') => {
    if (!selectedVerifyTask) return;
    if (decision === 'Rejected' && !rejectionReason) {
      alert('Please specify a rejection reason.');
      return;
    }
    setVerifyingTask(true);
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
    } finally {
      setVerifyingTask(false);
    }
  };

  // Separate Main Tasks and Standalone/Sub Tasks
  const mainTasks = tasks.filter(t => t.isMainTask);
  const mainTaskIds = new Set(mainTasks.map(m => m._id));

  const getSubTasksForMain = (mainTaskId: string) => {
    return tasks.filter(t => {
      const pId = typeof t.parentTaskId === 'object' ? t.parentTaskId?._id : t.parentTaskId;
      return pId === mainTaskId;
    });
  };

  const standaloneTasks = tasks.filter(t => {
    if (t.isMainTask) return false;
    const pId = typeof t.parentTaskId === 'object' ? t.parentTaskId?._id : t.parentTaskId;
    return !pId || !mainTaskIds.has(pId);
  });

  const paginatedMainTasks = mainTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
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

        <div className="flex items-center space-x-2">
          <button
            onClick={openCreateMainTaskModal}
            className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md"
          >
            <FolderPlus size={16} />
            <span>+ Create Task</span>
          </button>
        </div>
      </div>

      {loading ? (
        <InlineLoader message="Loading content tasks..." />
      ) : (
        <div className="space-y-6">
          {/* Main Tasks & Nested Sub-Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-purple-600" />
                Brand Tasks & Sub-Tasks
              </h3>
            </div>

            {mainTasks.length === 0 && standaloneTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs space-y-2">
                <p>No brand tasks created yet.</p>
                {isManagerOrAdmin && (
                  <button
                    onClick={openCreateMainTaskModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    + Create First Main Task
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {paginatedMainTasks.map((mainTask) => {
                  const subTasks = getSubTasksForMain(mainTask._id);
                  const isExpanded = expandedMainTasks[mainTask._id] !== false;
                  const brand = mainTask.brandId as any;
                  const verifiedCount = subTasks.filter(s => s.status === 'Verified').length;

                  return (
                    <div key={mainTask._id} className="bg-white">
                      {/* Main Task Row Header */}
                      <div className="p-4 bg-purple-50/40 border-l-4 border-l-purple-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleMainTaskExpanded(mainTask._id)}
                            className="p-1 rounded-lg text-purple-700 hover:bg-purple-100 transition shrink-0"
                            title={isExpanded ? "Collapse Sub-tasks" : "Expand Sub-tasks"}
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-purple-600 text-white shadow-2xs">
                                Brand Task
                              </span>
                              <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200">
                                💼 {brand?.brandName || 'Brand'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1">{mainTask.title}</h4>
                            {(mainTask.employeeId as any)?.name && (
                              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                <UserIcon size={12} className="text-purple-500" />
                                Assigned: <strong className="text-slate-800">{(mainTask.employeeId as any).name}</strong>
                              </div>
                            )}
                            {mainTask.description && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{mainTask.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-black text-purple-800 border border-purple-200">
                            {verifiedCount} / {subTasks.length} Sub-Tasks Verified
                          </span>

                          <div className="flex items-center space-x-1 border-l border-purple-200 pl-3">
                            <button
                              onClick={() => setViewingTask(mainTask)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {isManagerOrAdmin && (
                              <>
                                <button
                                  onClick={() => openEditTaskModal(mainTask)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-purple-600 transition"
                                  title="Edit Task"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(mainTask._id, true)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-red-600 transition"
                                  title="Delete Task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => openCreateSubTaskModal(mainTask)}
                            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-xs rounded-xl transition flex items-center gap-1 shadow-2xs"
                          >
                            <Plus size={14} /> + Add Sub-Task
                          </button>
                        </div>
                      </div>

                      {/* Sub-Tasks Nested List */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-50/50 pl-6 md:pl-10 space-y-2 border-t border-slate-100">
                          {subTasks.length === 0 ? (
                            <div className="p-3 text-slate-400 text-xs italic font-semibold">
                              No sub-tasks created under this brand task yet. Click "+ Add Sub-Task" above to create one.
                            </div>
                          ) : (
                            subTasks.map((sub) => {
                              const emp = sub.employeeId as any;
                              return (
                                <div
                                  key={sub._id}
                                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-purple-200 transition"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold text-slate-400">{sub.taskId}</span>
                                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                        {sub.platform} • {sub.contentType}
                                      </span>
                                      <span className="text-[11px] font-extrabold text-slate-600">
                                        🗓️ {new Date(sub.scheduledDate).toLocaleDateString()} {sub.scheduledTime}
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-slate-900 text-xs">{sub.title}</div>
                                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                      <UserIcon size={12} className="text-purple-500" />
                                      Assigned: <strong className="text-slate-800">{emp?.name || 'Unassigned'}</strong> ({emp?.designation || 'Staff'})
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 whitespace-nowrap self-end md:self-auto">
                                    {/* Action Buttons: View, Edit, Delete */}
                                    <div className="flex items-center space-x-1 mr-1">
                                      <button
                                        onClick={() => setViewingTask(sub)}
                                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                                        title="View Details"
                                      >
                                        <Eye size={13} />
                                      </button>
                                      {isManagerOrAdmin && (
                                        <>
                                          <button
                                            onClick={() => openEditTaskModal(sub)}
                                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-purple-600 transition"
                                            title="Edit Sub-Task"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTask(sub._id, false)}
                                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-red-600 transition"
                                            title="Delete Sub-Task"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </>
                                      )}
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                      sub.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                      sub.status === 'Submitted' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                      sub.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                      'bg-slate-100 text-slate-700 border border-slate-300'
                                    }`}>
                                      {sub.status === 'Verified' ? '✓ Verified' :
                                       sub.status === 'Submitted' ? '⏳ Pending Verification' :
                                       sub.status === 'Rejected' ? '✕ Rejected' : 'Pending URL'}
                                    </span>

                                    {/* Submit URL Button */}
                                    {(sub.status === 'Pending' || sub.status === 'Rejected') && (
                                      <button
                                        onClick={() => onOpenSubmitUrlModal(sub)}
                                        className="px-3 py-1.5 btn-gradient-primary text-white text-xs font-extrabold rounded-xl shadow-2xs flex items-center space-x-1"
                                      >
                                        <Send size={12} />
                                        <span>{sub.status === 'Rejected' ? 'Re-submit URL' : 'Submit URL'}</span>
                                      </button>
                                    )}

                                    {/* Manager Verification Button */}
                                    {isManagerOrAdmin && (sub.status === 'Submitted' || sub.verificationStatus === 'Pending Verification') && (
                                      <button
                                        onClick={() => setSelectedVerifyTask(sub)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center space-x-1"
                                      >
                                        <CheckSquare size={12} />
                                        <span>Verify Task</span>
                                      </button>
                                    )}

                                    {/* Published URL Link */}
                                    {sub.publishedUrl && (
                                      <a
                                        href={sub.publishedUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                      >
                                        <ExternalLink size={12} />
                                        <span>Link</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {mainTasks.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(mainTasks.length / itemsPerPage) || 1}
                  totalItems={mainTasks.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>

          {/* Standalone Tasks (If Any) */}
          {standaloneTasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Standalone Content Tasks ({standaloneTasks.length})</h4>
              <div className="space-y-2">
                {standaloneTasks.map((sub) => {
                  const emp = sub.employeeId as any;
                  const brand = sub.brandId as any;
                  return (
                    <div key={sub._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-purple-700">{brand?.brandName || 'Brand'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-800">{sub.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Assigned: {emp?.name || 'Staff'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingTask(sub)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>
                        {isManagerOrAdmin && (
                          <>
                            <button
                              onClick={() => openEditTaskModal(sub)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-600 transition"
                              title="Edit Task"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(sub._id, false)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-red-600 transition"
                              title="Delete Task"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        {(sub.status === 'Pending' || sub.status === 'Rejected') && (
                          <button
                            onClick={() => onOpenSubmitUrlModal(sub)}
                            className="px-3 py-1 btn-gradient-primary text-white text-xs font-bold rounded-lg shadow-2xs flex items-center space-x-1"
                          >
                            <Send size={11} />
                            <span>Submit URL</span>
                          </button>
                        )}
                        {sub.publishedUrl && (
                          <a href={sub.publishedUrl} target="_blank" rel="noreferrer" className="text-purple-600 font-bold hover:underline flex items-center gap-1">
                            <ExternalLink size={12} /> Link
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        title={
          editingTask
            ? (editingTask.isMainTask ? "Edit Main Brand Task" : "Edit Sub-Task")
            : (creationType === 'main' ? "Create Main Brand Task" : "Create Content Sub-Task")
        }
      >
        <form onSubmit={handleSaveTask} className="space-y-3.5 text-sm font-bold">
          {/* Task Type Switch */}
          {isManagerOrAdmin && !editingTask && (
            <div className="flex items-center space-x-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="creationType"
                  value="main"
                  checked={creationType === 'main'}
                  onChange={() => setCreationType('main')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="font-extrabold text-slate-900">Main Brand Task</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="creationType"
                  value="sub"
                  checked={creationType === 'sub'}
                  onChange={() => setCreationType('sub')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="font-extrabold text-slate-900">Sub-Task Deliverable</span>
              </label>
            </div>
          )}

          {/* Select Parent Task if Sub-Task */}
          {creationType === 'sub' && mainTasks.length > 0 && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Main Brand Task *</label>
              <select
                value={selectedParentTaskId}
                onChange={(e) => {
                  setSelectedParentTaskId(e.target.value);
                  const parent = mainTasks.find(m => m._id === e.target.value);
                  if (parent) {
                    const bId = typeof parent.brandId === 'object' ? parent.brandId._id : parent.brandId;
                    if (bId) setBrandId(bId);
                  }
                }}
                className="w-full bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
              >
                <option value="">-- Select Main Task (Optional) --</option>
                {mainTasks.map((main) => {
                  const b = main.brandId as any;
                  return (
                    <option key={main._id} value={main._id}>
                      [{b?.brandName || 'Brand'}] {main.title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Brand *</label>
            <select
              required
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
            >
              <option value="">-- Select Brand --</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.brandName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Assign Member *</label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={currentUser?.role?.toLowerCase() === 'employee'}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {currentUser?.role?.toLowerCase() !== 'employee' && (
                <option value="">-- Select Member --</option>
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
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
              {creationType === 'main' ? 'Main Task Title *' : 'Sub-Task Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={creationType === 'main' ? "e.g. August Reel Promotion" : "e.g. Single Product Reel Posting - Prajakta"}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-bold text-xs"
            />
          </div>

          {creationType === 'sub' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
                >
                  <option value="Reel">Reel</option>
                  <option value="Story">Story</option>
                  <option value="Short">Short</option>
                  <option value="Video">Video</option>
                  <option value="Post">Post</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
              />
            </div>

            {creationType === 'sub' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Time</label>
                <input
                  type="text"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-bold text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTask}
              className="px-4 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingTask ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{editingTask ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{editingTask ? "Update Task" : (creationType === 'main' ? "Create Main Task" : "Create Sub-Task")}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Task Details Modal */}
      <Modal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title="Task Details"
      >
        {viewingTask && (
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-purple-700 font-extrabold text-xs">Task #{viewingTask.taskId}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  viewingTask.isMainTask ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {viewingTask.isMainTask ? 'Main Brand Task' : 'Sub-Task Deliverable'}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{viewingTask.title}</h3>
              {viewingTask.description && (
                <p className="text-slate-600">{viewingTask.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Brand</span>
                  <span className="font-extrabold text-slate-900">{(viewingTask.brandId as any)?.brandName || 'Brand'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Assigned Member</span>
                  <span className="font-extrabold text-slate-900">{(viewingTask.employeeId as any)?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Platform & Type</span>
                  <span className="font-extrabold text-slate-900">{viewingTask.platform} • {viewingTask.contentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Scheduled Date</span>
                  <span className="font-extrabold text-slate-900">{new Date(viewingTask.scheduledDate).toLocaleDateString()} {viewingTask.scheduledTime}</span>
                </div>
              </div>

              {viewingTask.publishedUrl && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Published URL</span>
                  <a href={viewingTask.publishedUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-extrabold break-all">
                    {viewingTask.publishedUrl}
                  </a>
                </div>
              )}

              {viewingTask.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-extrabold block">Rejection Reason:</span>
                  <p>{viewingTask.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
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
                <span className="font-mono text-purple-700 font-extrabold">Sub-Task #{selectedVerifyTask.taskId}</span>
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
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Rejection Reason (Required if Rejecting)</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incorrect Reel audio, missing brand tag, or broken link..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={verifyingTask}
                onClick={() => handleVerifyDecision('Rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifyingTask ? <Loader2 size={14} className="animate-spin" /> : <span>✕ Reject Task</span>}
              </button>
              <button
                type="button"
                disabled={verifyingTask}
                onClick={() => handleVerifyDecision('Verified')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifyingTask ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>✓ Approve & Complete Task</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
