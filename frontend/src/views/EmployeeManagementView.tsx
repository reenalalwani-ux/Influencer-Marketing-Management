import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Filter, Mail, Phone, Shield, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { Employee } from '../types';
import { Modal } from '../components/Modal';

export const EmployeeManagementView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Influencer Marketing');
  const [designation, setDesignation] = useState('Influencer Executive');
  const [role, setRole] = useState('Employee');
  const [password, setPassword] = useState('User@123');

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
    try {
      const res = await api.post('/employees', {
        name, email, phone, department, designation, role, password
      });
      if (res.success) {
        setShowAddModal(false);
        fetchEmployees();
        // Reset form
        setName(''); setEmail(''); setPhone('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Users className="text-purple-600" />
            Employee Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage internal company staff, designations, and roles</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl flex items-center space-x-3 border border-slate-200 shadow-xs">
        <Search size={18} className="text-purple-600 ml-1" />
        <input
          type="text"
          placeholder="Search by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>

      {/* Employees Grid / Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading employee list...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div key={emp._id} className="bg-white glass-card-hover p-5 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{emp.name}</h3>
                    <span className="text-xs text-purple-600 font-bold">{emp.employeeId}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${emp.status === 'Active' ? 'badge-verified' : 'badge-rejected'
                  }`}>
                  {emp.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Designation:</span>
                  <span className="font-semibold text-slate-800">{emp.designation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-800">{emp.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">System Role:</span>
                  <span className="text-purple-600 font-bold">{emp.role}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-500 pt-1">
                  <Mail size={13} className="text-slate-400" />
                  <span>{emp.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              placeholder="ananya@influencer.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Phone</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              >
                <option value="Influencer Marketing">Influencer Marketing</option>
                <option value="Content Creation">Content Creation</option>
                <option value="Campaign Strategy">Campaign Strategy</option>
                <option value="Quality Control">Quality Control</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
              >
                <option value="Employee">Employee</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Marketing Manager">Marketing Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Designation</label>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Influencer Executive"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Default Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
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
              Create Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
