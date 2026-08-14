import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Mail, Eye, Edit2, Trash2, CheckCircle2, Phone, Briefcase, Calendar, Shield } from 'lucide-react';
import { api } from '../services/api';
import { Employee } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

export const EmployeeManagementView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form fields for Create & Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Influencer Marketing');
  const [designation, setDesignation] = useState('Influencer Executive');
  const [role, setRole] = useState('Employee');
  const [password, setPassword] = useState('User@123');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.success) setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.toLowerCase().trim().endsWith('@ad2ship.com')) {
      alert('Validation Error: Employee work email address must use the @ad2ship.com company domain.');
      return;
    }

    try {
      const res = await api.post('/employees', {
        name, email: email.toLowerCase().trim(), phone, department, designation, role, password
      });
      if (res.success) {
        setShowAddModal(false);
        fetchEmployees();
        setName(''); setEmail(''); setPhone(''); setPassword('User@123');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setDepartment(emp.department || 'Influencer Marketing');
    setDesignation(emp.designation || 'Influencer Executive');
    setRole(emp.role || 'Employee');
    setStatus(emp.status as any || 'Active');
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const res = await api.put(`/employees/${editingEmployee._id}`, {
        name, phone, department, designation, role, status
      });
      if (res.success) {
        setEditingEmployee(null);
        fetchEmployees();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.put(`/employees/${emp._id}`, { status: newStatus });
      if (res.success) {
        setEmployees(prev =>
          prev.map(e => (e._id === emp._id ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    if (!window.confirm(`Are you sure you want to delete employee "${empName}"? This action cannot be undone.`)) return;

    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.success) {
        fetchEmployees();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: DataTableColumn<Employee>[] = [
    {
      key: 'name',
      label: 'Employee',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-sm shadow shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">{row.name}</div>
            <div className="text-[10px] text-purple-600 font-bold">{row.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail size={12} className="text-slate-400" />
          <span className="font-medium">{val}</span>
        </div>
      ),
    },
    { key: 'designation', label: 'Designation', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'role',
      label: 'System Role',
      sortable: true,
      render: (val) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
          {val}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val, row) => {
        const isActive = val === 'Active';
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-teal-600' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={isActive}
            title={isActive ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
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
      key: 'actions' as any,
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewingEmployee(row)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 transition cursor-pointer"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 transition cursor-pointer"
            title="Edit Employee"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDeleteEmployee(row._id, row.name)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employees Directory</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage internal company staff, designations, and roles.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md cursor-pointer"
        >
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl flex items-center space-x-3 border border-slate-200 shadow-xs">
        <Search size={16} className="text-purple-600 ml-1 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
        <span className="text-xs text-slate-400 font-medium shrink-0">{filteredEmployees.length} records</span>
      </div>

      {/* Data Table */}
      {loading ? (
        <InlineLoader message="Loading employee list..." />
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={paginatedEmployees}
            rowKey="_id"
            emptyMessage="No employees found matching your search."
          />
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredEmployees.length / itemsPerPage)}
              totalItems={filteredEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* View Employee Details Modal */}
      <Modal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        title="Employee Information Details"
      >
        {viewingEmployee && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-lg border border-purple-200">
                  {viewingEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{viewingEmployee.name}</h3>
                  <p className="text-xs text-purple-700 font-bold">{viewingEmployee.employeeId}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                viewingEmployee.status === 'Active' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {viewingEmployee.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase">Work Email</label>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingEmployee.email}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase">Phone Number</label>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingEmployee.phone || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase">Department</label>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingEmployee.department || 'Influencer Marketing'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase">Designation</label>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{viewingEmployee.designation || 'Influencer Executive'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">System Role</label>
                <div className="font-bold text-purple-700 text-xs mt-0.5">{viewingEmployee.role || 'Employee'}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title="Edit Employee Account & Profile"
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Email (Read Only)</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Marketing Manager">Marketing Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingEmployee(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya Roy"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ananya@ad2ship.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Marketing Manager">Marketing Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Default Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer"
            >
              Create Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
