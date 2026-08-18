import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Globe, Mail, Phone, ExternalLink, Search, Users, Eye, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Brand } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';
import { DataTable, DataTableColumn } from '../components/DataTable';

export const BrandManagementView: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandTypeFilter, setBrandTypeFilter] = useState<'All' | 'New' | 'Running'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [brandType, setBrandType] = useState<'New' | 'Running'>('Running');
  const [targetBarterCollabs, setTargetBarterCollabs] = useState<number>(7);
  const [targetPaidCollabs, setTargetPaidCollabs] = useState<number>(3);

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.success) setBrands(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleBrandTypeChange = (type: 'New' | 'Running') => {
    setBrandType(type);
    if (type === 'New') {
      setTargetBarterCollabs(8);
      setTargetPaidCollabs(2);
    } else {
      setTargetBarterCollabs(7);
      setTargetPaidCollabs(3);
    }
  };

  const openAddBrandModal = () => {
    setEditingBrand(null);
    setBrandName('');
    setIndustry('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setBrandType('Running');
    setTargetBarterCollabs(7);
    setTargetPaidCollabs(3);
    setShowAddModal(true);
  };

  const openEditBrandModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.brandName || '');
    setIndustry(brand.industry || '');
    setContactPerson(brand.contactPerson || '');
    setEmail(brand.email || '');
    setPhone(brand.phone || '');
    setWebsite(brand.website || '');
    const bType = brand.brandType || 'Running';
    setBrandType(bType);
    setTargetBarterCollabs(brand.targetBarterCollabs !== undefined ? brand.targetBarterCollabs : (bType === 'New' ? 8 : 7));
    setTargetPaidCollabs(brand.targetPaidCollabs !== undefined ? brand.targetPaidCollabs : (bType === 'New' ? 2 : 3));
    setShowAddModal(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        brandName, industry, contactPerson, email, phone, website,
        brandType,
        targetBarterCollabs: Number(targetBarterCollabs),
        targetPaidCollabs: Number(targetPaidCollabs)
      };

      let res;
      if (editingBrand) {
        res = await api.put(`/brands/${editingBrand._id}`, payload);
      } else {
        res = await api.post('/brands', payload);
      }

      if (res.success) {
        setShowAddModal(false);
        fetchBrands();
        setBrandName(''); setIndustry(''); setContactPerson(''); setEmail(''); setPhone(''); setWebsite('');
        setEditingBrand(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save brand');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand record?')) return;
    try {
      const res = await api.delete(`/brands/${id}`);
      if (res.success) {
        fetchBrands();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    const newStatus = brand.status === 'Active' ? 'Inactive' : 'Active';
    setBrands(prev => prev.map(b => b._id === brand._id ? { ...b, status: newStatus as any } : b));
    try {
      await api.put(`/brands/${brand._id}`, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update brand status', err);
      fetchBrands();
    }
  };

  const handleViewBrandDetails = async (id: string) => {
    try {
      const res = await api.get(`/brands/${id}`);
      if (res.success) {
        setSelectedBrand(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = 
      b.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.brandId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.assignedExecutive && b.assignedExecutive.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = brandTypeFilter === 'All' || (b.brandType || 'Running') === brandTypeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: DataTableColumn<Brand>[] = [
    {
      key: 'brandName',
      label: 'Brand',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow shrink-0">
            {row.brandName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">{row.brandName}</div>
            <div className="text-[10px] text-purple-600 font-bold">{row.brandId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'brandType',
      label: 'Status & Collab Target',
      render: (_, row) => {
        const isNew = row.brandType === 'New';
        const barter = row.targetBarterCollabs !== undefined ? row.targetBarterCollabs : (isNew ? 8 : 7);
        const paid = row.targetPaidCollabs !== undefined ? row.targetPaidCollabs : (isNew ? 2 : 3);
        const total = barter + paid;

        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isNew ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {isNew ? '✨ New Brand' : '⚡ Running Brand'}
            </span>
            <div className="text-[11px] font-bold text-slate-700">
              <span className="text-purple-700">{barter}B</span> : <span className="text-indigo-700">{paid}P</span>
              <span className="text-[10px] text-slate-400 ml-1 font-semibold">({total}/mo)</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'assignedExecutive',
      label: 'Assigned Executive',
      render: (_, row) => {
        const exec = row.assignedExecutive;
        return exec ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">
              {exec.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-800">{exec.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">{exec.email}</div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-semibold italic">Unassigned</span>
        );
      }
    },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'contactPerson', label: 'Contact Person', sortable: true },
    {
      key: 'email',
      label: 'Contact Details',
      render: (_, row) => (
        <div className="space-y-0.5 text-[11px]">
          <div className="flex items-center gap-1 text-slate-600">
            <Mail size={11} className="text-purple-600 shrink-0" />
            <span>{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1 text-slate-500">
              <Phone size={11} className="text-slate-400 shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Active',
      sortable: true,
      render: (_, row) => {
        const isActive = row.status === 'Active' || !row.status;
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-1 whitespace-nowrap">
          <button
            onClick={() => handleViewBrandDetails(row._id)}
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => openEditBrandModal(row)}
            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
            title="Edit Brand"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDeleteBrand(row._id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
            title="Delete Brand"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Briefcase size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Brand Portfolio</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Maintain portfolio of brands handled by the company.</p>
          </div>
        </div>

        <button
          onClick={openAddBrandModal}
          className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Search & Brand Type Filter */}
      <div className="bg-white p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3 w-full sm:w-2/3">
          <Search size={16} className="text-purple-600 ml-1 shrink-0" />
          <input
            type="text"
            placeholder="Search by brand name, ID, executive, industry, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
          <label className="text-[11px] font-bold text-slate-500">Status:</label>
          <select
            value={brandTypeFilter}
            onChange={(e) => setBrandTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Brands ({brands.length})</option>
            <option value="Running">Running Brands (7B : 3P)</option>
            <option value="New">New Brands (8B : 2P)</option>
          </select>
          {filteredBrands.length > 0 && (
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap ml-2">
              {filteredBrands.length} records
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <InlineLoader message="Loading brand portfolio..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={paginatedBrands}
            rowKey="_id"
            emptyMessage="No brands found matching criteria."
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredBrands.length / itemsPerPage) || 1}
            totalItems={filteredBrands.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        title="Brand Details & Assignments"
      >
        {selectedBrand && (
          <div className="space-y-4 text-xs font-medium">
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">{selectedBrand.brandId}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedBrand.brandName}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedBrand.industry}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                  {selectedBrand.status || 'Active'}
                </span>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedBrand.brandType === 'New' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {selectedBrand.brandType || 'Running'} Brand
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Contact Person</span>
                <p className="font-bold text-slate-800 text-xs">{selectedBrand.contactPerson}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Email</span>
                <p className="font-bold text-slate-800 text-xs">{selectedBrand.email}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Monthly Collab Target</span>
                <p className="font-extrabold text-purple-700 text-xs">
                  {selectedBrand.targetBarterCollabs || (selectedBrand.brandType === 'New' ? 8 : 7)} Barter : {selectedBrand.targetPaidCollabs || (selectedBrand.brandType === 'New' ? 2 : 3)} Paid
                  <span className="text-slate-500 font-medium ml-1">({(selectedBrand.targetBarterCollabs || (selectedBrand.brandType === 'New' ? 8 : 7)) + (selectedBrand.targetPaidCollabs || (selectedBrand.brandType === 'New' ? 2 : 3))}/mo)</span>
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Website</span>
                <p className="font-bold text-purple-600 text-xs truncate">{selectedBrand.website || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 text-xs uppercase mb-2 flex items-center gap-1">
                <Users size={14} className="text-purple-600" />
                Assigned Team Members ({selectedBrand.assignedEmployees?.length || 0})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedBrand.assignedEmployees?.length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold italic">No team members assigned to this brand yet.</p>
                ) : (
                  selectedBrand.assignedEmployees?.map((assignment: any) => (
                    <div key={assignment._id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{assignment.employeeId?.name || 'Staff'}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{assignment.employeeId?.designation || 'Team Member'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {assignment.employeeId?.employeeId}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBrand(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Brand Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingBrand ? "Edit Brand Details & Targets" : "Add New Brand"}
      >
        <form onSubmit={handleSaveBrand} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Brand Name *</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Vaasva"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
            />
          </div>

          {/* Manager Controls: Brand Status & Collab Targets */}
          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-purple-900 uppercase mb-1.5">
                Brand Status (Manager Decision) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBrandTypeChange('Running')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs text-center border transition-all ${
                    brandType === 'Running'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ⚡ Running Brand (7B : 3P)
                </button>
                <button
                  type="button"
                  onClick={() => handleBrandTypeChange('New')}
                  className={`py-2 px-3 rounded-xl font-extrabold text-xs text-center border transition-all ${
                    brandType === 'New'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ✨ New Brand (8B : 2P)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Barter Collabs
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={targetBarterCollabs}
                  onChange={(e) => setTargetBarterCollabs(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Paid Collabs
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={targetPaidCollabs}
                  onChange={(e) => setTargetPaidCollabs(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none"
                />
              </div>
            </div>
            <div className="text-[11px] font-semibold text-purple-700 text-right">
              Total Target: <span className="font-extrabold">{Number(targetBarterCollabs) + Number(targetPaidCollabs)} Collabs/month</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Industry *</label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Fashion & Lifestyle"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Contact Person *</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Brand Marketing POC"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@brand.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://brand.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium text-xs"
            />
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
              {editingBrand ? "Save Changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
