import React, { useState, useEffect, FormEvent } from 'react';
import { UserCheck, Plus, Trash2, Edit2, Briefcase, User as UserIcon, CheckSquare, Square, Search, X, Eye, Loader2, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { Employee, Brand, EmployeeBrandAssignment, User } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
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
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [assignMemberSearch, setAssignMemberSearch] = useState('');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [responsibility, setResponsibility] = useState('Brand Operations & Content Posting');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');

  // Transfer Brand states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringBrand, setTransferringBrand] = useState(false);
  const [transferSelectedBrandId, setTransferSelectedBrandId] = useState('');
  const [transferBrandSearch, setTransferBrandSearch] = useState('');
  const [transferFromEmployeeId, setTransferFromEmployeeId] = useState('');
  const [transferToEmployeeId, setTransferToEmployeeId] = useState('');
  const [showToEmployeeDropdown, setShowToEmployeeDropdown] = useState(false);
  const [toEmployeeSearch, setToEmployeeSearch] = useState('');
  const [transferResponsibility, setTransferResponsibility] = useState('Brand Operations & Content Posting');
  const [transferPriority, setTransferPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');

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
    setShowMemberDropdown(false);
    setAssignMemberSearch('');
    setSelectedBrandIds([]);
    setBrandSearch('');
    setResponsibility('Brand Operations & Content Posting');
    setPriority('High');
    setShowAssignModal(true);
  };

  const openEditModal = (group: GroupedAssignment) => {
    setEditingEmployeeId(group.employeeId);
    setSelectedEmployeeId(group.employeeId);
    setShowMemberDropdown(false);
    setAssignMemberSearch('');
    setSelectedBrandIds(group.brands.map(b => b._id));
    setBrandSearch('');
    setResponsibility(group.responsibility);
    setPriority(group.priority as any);
    setShowAssignModal(true);
  };

  // List of all currently assigned brands with their owner
  const allAssignedBrandsList: { brand: Brand; currentEmp: Employee | null }[] = [];
  rawAssignments.forEach((item) => {
    if (item.status === 'Active') {
      const emp = item.employeeId as any;
      const brd = item.brandId as any;
      const empId = typeof emp === 'object' ? (emp?._id || emp?.id) : String(emp);
      const bId = typeof brd === 'object' ? (brd?._id || brd?.id) : String(brd);

      const brandObj = typeof brd === 'object' ? brd : brands.find(b => b._id === bId);
      const empObj = typeof emp === 'object' ? emp : employees.find(e => e._id === empId);

      if (brandObj && (brandObj._id || brandObj.brandName)) {
        if (!allAssignedBrandsList.some(x => x.brand._id === (brandObj._id || bId))) {
          allAssignedBrandsList.push({
            brand: brandObj,
            currentEmp: empObj || null
          });
        }
      }
    }
  });
  allAssignedBrandsList.sort((a, b) => (a.brand.brandName || '').localeCompare(b.brand.brandName || ''));

  const openTransferModal = (brandId?: string, fromEmployeeId?: string) => {
    if (brandId) {
      setTransferSelectedBrandId(brandId);
      if (fromEmployeeId) {
        setTransferFromEmployeeId(fromEmployeeId);
      } else {
        const match = allAssignedBrandsList.find(x => x.brand._id === brandId);
        setTransferFromEmployeeId(match?.currentEmp?._id || '');
      }
    } else if (fromEmployeeId) {
      setTransferFromEmployeeId(fromEmployeeId);
      const firstBrandOfEmp = allAssignedBrandsList.find(x => x.currentEmp?._id === fromEmployeeId);
      setTransferSelectedBrandId(firstBrandOfEmp?.brand._id || '');
    } else {
      setTransferSelectedBrandId(allAssignedBrandsList[0]?.brand._id || '');
      setTransferFromEmployeeId(allAssignedBrandsList[0]?.currentEmp?._id || '');
    }

    setTransferBrandSearch('');
    setTransferToEmployeeId('');
    setShowToEmployeeDropdown(false);
    setToEmployeeSearch('');
    setTransferResponsibility('Brand Operations & Content Posting');
    setTransferPriority('High');
    setShowTransferModal(true);
  };

  const handleTransferBrandSelect = (bId: string) => {
    setTransferSelectedBrandId(bId);
    const match = allAssignedBrandsList.find(x => x.brand._id === bId);
    if (match && match.currentEmp) {
      setTransferFromEmployeeId(match.currentEmp._id);
    } else {
      setTransferFromEmployeeId('');
    }
  };

  const handleTransferBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!transferSelectedBrandId || !transferToEmployeeId) {
      alert('Please select both a brand and the target employee.');
      return;
    }
    if (transferFromEmployeeId && transferFromEmployeeId === transferToEmployeeId) {
      alert('Target employee must be different from the current employee.');
      return;
    }

    setTransferringBrand(true);
    try {
      const res = await api.post('/employee-brands/transfer', {
        brandId: transferSelectedBrandId,
        fromEmployeeId: transferFromEmployeeId || undefined,
        toEmployeeId: transferToEmployeeId,
        responsibility: transferResponsibility,
        priority: transferPriority
      });

      if (res.success) {
        setShowTransferModal(false);
        setTransferSelectedBrandId('');
        setTransferFromEmployeeId('');
        setTransferToEmployeeId('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to transfer brand');
    } finally {
      setTransferringBrand(false);
    }
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

  // Delete Confirmation Panel State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemName?: string;
    loading: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    loading: false,
    onConfirm: async () => {}
  });

  const requestRemoveAllForEmployee = (group: GroupedAssignment) => {
    setDeleteModalState({
      isOpen: true,
      itemName: `${group.employee?.name || 'Executive'} (${group.brands.length} assigned brands)`,
      loading: false,
      onConfirm: async () => {
        setDeleteModalState(prev => ({ ...prev, loading: true }));
        try {
          const res = await api.delete(`/employee-brands/employee/${group.employeeId}`);
          if (res.success) {
            setDeleteModalState(prev => ({ ...prev, isOpen: false }));
            fetchData();
          }
        } catch (err: any) {
          alert(err.message || 'Failed to delete assignments');
        } finally {
          setDeleteModalState(prev => ({ ...prev, loading: false }));
        }
      }
    });
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

  // Enforce 1 brand = 1 person: Track all brands currently assigned to ANY team member in DB
  const allAssignedBrandIds = new Set<string>();

  rawAssignments.forEach((item) => {
    if (item.status === 'Active') {
      const brd = item.brandId as any;
      const bId = typeof brd === 'object' ? (brd?._id || brd?.id) : String(brd);
      if (bId) allAssignedBrandIds.add(bId);
    }
  });

  // Only show brands that are completely UNASSIGNED to anyone in the team
  const unassignedBrandsForSelect = brands.filter((b) => !allAssignedBrandIds.has(b._id));

  const filteredBrandsForSelect = unassignedBrandsForSelect.filter((b) =>
    b.brandName.toLowerCase().includes(brandSearch.toLowerCase()) ||
    b.industry.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const columns: DataTableColumn<GroupedAssignment>[] = [
    {
      key: 'employee',
      label: 'Member',
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
              onClick={() => !isEmployeeRole && openTransferModal(b._id, row.employeeId)}
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 shadow-2xs ${!isEmployeeRole ? 'cursor-pointer hover:bg-purple-100 hover:border-purple-300 transition' : ''}`}
              title={!isEmployeeRole ? `Click to Transfer "${b.brandName}" to another member` : undefined}
            >
              <Briefcase size={12} className="text-purple-600 shrink-0" />
              <span>{b.brandName}</span>
              {!isEmployeeRole && (
                <ArrowRightLeft size={11} className="text-purple-400 hover:text-purple-700 ml-0.5" />
              )}
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
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${val === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
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
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            role="switch"
            aria-checked={isActive}
            title={isActive ? 'Active (Click to disable)' : 'Removed (Click to enable)'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
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
                onClick={() => requestRemoveAllForEmployee(row)}
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
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => openTransferModal()}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Transfer a Brand between team members"
            >
              <ArrowRightLeft size={16} className="text-purple-600" />
              <span>Transfer Brand</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <Plus size={18} />
              <span>New Assignment</span>
            </button>
          </div>
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
          {/* Member Selection Dropdown */}
          <div className="relative">
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
              Select Member *
            </label>

            {editingEmployeeId ? (
              /* Locked Member Card in Edit Mode */
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <UserIcon size={14} />
                  </div>
                  <div>
                    <div className="text-slate-900 font-extrabold text-xs">
                      {employees.find(e => e._id === selectedEmployeeId)?.name || 'Member'}
                    </div>
                    <div className="text-[10px] text-purple-700 font-semibold">
                      {employees.find(e => e._id === selectedEmployeeId)?.designation || 'Staff'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-white text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-bold">
                  Editing Portfolio
                </span>
              </div>
            ) : (
              /* Custom Floating Member Dropdown */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2.5 text-slate-900 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <UserIcon size={12} />
                    </div>
                    <span className="truncate">
                      {employees.find(e => e._id === selectedEmployeeId)?.name
                        ? `${employees.find(e => e._id === selectedEmployeeId)?.name} (${employees.find(e => e._id === selectedEmployeeId)?.designation || 'Staff'})`
                        : '-- Select Member --'}
                    </span>
                  </div>
                  <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${showMemberDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Dropdown Menu */}
                {showMemberDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMemberDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-purple-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search member by name..."
                          value={assignMemberSearch}
                          onChange={(e) => setAssignMemberSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                        {employees
                          .filter(e => e.name.toLowerCase().includes(assignMemberSearch.toLowerCase()) || (e.designation || '').toLowerCase().includes(assignMemberSearch.toLowerCase()))
                          .map((emp) => {
                            const isSelected = selectedEmployeeId === emp._id;
                            const assignedGroup = groupedAssignments.find(g => g.employeeId === emp._id);
                            const brandCount = assignedGroup?.brands.length || 0;

                            return (
                              <div
                                key={emp._id}
                                onClick={() => {
                                  const newEmpId = emp._id;
                                  setSelectedEmployeeId(newEmpId);
                                  setShowMemberDropdown(false);
                                  setAssignMemberSearch('');
                                  if (assignedGroup) {
                                    setSelectedBrandIds(assignedGroup.brands.map(b => b._id));
                                    setResponsibility(assignedGroup.responsibility || 'Brand Operations & Content Posting');
                                    setPriority(assignedGroup.priority as any || 'High');
                                  } else {
                                    setSelectedBrandIds([]);
                                  }
                                }}
                                className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-purple-600 text-white shadow-2xs'
                                    : 'hover:bg-purple-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="truncate">{emp.name}</span>
                                  <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                                    ({emp.designation || 'Staff'})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {brandCount} {brandCount === 1 ? 'Brand' : 'Brands'}
                                  </span>
                                  {isSelected && <CheckSquare size={14} className="text-white shrink-0" />}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
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
                placeholder="Search unassigned brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium text-xs"
              />
            </div>

            {/* Unassigned Brands Counter Header */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-extrabold mb-1.5 px-0.5">
              <span>{filteredBrandsForSelect.length} Unassigned Brands Available to Add</span>
            </div>

            {/* Filtered Brands List */}
            <div className="space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto">
              {filteredBrandsForSelect.length === 0 ? (
                <p className="text-slate-400 text-xs italic font-medium p-4 text-center">
                  {brandSearch ? `No unassigned brands matching "${brandSearch}".` : 'No unassigned brands available (All brands are currently assigned to team members).'}
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
                      className={`p-2 rounded-xl border text-xs font-extrabold flex items-center justify-between cursor-pointer transition select-none ${isChecked
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

      {/* Transfer Brand Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Brand Assignment"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleTransferBrand} className="space-y-4 text-sm font-bold">
          {/* Header Banner */}
          <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-2xl text-xs text-purple-950 flex items-center gap-2.5 shadow-2xs">
            <ArrowRightLeft size={16} className="text-purple-600 shrink-0" />
            <p className="leading-tight">
              Transferring a brand will reassign it from the current member to the new member while preserving all team data.
            </p>
          </div>

          {/* 1. Select Brand to Transfer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                1. Select Brand to Transfer *
              </label>
              {transferSelectedBrandId && (
                <span className="text-[10px] text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">
                  Selected: {allAssignedBrandsList.find(x => x.brand._id === transferSelectedBrandId)?.brand.brandName}
                </span>
              )}
            </div>

            {/* Search Input for Brands */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search brand name or current manager..."
                value={transferBrandSearch}
                onChange={(e) => setTransferBrandSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium text-xs shadow-2xs"
              />
            </div>

            {/* Scrollable Brands Grid */}
            <div className="space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto">
              {allAssignedBrandsList
                .filter(item => {
                  const q = transferBrandSearch.toLowerCase();
                  const bName = item.brand.brandName?.toLowerCase() || '';
                  const empName = item.currentEmp?.name?.toLowerCase() || '';
                  const ind = item.brand.industry?.toLowerCase() || '';
                  return bName.includes(q) || empName.includes(q) || ind.includes(q);
                })
                .sort((a, b) => {
                  const aSelected = a.brand._id === transferSelectedBrandId;
                  const bSelected = b.brand._id === transferSelectedBrandId;
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return (a.brand.brandName || '').localeCompare(b.brand.brandName || '');
                })
                .map(({ brand, currentEmp }) => {
                  const isSelected = transferSelectedBrandId === brand._id;
                  return (
                    <div
                      key={brand._id}
                      onClick={() => handleTransferBrandSelect(brand._id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition select-none ${isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-purple-50/60 hover:border-purple-200'
                        }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Briefcase size={14} className={isSelected ? 'text-white' : 'text-purple-600 shrink-0'} />
                        <span className="font-extrabold truncate">{brand.brandName}</span>
                        {brand.industry && (
                          <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${isSelected ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {brand.industry}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                          👤 {currentEmp?.name || 'Staff'}
                        </span>
                        {isSelected && <CheckSquare size={16} className="text-white shrink-0" />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 2. Visual Transfer Route Card: [From Current Owner] -> [To New Assignee] */}
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            {/* From */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                <UserIcon size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">From (Current Owner)</span>
                <div className="font-extrabold text-xs text-slate-900 truncate">
                  {employees.find(e => e._id === transferFromEmployeeId)?.name || (transferSelectedBrandId ? 'Current Owner' : 'Select Brand First')}
                </div>
              </div>
            </div>

            {/* Transfer Arrow Icon */}
            <div className="flex items-center justify-center px-1 shrink-0">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <ArrowRightLeft size={13} />
              </div>
            </div>

            {/* To */}
            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                <UserIcon size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-emerald-700 block tracking-wider">To (New Assignee)</span>
                <div className="font-extrabold text-xs text-emerald-900 truncate">
                  {employees.find(e => e._id === transferToEmployeeId)?.name
                    ? `${employees.find(e => e._id === transferToEmployeeId)?.name}`
                    : 'Select Member Below'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Select Destination Member (Searchable List) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                2. Select New Team Member to Assign *
              </label>
              {transferToEmployeeId && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Target: {employees.find(e => e._id === transferToEmployeeId)?.name}
                </span>
              )}
            </div>

            {/* Search Input for Members */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search member name or designation..."
                value={toEmployeeSearch}
                onChange={(e) => setToEmployeeSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium text-xs shadow-2xs"
              />
            </div>

            {/* Scrollable Members List */}
            <div className="space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto">
              {employees
                .filter(e => e._id !== transferFromEmployeeId)
                .filter(e => e.name.toLowerCase().includes(toEmployeeSearch.toLowerCase()) || (e.designation || '').toLowerCase().includes(toEmployeeSearch.toLowerCase()))
                .sort((a, b) => {
                  const aSelected = a._id === transferToEmployeeId;
                  const bSelected = b._id === transferToEmployeeId;
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return (a.name || '').localeCompare(b.name || '');
                })
                .map((emp) => {
                  const isSelected = transferToEmployeeId === emp._id;
                  return (
                    <div
                      key={emp._id}
                      onClick={() => setTransferToEmployeeId(emp._id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition select-none ${isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-200'
                        }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                          <UserIcon size={12} />
                        </div>
                        <span className="font-extrabold truncate">{emp.name}</span>
                        <span className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {emp.designation || 'Influencer Executive'}
                        </span>
                      </div>

                      {isSelected && <CheckSquare size={16} className="text-white shrink-0" />}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 4. Responsibility */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
              Responsibility / Role
            </label>
            <input
              type="text"
              value={transferResponsibility}
              onChange={(e) => setTransferResponsibility(e.target.value)}
              placeholder="e.g. Brand Operations & Content Posting"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium text-xs"
            />
          </div>

          {/* 5. Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferringBrand || !transferSelectedBrandId || !transferToEmployeeId}
              className="px-5 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transferringBrand ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Transferring Brand...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft size={14} />
                  <span>Confirm & Transfer Brand</span>
                </>
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

      {/* REUSABLE DELETE CONFIRMATION MODAL PANEL */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
        title="Confirm Remove All Brand Assignments"
        itemType="executive brand assignments for"
        itemName={deleteModalState.itemName}
        warningMessage="This will deactivate all brand assignments currently assigned to this executive."
        loading={deleteModalState.loading}
      />
    </div>
  );
};
