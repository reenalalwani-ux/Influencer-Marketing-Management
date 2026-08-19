import React, { useState, useEffect, FormEvent } from 'react';
import { UserCheck, Plus, Trash2, Edit2, Briefcase, User as UserIcon, CheckSquare, Square, Search, X, Eye, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Employee, Brand, EmployeeBrandAssignment, User } from '../types';
import { Modal } from '../components/Modal';
import { InlineLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

interface GroupedAssignment {
  employeeId: string;
  employee: Employee;
  assignments: EmployeeBrandAssignment[];
  brands: Brand[];
  responsibility: string;
  priority: string;
  status: string;
  startDate: string;
}

interface EmployeeBrandAssignmentViewProps {
  userRole?: string;
  currentUser?: User | null;
}

export const EmployeeBrandAssignmentView: React.FC<EmployeeBrandAssignmentViewProps> = ({ userRole, currentUser }) => {
  const isEmployeeRole = userRole === 'Employee' || currentUser?.role === 'Employee';

  const [rawAssignments, setRawAssignments] = useState<EmployeeBrandAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [viewingGroup, setViewingGroup] = useState<GroupedAssignment | null>(null);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [responsibility, setResponsibility] = useState('Brand Operations & Content Posting');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');

  const fetchData = async () => {
    try {
      const [assignRes, empRes, brandRes] = await Promise.all([
        api.get('/employee-brands'),
        api.get('/employees'),
        api.get('/brands')
      ]);

      if (assignRes.success) setRawAssignments(assignRes.data);
      if (empRes.success) setEmployees(empRes.data.filter((e: Employee) => e.status === 'Active'));
      if (brandRes.success) setBrands(brandRes.data.filter((b: Brand) => b.status === 'Active'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group raw assignments by employeeId
  const groupedMap = new Map<string, GroupedAssignment>();

  rawAssignments.forEach((item) => {
    const emp = item.employeeId as any;
    const brd = item.brandId as any;
    if (!emp) return;

    const empId = typeof emp === 'object' ? (emp._id || emp.id) : String(emp);
    if (!empId) return;

    const empObj = typeof emp === 'object' ? emp : (employees.find(e => e._id === emp) || { _id: emp, name: 'Staff', designation: '' });
    const brdObj = typeof brd === 'object' ? brd : (brands.find(b => b._id === brd) || { _id: brd, brandName: 'Brand', industry: '' });

    if (!groupedMap.has(empId)) {
      groupedMap.set(empId, {
        employeeId: empId,
        employee: empObj,
        assignments: [item],
        brands: brdObj && (brdObj._id || brdObj.brandName) ? [brdObj] : [],
        responsibility: item.responsibility || 'Brand Operations & Content Posting',
        priority: item.priority || 'High',
        status: item.status || 'Active',
        startDate: item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'
      });
    } else {
      const existing = groupedMap.get(empId)!;
      existing.assignments.push(item);
      const bId = brdObj?._id || (brdObj as any)?.id;
      if (bId && !existing.brands.some(b => (b._id || (b as any).id) === bId)) {
        existing.brands.push(brdObj);
      }
    }
  });

  const groupedAssignments = Array.from(groupedMap.values());

  const openCreateModal = () => {
    setEditingEmployeeId(null);
    setSelectedEmployeeId('');
    setSelectedBrandIds([]);
    setBrandSearch('');
    setResponsibility('Brand Operations & Content Posting');
    setPriority('High');
    setShowAssignModal(true);
  };

  const openEditModal = (group: GroupedAssignment) => {
    setEditingEmployeeId(group.employeeId);
    setSelectedEmployeeId(group.employeeId);
    setSelectedBrandIds(group.brands.map(b => b._id));
    setBrandSearch('');
    setResponsibility(group.responsibility);
    setPriority(group.priority as any);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert('Please select an employee.');
      return;
    }

    setSavingAssignments(true);
    try {
      const res = await api.post('/employee-brands/sync-employee', {
        employeeId: selectedEmployeeId,
        brandIds: selectedBrandIds,
        responsibility,
        priority
      });

      if (res.success) {
        setShowAssignModal(false);
        setEditingEmployeeId(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save brand assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleRemoveAllForEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove all brand assignments for this employee?')) return;
    try {
      const res = await api.delete(`/employee-brands/employee/${employeeId}`);
      if (res.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignments');
    }
  };

  const handleToggleStatus = async (group: GroupedAssignment) => {
    const newStatus = group.status === 'Active' ? 'Removed' : 'Active';
    try {
      await Promise.all(
        group.assignments.map(a => api.put(`/employee-brands/${a._id}`, { status: newStatus }))
      );
      fetchData();
    } catch (err: any) {
      console.error('Failed to update status', err);
    }
  };

  const filteredBrandsForSelect = brands.filter(b =>
    b.brandName.toLowerCase().includes(brandSearch.toLowerCase()) ||
    b.industry.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const columns: DataTableColumn<GroupedAssignment>[] = [
    {
      key: 'employee',
      label: 'Employee',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
            <UserIcon size={16} />
          </div>
          <div>
            <div className="text-slate-900 font-extrabold text-xs">{row.employee?.name || 'N/A'}</div>
            <div className="text-[10px] text-purple-600 font-bold">{row.employee?.designation || 'Staff'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'brands',
      label: 'Assigned Brands',
      sortable: false,
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          {row.brands.map((b) => (
            <span
              key={b._id}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1 shadow-2xs"
            >
              <Briefcase size={12} className="text-purple-600 shrink-0" />
              <span>{b.brandName}</span>
            </span>
          ))}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200">
            {row.brands.length} {row.brands.length === 1 ? 'Brand' : 'Brands'}
          </span>
        </div>
      ),
    },
    { key: 'responsibility', label: 'Responsibility', sortable: false },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          val === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
          val === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => {
        const isActive = row.status === 'Active';
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-teal-600' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={isActive}
            title={isActive ? 'Active (Click to disable)' : 'Removed (Click to enable)'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-1 whitespace-nowrap">
          {isEmployeeRole ? (
            <button
              onClick={() => setViewingGroup(row)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition font-extrabold text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="View Assigned Brands Portfolio"
            >
              <Eye size={14} />
              <span>View</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                title="Edit Brand Assignments"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => handleRemoveAllForEmployee(row.employeeId)}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Remove All Assignments"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Brand Assignments</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Efficient multi-brand assignment dashboard grouped by team member.
            </p>
          </div>
        </div>

        {!isEmployeeRole && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md cursor-pointer"
          >
            <Plus size={18} />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {loading ? (
        <InlineLoader message="Loading brand assignments..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={groupedAssignments}
            rowKey="employeeId"
            emptyMessage="No employee brand assignments found."
          />
        </div>
      )}

      {/* Assign / Edit Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={editingEmployeeId ? "Edit Employee Brand Portfolio" : "Assign Brands to Employee"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveAssignments} className="space-y-4 text-sm font-bold">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Employee *</label>
            <select
              required
              disabled={!!editingEmployeeId}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs disabled:opacity-60"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation})</option>
              ))}
            </select>
          </div>

          {/* Searchable Multi-Select Brand Picker for 100+ Brands */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase">Assigned Brands *</label>
              <div className="flex items-center space-x-2">
                {selectedBrandIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBrandIds([])}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-[10px] text-purple-700 font-black bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {selectedBrandIds.length} Selected
                </span>
              </div>
            </div>

            {/* Selected Brand Badges Cloud */}
            {selectedBrandIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-purple-50/50 rounded-xl border border-purple-100 mb-2 max-h-32 overflow-y-auto">
                {selectedBrandIds.map(id => {
                  const brand = brands.find(b => b._id === id);
                  return (
                    <span
                      key={id}
                      className="px-2.5 py-1 bg-white text-purple-900 border border-purple-200 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{brand?.brandName || id}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBrandIds(selectedBrandIds.filter(bId => bId !== id))}
                        className="text-purple-400 hover:text-rose-600 transition"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Input for Brands */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by brand name or industry..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium text-xs"
              />
            </div>

            {/* Filtered Brands List */}
            <div className="space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto">
              {filteredBrandsForSelect.length === 0 ? (
                <p className="text-slate-400 text-xs italic font-medium p-3 text-center">
                  No brands found matching "{brandSearch}".
                </p>
              ) : (
                filteredBrandsForSelect.map((b) => {
                  const isChecked = selectedBrandIds.includes(b._id);
                  return (
                    <div
                      key={b._id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedBrandIds(selectedBrandIds.filter(id => id !== b._id));
                        } else {
                          setSelectedBrandIds([...selectedBrandIds, b._id]);
                        }
                      }}
                      className={`p-2 rounded-xl border text-xs font-extrabold flex items-center justify-between cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isChecked ? <CheckSquare size={16} className="shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                        <span className="truncate">{b.brandName}</span>
                      </div>
                      <span className={`text-[10px] font-semibold ${isChecked ? 'text-purple-100' : 'text-slate-400'}`}>
                        {b.industry}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Responsibility / Role *</label>
            <input
              type="text"
              required
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              placeholder="e.g. Brand Operations & Content Posting"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-bold text-xs"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAssignments}
              className="px-4 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingAssignments ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingEmployeeId ? "Save Portfolio Changes" : "Create Assignment"}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Brand Assignment Modal for Employee */}
      {viewingGroup && (
        <Modal
          isOpen={!!viewingGroup}
          onClose={() => setViewingGroup(null)}
          title={`Assigned Brands Portfolio - ${viewingGroup.employee?.name || 'Staff'}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm">
                {(viewingGroup.employee?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{viewingGroup.employee?.name}</h4>
                <p className="text-xs font-bold text-purple-700">{viewingGroup.employee?.designation || 'Influencer Executive'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase text-slate-500 mb-2 block">
                Assigned Brands Portfolio ({viewingGroup.brands.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {viewingGroup.brands.map((b) => (
                  <div key={b._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs shrink-0">
                      <Briefcase size={14} />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{b.brandName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{b.industry || 'General Industry'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Responsibility</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{viewingGroup.responsibility}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Priority Level</span>
                <p className="text-xs font-bold text-purple-700 mt-0.5">{viewingGroup.priority}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingGroup(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition border border-slate-200 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
