import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Send, ExternalLink, ChevronDown, ChevronRight, Layers, FolderPlus, User as UserIcon, Eye, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem, Employee, Brand, User, EmployeeBrandAssignment } from '../types';
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
  const [assignments, setAssignments] = useState<EmployeeBrandAssignment[]>([]);
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
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showParentTaskDropdown, setShowParentTaskDropdown] = useState(false);
  const [parentTaskSearch, setParentTaskSearch] = useState('');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Expanded main tasks state
  const [expandedMainTasks, setExpandedMainTasks] = useState<Record<string, boolean>>({});

  // Form fields
  const [employeeId, setEmployeeId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [contentType, setContentType] = useState('Reel');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [priority, setPriority] = useState('High');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [deadlineHours, setDeadlineHours] = useState('4');
  const [taskStatus, setTaskStatus] = useState<'Pending' | 'In Progress' | 'Submitted' | 'Verified' | 'Rejected'>('Pending');

  // Manager Verification Modal state
  const [selectedVerifyTask, setSelectedVerifyTask] = useState<TaskItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState('');

  const isAssistant = currentUser?.role === 'Assistant Manager' || currentUser?.role === 'Assistant Marketing Manager' || (!!currentUser?.role && currentUser.role.toLowerCase().includes('assistant'));
  const isManagerOrAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Marketing Manager' || currentUser?.role === 'Manager' || isAssistant || currentUser?.role === 'Team Leader';

  const fetchData = async () => {
    try {
      const [tRes, eRes, bRes, aRes] = await Promise.all([
        api.get('/tasks?excludeMatrix=true'),
        api.get('/employees'),
        api.get('/brands'),
        api.get('/employee-brands?status=Active')
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
      if (aRes?.success) setAssignments(aRes.data);

      const defaultBrandId = bRes.success && bRes.data.length > 0 ? bRes.data[0]._id : '';
      if (defaultBrandId) {
        setBrandId(defaultBrandId);
        // Find assigned member for default brand
        const assign = aRes?.data?.find((a: EmployeeBrandAssignment) => {
          const b = typeof a.brandId === 'object' ? a.brandId._id : a.brandId;
          return b === defaultBrandId && a.status === 'Active';
        });
        if (assign) {
          const empId = typeof assign.employeeId === 'object' ? assign.employeeId._id : assign.employeeId;
          setEmployeeId(empId);
        } else if (currentUser) {
          const myEmp = empList.find(e =>
            e.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
            e.name?.toLowerCase() === currentUser.name?.toLowerCase()
          ) || empList[0];
          if (myEmp) setEmployeeId(myEmp._id);
        }
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

  const getAssignedMemberForBrand = (targetBrandId: string): Employee | null => {
    if (!targetBrandId) return null;
    const assign = assignments.find(a => {
      const b = typeof a.brandId === 'object' ? a.brandId._id : a.brandId;
      return b === targetBrandId && a.status === 'Active';
    });
    if (assign) {
      const empId = typeof assign.employeeId === 'object' ? assign.employeeId._id : assign.employeeId;
      return employees.find(e => e._id === empId) || (typeof assign.employeeId === 'object' ? assign.employeeId as Employee : null);
    }
    const br = brands.find(b => b._id === targetBrandId);
    if (br?.assignedEmployees && br.assignedEmployees.length > 0) {
      const first = br.assignedEmployees[0];
      const empId = typeof first.employeeId === 'object' ? (first.employeeId as any)._id : first.employeeId;
      return employees.find(e => e._id === empId) || null;
    }
    return null;
  };

  const handleBrandChange = (newBrandId: string) => {
    setBrandId(newBrandId);
    const assigned = getAssignedMemberForBrand(newBrandId);
    if (assigned) {
      setEmployeeId(assigned._id);
    }
  };

  const openCreateMainTaskModal = () => {
    setEditingTask(null);
    setCreationType('main');
    setSelectedParentTaskId('');
    const targetBrand = brands.length > 0 ? brands[0]._id : '';
    setBrandId(targetBrand);
    const assigned = getAssignedMemberForBrand(targetBrand);
    if (assigned) {
      setEmployeeId(assigned._id);
    }
    setTitle('');
    setDescription('');
    setRemarks('');
    setPlatform('Instagram');
    setContentType('Reel');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00 AM');
    setShowAddModal(true);
  };

  const openCreateSubTaskModal = (parentTask?: TaskItem) => {
    setEditingTask(null);
    setCreationType('sub');
    let targetBrand = '';
    if (parentTask) {
      setSelectedParentTaskId(parentTask._id);
      const bId = typeof parentTask.brandId === 'object' ? parentTask.brandId._id : parentTask.brandId;
      if (bId) {
        targetBrand = bId;
        setBrandId(bId);
      }
    } else {
      setSelectedParentTaskId('');
      targetBrand = brands.length > 0 ? brands[0]._id : '';
      setBrandId(targetBrand);
    }

    const assigned = getAssignedMemberForBrand(targetBrand);
    if (assigned) {
      setEmployeeId(assigned._id);
    }

    setTitle('');
    setDescription('');
    setRemarks('');
    setPlatform('Instagram');
    setContentType('Reel');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00 AM');
    setShowAddModal(true);
  };

  const openEditTaskModal = (task: TaskItem) => {
    if (!task) return;
    try {
      setEditingTask(task);
      setCreationType(task.isMainTask ? 'main' : 'sub');

      const pId = typeof task.parentTaskId === 'object' ? (task.parentTaskId?._id || (task.parentTaskId as any)?.id) : task.parentTaskId;
      setSelectedParentTaskId(pId || '');

      const eId = typeof task.employeeId === 'object' ? (task.employeeId?._id || (task.employeeId as any)?.id) : task.employeeId;
      if (eId) setEmployeeId(eId);

      const bId = typeof task.brandId === 'object' ? (task.brandId?._id || (task.brandId as any)?.id) : task.brandId;
      if (bId) setBrandId(bId);

      setTitle(task.title || '');
      setDescription(task.description || '');
      setRemarks(task.remarks || '');
      setPlatform(task.platform || 'Instagram');
      setContentType(task.contentType || 'Reel');
      setPriority(task.priority || 'High');
      setTaskStatus((task.status as any) || 'Pending');

      let parsedDate = '';
      if (task.scheduledDate) {
        try {
          const d = new Date(task.scheduledDate);
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString().split('T')[0];
          }
        } catch (_) {}
      }
      if (!parsedDate) {
        parsedDate = new Date().toISOString().split('T')[0];
      }
      setScheduledDate(parsedDate);
      setScheduledTime(task.scheduledTime || '10:00 AM');
      setShowAddModal(true);
    } catch (err) {
      console.error('Error opening edit task modal:', err);
      // Fallback: still open modal
      setShowAddModal(true);
    }
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

  const handleQuickCompleteTask = async (taskId: string) => {
    try {
      const res = await api.put(`/tasks/${taskId}/status`, { status: 'Verified' });
      if (res.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete task');
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
        remarks,
        priority,
        status: editingTask ? taskStatus : undefined,
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
        setRemarks('');
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

  // Separate Main Tasks and Standalone/Sub Tasks (Excludes Posting Calendar Sheet Matrix Tasks)
  const nonMatrixTasks = tasks.filter(t => {
    const isMatrixTask = (
      (t.taskId && t.taskId.startsWith('TSK-MTRX')) ||
      (t.description && t.description.toLowerCase().includes('posting calendar')) ||
      (t.title && t.title.toLowerCase().startsWith('daily posting -'))
    );
    return !isMatrixTask;
  });

  const mainTasks = nonMatrixTasks.filter(t => t.isMainTask);
  const mainTaskIds = new Set(mainTasks.map(m => m._id));

  const getSubTasksForMain = (mainTaskId: string) => {
    return nonMatrixTasks.filter(t => {
      const pId = typeof t.parentTaskId === 'object' ? t.parentTaskId?._id : t.parentTaskId;
      return pId === mainTaskId;
    });
  };

  const standaloneTasks = nonMatrixTasks.filter(t => {
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
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTask(mainTask);
                              }}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTaskModal(mainTask);
                              }}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-600 transition cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 size={14} />
                            </button>
                            {isManagerOrAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(mainTask._id, true);
                                }}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateSubTaskModal(mainTask);
                            }}
                            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-xs rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Plus size={14} /> + Add Sub-Task
                          </button>
                        </div>
                      </div>

                      {/* Sub-Tasks Nested List */}
                      {isExpanded && (
                        <div className="p-3.5 bg-slate-50/60 pl-6 md:pl-10 space-y-2.5 border-t border-slate-100">
                          {subTasks.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs italic font-semibold bg-white rounded-xl border border-dashed border-slate-200">
                              No sub-tasks created under this brand task yet. Click "+ Add Sub-Task" above to create one.
                            </div>
                          ) : (
                            subTasks.map((sub) => {
                              const emp = sub.employeeId as any;
                              const isDone = sub.status === 'Verified' || sub.status === 'Completed';

                              return (
                                <div
                                  key={sub._id}
                                  className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition shadow-2xs hover:shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                                >
                                  {/* Left: Deliverable Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[10px] font-bold text-slate-400">#{sub.taskId}</span>
                                      <span className="font-extrabold text-xs text-slate-900 truncate">
                                        {sub.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                        {sub.platform} • {sub.contentType}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        🗓️ {new Date(sub.scheduledDate).toLocaleDateString()} {sub.scheduledTime}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                      <UserIcon size={11} className="text-purple-500" />
                                      <span>Assigned: <strong className="text-slate-800">{emp?.name || 'Unassigned'}</strong> <span className="text-slate-400 text-[10px]">({emp?.designation || 'Staff'})</span></span>
                                    </div>
                                  </div>

                                  {/* Right: Unified Status, Link & Actions */}
                                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto flex-wrap">
                                    {/* Clean Status Pill */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wide border flex items-center gap-1.5 ${
                                      isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      sub.status === 'Submitted' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                      sub.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      sub.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        isDone ? 'bg-emerald-500' :
                                        sub.status === 'Submitted' ? 'bg-amber-500' :
                                        sub.status === 'In Progress' ? 'bg-blue-500' :
                                        sub.status === 'Rejected' ? 'bg-rose-500' :
                                        'bg-slate-400'
                                      }`} />
                                      {isDone ? 'Completed' :
                                       sub.status === 'Submitted' ? 'Under Verification' :
                                       sub.status === 'In Progress' ? 'In Progress' :
                                       sub.status === 'Rejected' ? 'Rejected' : 'Pending'}
                                    </span>

                                    {/* Post Link */}
                                    {sub.publishedUrl && (
                                      <a
                                        href={sub.publishedUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                        title="View Published Social Post"
                                      >
                                        <ExternalLink size={11} />
                                        <span>Post Link</span>
                                      </a>
                                    )}

                                    {/* Action Buttons if not Done */}
                                    {!isDone && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickCompleteTask(sub._id);
                                          }}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition"
                                          title="Mark Task Completed Directly"
                                        >
                                          <CheckSquare size={12} />
                                          <span>Done</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenSubmitUrlModal(sub);
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                                          title="Attach live post URL (Optional)"
                                        >
                                          <Send size={11} />
                                          <span>{sub.status === 'Rejected' ? 'Re-submit' : 'URL'}</span>
                                        </button>
                                      </div>
                                    )}

                                    {/* Manager Verify Action */}
                                    {isManagerOrAdmin && (sub.status === 'Submitted' || sub.verificationStatus === 'Pending Verification') && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVerifyTask(sub);
                                        }}
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <CheckSquare size={12} />
                                        <span>Verify</span>
                                      </button>
                                    )}

                                    {/* Toolset: Edit, Details, Delete */}
                                    <div className="flex items-center space-x-1 pl-1.5 border-l border-slate-200">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditTaskModal(sub);
                                        }}
                                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-700 transition cursor-pointer"
                                        title="Edit Task & Status"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingTask(sub);
                                        }}
                                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                        title="View Task Details"
                                      >
                                        <Eye size={13} />
                                      </button>
                                      {isManagerOrAdmin && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(sub._id, false);
                                          }}
                                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                          title="Delete Deliverable"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
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
                  const isDone = sub.status === 'Verified' || sub.status === 'Completed';

                  return (
                    <div
                      key={sub._id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-purple-700 text-xs">💼 {brand?.brandName || 'Brand'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-[10px] font-bold text-slate-400">#{sub.taskId}</span>
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {sub.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                            {sub.platform} • {sub.contentType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Assigned: {emp?.name || 'Staff'}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1.5 ${
                          isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          sub.status === 'Submitted' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          sub.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isDone ? 'Completed' : sub.status}
                        </span>

                        {sub.publishedUrl && (
                          <a
                            href={sub.publishedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <ExternalLink size={11} />
                            <span>Post</span>
                          </a>
                        )}

                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => handleQuickCompleteTask(sub._id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                          >
                            Done
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditTaskModal(sub)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-600 transition cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
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
        maxWidth="max-w-xl"
        title={
          editingTask
            ? (editingTask.isMainTask ? "Edit Main Brand Task" : "Edit Sub-Task")
            : (creationType === 'main' ? "Create Main Brand Task" : "Create Content Sub-Task")
        }
      >
        <form onSubmit={handleSaveTask} className="space-y-3.5 text-sm font-bold">
          {/* Task Type Switch */}
          {isManagerOrAdmin && !editingTask && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setCreationType('main')}
                className={`py-2 text-xs font-black rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  creationType === 'main'
                    ? 'bg-white text-purple-700 shadow-2xs border border-purple-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📦</span>
                <span>Main Brand Task</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationType('sub')}
                className={`py-2 text-xs font-black rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  creationType === 'sub'
                    ? 'bg-white text-purple-700 shadow-2xs border border-purple-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📄</span>
                <span>Sub-Task Deliverable</span>
              </button>
            </div>
          )}

          {/* Row 1: Brand & Parent Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {creationType === 'sub' && mainTasks.length > 0 && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Parent Main Task</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowParentTaskDropdown(!showParentTaskDropdown);
                      setShowBrandDropdown(false);
                    }}
                    className="w-full bg-purple-50/60 hover:bg-purple-50/90 border border-purple-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">
                        {selectedParentTaskId
                          ? (() => {
                              const p = mainTasks.find(m => m._id === selectedParentTaskId);
                              const b = p?.brandId as any;
                              return p ? `[${b?.brandName || 'Brand'}] ${p.title}` : '-- Select Parent Task (Opt) --';
                            })()
                          : '-- Select Parent Task (Opt) --'}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-purple-400 transition-transform duration-200 shrink-0 ml-1 ${showParentTaskDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Floating Parent Task Dropdown Menu */}
                  {showParentTaskDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowParentTaskDropdown(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search main task..."
                            value={parentTaskSearch}
                            onChange={(e) => setParentTaskSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                          <div
                            onClick={() => {
                              setSelectedParentTaskId('');
                              setShowParentTaskDropdown(false);
                              setParentTaskSearch('');
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                              !selectedParentTaskId ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-600 font-medium'
                            }`}
                          >
                            <span>-- No Parent Task (Independent) --</span>
                          </div>
                          {mainTasks
                            .filter(m => m.title.toLowerCase().includes(parentTaskSearch.toLowerCase()) || ((m.brandId as any)?.brandName || '').toLowerCase().includes(parentTaskSearch.toLowerCase()))
                            .map((main) => {
                              const b = main.brandId as any;
                              const isSelected = selectedParentTaskId === main._id;

                              return (
                                <div
                                  key={main._id}
                                  onClick={() => {
                                    setSelectedParentTaskId(main._id);
                                    if (b?._id) handleBrandChange(b._id);
                                    setShowParentTaskDropdown(false);
                                    setParentTaskSearch('');
                                  }}
                                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                                    isSelected ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-black shrink-0">
                                      {b?.brandName || 'Brand'}
                                    </span>
                                    <span className="truncate">{main.title}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className={creationType === 'sub' && mainTasks.length > 0 ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Brand *</label>
              {/* Custom Floating Searchable Brand Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowBrandDropdown(!showBrandDropdown);
                    setShowParentTaskDropdown(false);
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      💼
                    </div>
                    <span className="truncate">
                      {brands.find(b => b._id === brandId)?.brandName || '-- Select Brand --'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${showBrandDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Brand Dropdown Menu */}
                {showBrandDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBrandDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search brand by name..."
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                        {brands
                          .filter(b => b.brandName.toLowerCase().includes(brandSearch.toLowerCase()) || (b.industry || '').toLowerCase().includes(brandSearch.toLowerCase()))
                          .map((b) => {
                            const isSelected = brandId === b._id;
                            const assigned = getAssignedMemberForBrand(b._id);

                            return (
                              <div
                                key={b._id}
                                onClick={() => {
                                  handleBrandChange(b._id);
                                  setShowBrandDropdown(false);
                                  setBrandSearch('');
                                }}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                                  isSelected ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-xs">💼</span>
                                  <span className="truncate">{b.brandName}</span>
                                  {b.industry && (
                                    <span className="text-[10px] text-slate-400">({b.industry})</span>
                                  )}
                                </div>
                                {assigned && (
                                  <span className="text-[10px] text-purple-600 font-semibold shrink-0 ml-2 bg-purple-50/80 px-1.5 py-0.5 rounded">
                                    👤 {assigned.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        {brands.filter(b => b.brandName.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                          <div className="p-3 text-center text-slate-400 text-xs italic">
                            No brands found matching "{brandSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Title & Assigned Member */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                {creationType === 'main' ? 'Main Task Title *' : 'Sub-Task Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={creationType === 'main' ? "e.g. August Reel Promotion" : "e.g. Single Product Reel Posting"}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Assigned Member
              </label>
              <div className="w-full bg-slate-100/90 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold text-xs flex items-center justify-between cursor-default">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    <UserIcon size={12} />
                  </div>
                  <span className="truncate">
                    {employees.find(e => e._id === employeeId)
                      ? `${employees.find(e => e._id === employeeId)?.name} (${employees.find(e => e._id === employeeId)?.designation || 'Staff'})`
                      : (getAssignedMemberForBrand(brandId)?.name || 'Auto Assigned to Brand Lead')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Platform & Content Type (if Sub-Task) */}
          {creationType === 'sub' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Platform</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlatformDropdown(!showPlatformDropdown);
                      setShowContentTypeDropdown(false);
                      setShowBrandDropdown(false);
                      setShowParentTaskDropdown(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {platform === 'Instagram' ? '📸' : platform === 'YouTube' ? '▶️' : platform === 'TikTok' ? '🎵' : platform === 'X (Twitter)' ? '𝕏' : '💼'}
                      </span>
                      <span>{platform}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${showPlatformDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showPlatformDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPlatformDropdown(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {[
                          { name: 'Instagram', icon: '📸' },
                          { name: 'YouTube', icon: '▶️' },
                          { name: 'TikTok', icon: '🎵' },
                          { name: 'X (Twitter)', icon: '𝕏' },
                          { name: 'LinkedIn', icon: '💼' }
                        ].map(p => (
                          <div
                            key={p.name}
                            onClick={() => {
                              setPlatform(p.name);
                              setShowPlatformDropdown(false);
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition ${
                              platform === p.name ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Content Type</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContentTypeDropdown(!showContentTypeDropdown);
                      setShowPlatformDropdown(false);
                      setShowBrandDropdown(false);
                      setShowParentTaskDropdown(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {contentType === 'Reel' ? '🎬' : contentType === 'Story' ? '⏱️' : contentType === 'Short' ? '⚡' : contentType === 'Video' ? '🎥' : '📝'}
                      </span>
                      <span>{contentType}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${showContentTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showContentTypeDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowContentTypeDropdown(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {[
                          { name: 'Reel', icon: '🎬' },
                          { name: 'Story', icon: '⏱️' },
                          { name: 'Short', icon: '⚡' },
                          { name: 'Video', icon: '🎥' },
                          { name: 'Post', icon: '📝' }
                        ].map(c => (
                          <div
                            key={c.name}
                            onClick={() => {
                              setContentType(c.name);
                              setShowContentTypeDropdown(false);
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition ${
                              contentType === c.name ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Scheduled Date & Scheduled Time / Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none font-bold text-xs"
              />
            </div>

            {creationType === 'sub' ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Scheduled Time</label>
                <input
                  type="text"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none font-bold text-xs"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Priority</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPriorityDropdown(!showPriorityDropdown);
                      setShowBrandDropdown(false);
                      setShowParentTaskDropdown(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {priority === 'Low' ? '🟢' : priority === 'Medium' ? '🟡' : priority === 'High' ? '🟠' : '🔴'}
                      </span>
                      <span>{priority}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showPriorityDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPriorityDropdown(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {[
                          { name: 'Low', icon: '🟢' },
                          { name: 'Medium', icon: '🟡' },
                          { name: 'High', icon: '🟠' },
                          { name: 'Urgent', icon: '🔴' }
                        ].map(p => (
                          <div
                            key={p.name}
                            onClick={() => {
                              setPriority(p.name);
                              setShowPriorityDropdown(false);
                            }}
                            className={`p-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition ${
                              priority === p.name ? 'bg-purple-50 text-purple-900 font-extrabold border border-purple-200/80' : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 5: Remarks / Notes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Remarks / Notes (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any specific remarks, delivery instructions, or notes..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs resize-none"
            />
          </div>

          {/* Row 6: Task Status Selector (when editing) */}
          {editingTask && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase">
                  Task Status *
                </label>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Current: {taskStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { val: 'Pending', label: 'Pending', icon: '⏳', color: 'border-slate-200 hover:border-slate-300 text-slate-700', active: 'bg-slate-800 text-white border-slate-800 shadow-xs' },
                  { val: 'In Progress', label: 'In Progress', icon: '⚡', color: 'border-blue-200 hover:border-blue-300 text-blue-700 bg-blue-50/40', active: 'bg-blue-600 text-white border-blue-600 shadow-xs' },
                  { val: 'Submitted', label: 'Submitted', icon: '📤', color: 'border-amber-200 hover:border-amber-300 text-amber-800 bg-amber-50/40', active: 'bg-amber-500 text-white border-amber-500 shadow-xs' },
                  { val: 'Verified', label: 'Completed', icon: '✓', color: 'border-emerald-200 hover:border-emerald-300 text-emerald-800 bg-emerald-50/40', active: 'bg-emerald-600 text-white border-emerald-600 shadow-xs' },
                  { val: 'Rejected', label: 'Rejected', icon: '✕', color: 'border-rose-200 hover:border-rose-300 text-rose-700 bg-rose-50/40', active: 'bg-rose-600 text-white border-rose-600 shadow-xs' },
                ].map((st) => {
                  const isSelected = taskStatus === st.val;
                  return (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => setTaskStatus(st.val as any)}
                      className={`p-2 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected ? st.active : `bg-white ${st.color}`
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTask}
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
              {viewingTask.remarks && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 mt-2">
                  <span className="font-extrabold block text-[10px] uppercase text-purple-700 mb-0.5">Remarks / Notes</span>
                  <p className="text-xs font-medium">{viewingTask.remarks}</p>
                </div>
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
