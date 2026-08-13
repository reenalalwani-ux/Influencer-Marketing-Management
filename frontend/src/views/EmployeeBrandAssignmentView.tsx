import { useState, useEffect, FormEvent } from 'react';
import { UserCheck, Plus, Trash2, Calendar, Shield, Briefcase, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { Employee, Brand, EmployeeBrandAssignment } from '../types';
import { Modal } from '../components/Modal';
import { InlineLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

export const EmployeeBrandAssignmentView = () => {
  const [assignments, setAssignments] = useState<EmployeeBrandAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assignment form fields
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [responsibility, setResponsibility] = useState('Brand Operations & Content Posting');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');

  const fetchData = async () => {
    try {
      const [assignRes, empRes, brandRes] = await Promise.all([
        api.get('/employee-brands'),
        api.get('/employees'),
        api.get('/brands')
      ]);

      if (assignRes.success) setAssignments(assignRes.data);
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

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedBrandId) {
      alert('Please select both an employee and a brand.');
      return;
    }

    try {
      const res = await api.post('/employee-brands/assign', {
        employeeId: selectedEmployeeId,
        brandId: selectedBrandId,
        responsibility,
        priority
      });

      if (res.success) {
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign employee to brand');
    }
  };

  const handleUnassign = async (id: string) => {
    if (!confirm('Are you sure you want to unassign this employee from the brand?')) return;
    try {
      const res = await api.patch(`/employee-brands/${id}/unassign`);
      if (res.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to unassign');
    }
  };

  const columns: DataTableColumn<EmployeeBrandAssignment>[] = [
    {
      key: 'employee',
      label: 'Employee',
      sortable: true,
      render: (_, row) => {
        const emp = row.employeeId as any;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
              <UserIcon size={14} />
            </div>
            <div>
              <div className="text-slate-900 font-extrabold text-xs">{emp?.name || 'N/A'}</div>
              <div className="text-[10px] text-slate-500 font-medium">{emp?.designation}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'brand',
      label: 'Assigned Brand',
      sortable: true,
      render: (_, row) => {
        const brand = row.brandId as any;
        return (
          <div>
            <div className="font-extrabold text-purple-700 flex items-center gap-1.5 text-xs">
              <Briefcase size={13} />
              {brand?.brandName || 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">{brand?.industry}</div>
          </div>
        );
      },
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
      key: 'startDate',
      label: 'Assigned Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-600 font-semibold font-mono">
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${val === 'Active' ? 'badge-verified' : 'badge-rejected'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="text-right">
          {row.status === 'Active' && (
            <button
              onClick={() => handleUnassign(row._id)}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition border border-rose-200 font-bold"
              title="Unassign Employee"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <UserCheck className="text-purple-600" />
            Employee-Brand Assignments
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Separate <span className="font-mono text-purple-700 font-bold text-xs bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">employee_brands</span> relationship collection
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>New Assignment</span>
        </button>
      </div>

      {loading ? (
        <InlineLoader message="Loading assignments..." />
      ) : (
        <DataTable
          columns={columns}
          data={assignments}
          rowKey="_id"
          emptyMessage="No active employee-brand assignments found."
        />
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Employee to Brand"
      >
        <form onSubmit={handleAssign} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Select Employee</label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
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
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
            >
              <option value="">-- Select Brand --</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.brandName} ({b.industry})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Responsibility / Role</label>
            <input
              type="text"
              required
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              placeholder="e.g. Lead Reels Specialist for Nike"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
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
              className="px-4 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md"
            >
              Create Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
