import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Globe, Mail, Phone, ExternalLink, Search, Users } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/brands', {
        brandName, industry, contactPerson, email, phone, website
      });
      if (res.success) {
        setShowAddModal(false);
        fetchBrands();
        setBrandName(''); setIndustry(''); setContactPerson(''); setEmail(''); setPhone(''); setWebsite('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create brand');
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

  const filteredBrands = brands.filter(b =>
    b.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.brandId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      key: 'website',
      label: 'Website',
      render: (val) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noreferrer"
          className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold text-xs"
        >
          <Globe size={12} /> Link <ExternalLink size={10} />
        </a>
      ) : <span className="text-slate-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-verified">
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewBrandDetails(row._id)}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition"
        >
          Details
        </button>
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
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 self-start sm:self-auto shadow-md"
        >
          <Plus size={18} />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl flex items-center space-x-3 border border-slate-200 shadow-xs">
        <Search size={16} className="text-purple-600 ml-1 shrink-0" />
        <input
          type="text"
          placeholder="Search by brand name, ID, industry, or contact person..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
        <span className="text-xs text-slate-400 font-medium shrink-0">{filteredBrands.length} records</span>
      </div>

      {loading ? (
        <InlineLoader message="Loading brand portfolio..." />
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={paginatedBrands}
            rowKey="_id"
            emptyMessage="No brands found matching your search."
          />
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredBrands.length / itemsPerPage)}
              totalItems={filteredBrands.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Brand Details Modal */}
      <Modal
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand ? `${selectedBrand.brandName} (${selectedBrand.brandId})` : 'Brand Details'}
        maxWidth="max-w-2xl"
      >
        {selectedBrand && (
          <div className="space-y-4">
            <p className="text-xs text-purple-700 font-extrabold -mt-2">{selectedBrand.industry} Industry</p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div><span className="text-slate-500 font-medium">Contact Person:</span> <span className="text-slate-900 font-bold block mt-0.5">{selectedBrand.contactPerson}</span></div>
              <div><span className="text-slate-500 font-medium">Email:</span> <span className="text-slate-900 font-bold block mt-0.5">{selectedBrand.email}</span></div>
              <div><span className="text-slate-500 font-medium">Phone:</span> <span className="text-slate-900 font-bold block mt-0.5">{selectedBrand.phone}</span></div>
              <div><span className="text-slate-500 font-medium">Website:</span> <a href={selectedBrand.website} target="_blank" rel="noreferrer" className="text-purple-700 font-bold block mt-0.5 truncate hover:underline">{selectedBrand.website || 'N/A'}</a></div>
            </div>

            {/* Assigned Employees */}
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <Users size={16} className="text-purple-600" />
                Assigned Team Members ({selectedBrand.assignedEmployees?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedBrand.assignedEmployees?.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">No employees assigned yet.</p>
                ) : (
                  selectedBrand.assignedEmployees?.map((empAssignment: any) => (
                    <div key={empAssignment._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{empAssignment.employeeId?.name}</div>
                        <div className="text-slate-500 font-medium">{empAssignment.employeeId?.designation} • {empAssignment.responsibility}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] badge-verified font-bold">
                        {empAssignment.priority}
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

      {/* Add Brand Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Brand"
      >
        <form onSubmit={handleCreateBrand} className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Brand Name</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Puma"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Industry</label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Sportswear"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Contact Person</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@puma.com"
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
                placeholder="+1 800 555 7862"
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://puma.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
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
              Create Brand
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
