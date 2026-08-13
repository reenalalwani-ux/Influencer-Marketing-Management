import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Search, Filter, DollarSign, User, Trash2, Edit2, ArrowUpRight, ArrowDownRight, ExternalLink, Video, Link2, ChevronDown, Receipt, Eye, ShoppingBag, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { api } from '../services/api';
import { InfluencerTransaction, Brand, PaymentLogItem } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';

// Custom Attractive Pill Select for Status
const StatusPillDropdown: React.FC<{
  currentStatus: string;
  onSelect: (newStatus: string) => void;
}> = ({ currentStatus, onSelect }) => {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus || 'Completed'}
        onChange={(e) => onSelect(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-2xs transition ${currentStatus === 'Completed'
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
          : currentStatus === 'Approved'
            ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
            : currentStatus === 'Settled'
              ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
              : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
          }`}
      >
        <option value="Completed" className="bg-white text-slate-900 font-bold py-1">🟢 Completed</option>
        <option value="Approved" className="bg-white text-slate-900 font-bold py-1">🔵 Approved</option>
        <option value="Pending" className="bg-white text-slate-900 font-bold py-1">🟡 Pending</option>
        <option value="Settled" className="bg-white text-slate-900 font-bold py-1">🟣 Settled</option>
      </select>
      <ChevronDown size={13} className="absolute right-2.5 pointer-events-none opacity-80" />
    </div>
  );
};

// Custom Attractive Pill Select for Approval
const ApprovalPillDropdown: React.FC<{
  isApproved: boolean;
  onSelect: (newApproved: boolean) => void;
}> = ({ isApproved, onSelect }) => {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={isApproved ? 'Yes' : 'No'}
        onChange={(e) => onSelect(e.target.value === 'Yes')}
        className={`appearance-none pl-3 pr-7 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-2xs transition ${isApproved
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
          : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
          }`}
      >
        <option value="Yes" className="bg-white text-slate-900 font-bold py-1">✅ Yes (Approved)</option>
        <option value="No" className="bg-white text-slate-900 font-bold py-1">⏳ Pending / No</option>
      </select>
      <ChevronDown size={13} className="absolute right-2.5 pointer-events-none opacity-80" />
    </div>
  );
};

export const InfluencerManagementView: React.FC = () => {
  const [influencers, setInfluencers] = useState<InfluencerTransaction[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeCategory, setActiveCategory] = useState<'All' | 'Paid' | 'Barter'>('All');
  const [timeframe, setTimeframe] = useState<'today' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'Financial Ledger' | 'Content Deliverables' | 'Payment Audit Logs'>('Financial Ledger');
  const [selectedPayLogType, setSelectedPayLogType] = useState<'All' | 'IN' | 'OUT'>('All');

  // Dropdown Filter States
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');
  const [selectedManagerFilter, setSelectedManagerFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('All');

  // Metrics
  const [metrics, setMetrics] = useState({
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    totalCount: 0
  });

  // Sorting State
  const [sortKey, setSortKey] = useState<string>('transactionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortHeader = ({
    field,
    label,
    align = 'left',
    bgClass = 'bg-slate-800 text-slate-200',
    className = ''
  }: {
    field: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    bgClass?: string;
    className?: string;
  }) => {
    const isSorted = sortKey === field;
    const activeClass = isSorted
      ? 'bg-purple-950 text-purple-200 font-extrabold border-b-2 border-purple-400'
      : bgClass;

    return (
      <th
        onClick={() => handleSort(field)}
        className={`px-3.5 py-3 border-b border-r border-slate-700/80 select-none cursor-pointer hover:bg-slate-700/90 transition-colors ${activeClass} ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span className="truncate">{label}</span>
          {isSorted ? (
            sortDir === 'asc' ? (
              <ChevronUp size={13} className="text-purple-300 shrink-0 font-bold" />
            ) : (
              <ChevronDown size={13} className="text-purple-300 shrink-0 font-bold" />
            )
          ) : (
            <ChevronsUpDown size={11} className="text-slate-400 opacity-40 shrink-0 hover:opacity-100 transition" />
          )}
        </div>
      </th>
    );
  };

  // Modal State — Influencer Record
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InfluencerTransaction | null>(null);

  // Modal State — Payment Audit Log
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payLogInfluencerName, setPayLogInfluencerName] = useState('');
  const [payLogBrandName, setPayLogBrandName] = useState('');
  const [payLogType, setPayLogType] = useState<'IN' | 'OUT'>('IN');
  const [payLogAmount, setPayLogAmount] = useState<number | ''>('');
  const [payLogMode, setPayLogMode] = useState('Bank Transfer');
  const [payLogRefNo, setPayLogRefNo] = useState('');
  const [payLogHandledBy, setPayLogHandledBy] = useState('');
  const [payLogDate, setPayLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [payLogNotes, setPayLogNotes] = useState('');

  // Form Fields (Exact Google Sheet Columns)
  const [influencerManager, setInfluencerManager] = useState('');
  const [influencerName, setInfluencerName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [category, setCategory] = useState<'Paid' | 'Barter'>('Paid');

  // Financial Breakdown Fields
  const [brandOnboardingAmt, setBrandOnboardingAmt] = useState<number | ''>(0);
  const [brandReceivedAmt, setBrandReceivedAmt] = useState<number | ''>(0);
  const [influencerOnboardingAmt, setInfluencerOnboardingAmt] = useState<number | ''>(0);
  const [influencerPaidAmt, setInfluencerPaidAmt] = useState<number | ''>(0);
  const [finalPaymentReceived, setFinalPaymentReceived] = useState(false);

  // Content Deliverable Fields
  const [productLink, setProductLink] = useState('');
  const [videoType, setVideoType] = useState('Single Product Video');
  const [videoDescription, setVideoDescription] = useState('');
  const [refVideoLink, setRefVideoLink] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'Settled' | 'Approved'>('Completed');
  const [contentLink, setContentLink] = useState('');
  const [adsCode, setAdsCode] = useState('');
  const [viewsCount, setViewsCount] = useState<number | ''>(0);
  const [ordersCount, setOrdersCount] = useState<number | ''>(0);
  const [isApproved, setIsApproved] = useState(true);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [remark, setRemark] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.success) setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      let url = `/influencers?timeframe=${timeframe}&year=${year}&month=${month}`;
      if (activeCategory !== 'All') url += `&category=${activeCategory}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      if (res.success) {
        setInfluencers(res.data);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch influencers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentLogs = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      let url = `/influencers/payment-logs?timeframe=${timeframe}&year=${year}&month=${month}`;
      if (selectedPayLogType !== 'All') url += `&type=${selectedPayLogType}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const res = await api.get(url);
      if (res.success) {
        setPaymentLogs(res.data);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch payment logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (viewMode === 'Payment Audit Logs') {
      fetchPaymentLogs();
    } else {
      fetchInfluencers();
    }
  }, [activeCategory, timeframe, currentDate, searchTerm, viewMode, selectedPayLogType]);

  const openAddModal = () => {
    setEditingItem(null);
    setInfluencerManager('');
    setInfluencerName('');
    setSelectedBrandId('');
    setCustomBrandName('');
    setPhone('');
    setProfileLink('');
    setCategory(activeCategory === 'Barter' ? 'Barter' : 'Paid');
    setBrandOnboardingAmt(0);
    setBrandReceivedAmt(0);
    setInfluencerOnboardingAmt(0);
    setInfluencerPaidAmt(0);
    setFinalPaymentReceived(false);
    setProductLink('');
    setVideoType('Single Product Video');
    setVideoDescription('');
    setRefVideoLink('');
    setOrderId('');
    setOrderDate('');
    setPlatform('Instagram');
    setStatus('Completed');
    setContentLink('');
    setAdsCode('');
    setViewsCount(0);
    setOrdersCount(0);
    setIsApproved(true);
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setRemark('');
    setShowModal(true);
  };

  const openEditModal = (item: InfluencerTransaction) => {
    setEditingItem(item);
    setInfluencerManager(item.influencerManager || '');
    setInfluencerName(item.influencerName);
    setSelectedBrandId(typeof item.brandId === 'object' ? item.brandId?._id : item.brandId || '');
    setCustomBrandName(item.brandName);
    setPhone(item.phone || '');
    setProfileLink(item.profileLink || '');
    setCategory(item.category);
    setBrandOnboardingAmt(item.brandOnboardingAmt || item.inAmount || 0);
    setBrandReceivedAmt(item.brandReceivedAmt || item.inAmount || 0);
    setInfluencerOnboardingAmt(item.influencerOnboardingAmt || item.outAmount || 0);
    setInfluencerPaidAmt(item.influencerPaidAmt || item.outAmount || 0);
    setFinalPaymentReceived(!!item.finalPaymentReceived);
    setProductLink(item.productLink || '');
    setVideoType(item.videoType || 'Single Product Video');
    setVideoDescription(item.videoDescription || '');
    setRefVideoLink(item.refVideoLink || '');
    setOrderId(item.orderId || '');
    setOrderDate(item.orderDate ? item.orderDate.split('T')[0] : '');
    setPlatform(item.platform || 'Instagram');
    setStatus(item.status || 'Completed');
    setContentLink(item.contentLink || '');
    setAdsCode(item.adsCode || '');
    setViewsCount(item.viewsCount || 0);
    setOrdersCount(item.ordersCount || 0);
    setIsApproved(item.isApproved !== undefined ? item.isApproved : true);
    setTransactionDate(item.transactionDate ? item.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(item.notes || '');
    setRemark(item.remark || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const brandObj = brands.find(b => b._id === selectedBrandId);
      const bName = brandObj ? brandObj.brandName : (customBrandName || 'General');

      const payload = {
        influencerManager,
        influencerName,
        brandId: selectedBrandId || undefined,
        brandName: bName,
        phone,
        profileLink,
        category,
        brandOnboardingAmt: Number(brandOnboardingAmt) || 0,
        brandReceivedAmt: Number(brandReceivedAmt) || 0,
        influencerOnboardingAmt: Number(influencerOnboardingAmt) || 0,
        influencerPaidAmt: Number(influencerPaidAmt) || 0,
        finalPaymentReceived,
        productLink,
        videoType,
        videoDescription,
        refVideoLink,
        orderId,
        orderDate,
        platform,
        status,
        contentLink,
        adsCode,
        viewsCount: Number(viewsCount) || 0,
        ordersCount: Number(ordersCount) || 0,
        isApproved,
        transactionDate,
        notes,
        remark
      };

      let res;
      if (editingItem) {
        res = await api.put(`/influencers/${editingItem._id}`, payload);
      } else {
        res = await api.post('/influencers', payload);
      }

      if (res.success) {
        setShowModal(false);
        fetchInfluencers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save influencer record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this influencer record?')) return;
    try {
      const res = await api.delete(`/influencers/${id}`);
      if (res.success) fetchInfluencers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const openPaymentModal = () => {
    setPayLogInfluencerName('');
    setPayLogBrandName('');
    setPayLogType('IN');
    setPayLogAmount('');
    setPayLogMode('Bank Transfer');
    setPayLogRefNo('');
    setPayLogHandledBy('');
    setPayLogDate(new Date().toISOString().split('T')[0]);
    setPayLogNotes('');
    setShowPaymentModal(true);
  };

  const handlePaymentLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/influencers/payment-logs', {
        influencerName: payLogInfluencerName,
        brandName: payLogBrandName,
        type: payLogType,
        amount: Number(payLogAmount) || 0,
        paymentMode: payLogMode,
        referenceNo: payLogRefNo,
        handledBy: payLogHandledBy,
        transactionDate: payLogDate,
        notes: payLogNotes
      });
      if (res.success) {
        setShowPaymentModal(false);
        fetchPaymentLogs();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to log payment entry');
    }
  };

  const handleDeletePaymentLog = async (id: string) => {
    if (!window.confirm('Delete this payment audit log?')) return;
    try {
      await api.delete(`/influencers/payment-logs/${id}`);
      fetchPaymentLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete log');
    }
  };

  // Quick Inline Table Update Handlers
  const handleStatusChange = async (id: string, newStatus: string) => {
    setInfluencers(prev => prev.map(i => i._id === id ? { ...i, status: newStatus as any } : i));
    try {
      await api.put(`/influencers/${id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
      fetchInfluencers();
    }
  };

  const handleApprovalChange = async (id: string, newApproved: boolean) => {
    setInfluencers(prev => prev.map(i => i._id === id ? { ...i, isApproved: newApproved } : i));
    try {
      await api.put(`/influencers/${id}`, { isApproved: newApproved });
    } catch (err) {
      console.error('Failed to update approval status', err);
      fetchInfluencers();
    }
  };

  const handleFinalPaymentToggle = async (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setInfluencers(prev => prev.map(i => i._id === id ? { ...i, finalPaymentReceived: newVal } : i));
    try {
      await api.put(`/influencers/${id}`, { finalPaymentReceived: newVal });
    } catch (err) {
      console.error('Failed to update final payment status', err);
      fetchInfluencers();
    }
  };

  // Derived Google Sheet calculations for Form Preview
  const calcBrandOnboard = Number(brandOnboardingAmt) || 0;
  const calcBrandReceived = Number(brandReceivedAmt) || 0;
  const calcBrandPending = calcBrandOnboard - calcBrandReceived;

  const calcInfOnboard = Number(influencerOnboardingAmt) || 0;
  const calcInfPaid = Number(influencerPaidAmt) || 0;
  const calcInfPending = calcInfOnboard - calcInfPaid;

  const calcMargin = calcBrandOnboard - calcInfOnboard;
  const calcNetBalance = calcBrandReceived - calcInfPaid;

  // Unique dropdown lists
  const uniqueManagers = Array.from(new Set(influencers.map(i => i.influencerManager).filter(Boolean)));
  const uniqueBrandNames = Array.from(new Set([...brands.map(b => b.brandName), ...influencers.map(i => i.brandName).filter(Boolean)]));

  // Multi-dropdown filtered list
  const filteredInfluencers = influencers.filter((item) => {
    if (selectedBrandFilter !== 'All' && item.brandName !== selectedBrandFilter) return false;
    if (selectedManagerFilter !== 'All' && item.influencerManager !== selectedManagerFilter) return false;
    if (selectedStatusFilter !== 'All' && item.status !== selectedStatusFilter) return false;
    if (selectedPlatformFilter !== 'All' && item.platform !== selectedPlatformFilter) return false;
    return true;
  });

  const sortedInfluencers = React.useMemo(() => {
    if (!sortKey) return filteredInfluencers;
    return [...filteredInfluencers].sort((a: any, b: any) => {
      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = (Number(aVal) || 0) - (Number(bVal) || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredInfluencers, sortKey, sortDir]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="text-purple-600" />
            Influencer Operations & Ledger Workspace
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Day-wise creator onboarding, paid & barter finances, payment audit logs, and deliverables
          </p>
        </div>

        {viewMode === 'Payment Audit Logs' ? (
          <button
            onClick={openPaymentModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md hover:shadow-lg transition"
          >
            <Receipt size={18} />
            <span>Record Payment Entry</span>
          </button>
        ) : (
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 btn-gradient-primary rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md hover:shadow-lg transition"
          >
            <Plus size={18} />
            <span>Add Influencer Record</span>
          </button>
        )}
      </div>

      {/* Toolbar — All tabs in one single row, full width */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between w-full gap-3">

        {/* Category Filter: All / Paid / Barter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-extrabold">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 rounded-lg transition ${activeCategory === 'All' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory('Paid')}
            className={`px-3 py-1.5 rounded-lg transition ${activeCategory === 'Paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            💳 Paid
          </button>
          <button
            onClick={() => setActiveCategory('Barter')}
            className={`px-3 py-1.5 rounded-lg transition ${activeCategory === 'Barter' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🎁 Barter
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        {/* View Mode: Financial / Deliverables / Payment Logs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(['Financial Ledger', 'Content Deliverables', 'Payment Audit Logs'] as const).map((vm) => (
            <button
              key={vm}
              onClick={() => setViewMode(vm)}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === vm
                  ? vm === 'Payment Audit Logs' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {vm === 'Financial Ledger' ? '📊 Financial Ledger' : vm === 'Content Deliverables' ? '🎬 Deliverables & Links' : '📜 Payment Logs'}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        {/* Timeframe Filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {(['today', 'monthly', 'yearly', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg transition uppercase ${timeframe === t ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {t === 'today' ? 'Today' : t === 'monthly' ? 'Monthly' : t === 'yearly' ? 'Yearly' : 'All'}
            </button>
          ))}
        </div>

      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand Received (IN)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">₹{metrics.totalIn.toLocaleString()}</div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Inward payment collected</p>
          </div>
        </div>

        {/* Influencer Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Influencer Paid (OUT)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">₹{metrics.totalOut.toLocaleString()}</div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Outward creator payout</p>
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Balance</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${metrics.netBalance >= 0 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${metrics.netBalance >= 0 ? 'text-purple-700' : 'text-amber-600'}`}>
              ₹{metrics.netBalance.toLocaleString()}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Brand Received − Influencer Paid</p>
          </div>
        </div>

        {/* Total Records / Entries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {viewMode === 'Payment Audit Logs' ? 'Payment Log Entries' : 'Total Records'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
              {viewMode === 'Payment Audit Logs' ? <Receipt size={20} /> : <User size={20} />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {viewMode === 'Payment Audit Logs' ? paymentLogs.length : filteredInfluencers.length} Entries
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Matching current filters</p>
          </div>
        </div>
      </div>

      {/* Search & Multi-Dropdown Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search influencer, manager, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Dropdown Filters Group */}
        {viewMode === 'Payment Audit Logs' ? (
          <div className="flex items-center space-x-2">
            <Receipt size={14} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Payment Flow:</span>
            <select
              value={selectedPayLogType}
              onChange={(e) => setSelectedPayLogType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">🔄 All Payments</option>
              <option value="IN">📥 IN — Brand Received</option>
              <option value="OUT">📤 OUT — Influencer Paid</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center space-x-1">
              <Filter size={14} className="text-purple-600 shrink-0" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Filters:</span>
            </div>

            {/* 1. Brand Dropdown */}
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 hover:bg-purple-50 transition cursor-pointer"
            >
              <option value="All">🏢 All Brands</option>
              {uniqueBrandNames.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* 2. Manager Dropdown */}
            <select
              value={selectedManagerFilter}
              onChange={(e) => setSelectedManagerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 hover:bg-purple-50 transition cursor-pointer"
            >
              <option value="All">👤 All Managers</option>
              {uniqueManagers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* 3. Status Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 hover:bg-purple-50 transition cursor-pointer"
            >
              <option value="All">⚡ All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Settled">Settled</option>
            </select>

            {/* 4. Platform Dropdown */}
            <select
              value={selectedPlatformFilter}
              onChange={(e) => setSelectedPlatformFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 hover:bg-purple-50 transition cursor-pointer"
            >
              <option value="All">🌐 All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="TikTok">TikTok</option>
              <option value="X (Twitter)">X (Twitter)</option>
            </select>

            {/* Reset Filters Button */}
            {(selectedBrandFilter !== 'All' || selectedManagerFilter !== 'All' || selectedStatusFilter !== 'All' || selectedPlatformFilter !== 'All') && (
              <button
                onClick={() => {
                  setSelectedBrandFilter('All');
                  setSelectedManagerFilter('All');
                  setSelectedStatusFilter('All');
                  setSelectedPlatformFilter('All');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-extrabold transition border border-rose-200"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Google Sheets Spreadsheet Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <InlineLoader message="Loading ledger records..." />
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              {/* VIEW MODE 1: Financial Ledger View */}
              {viewMode === 'Financial Ledger' && (
                <>
                  <thead className="bg-slate-800 text-white font-extrabold uppercase text-[10px] sticky top-0 z-20">
                    <tr>
                      <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[40px] text-center bg-slate-800">#</th>
                      <SortHeader field="transactionDate" label="Date" className="min-w-[90px]" />
                      <SortHeader field="influencerManager" label="Manager" className="min-w-[120px]" />
                      <SortHeader field="brandName" label="Brand" className="min-w-[140px]" />
                      <SortHeader field="influencerName" label="Influencer Name" className="min-w-[160px]" />
                      <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[100px] bg-slate-800">Phone</th>
                      <SortHeader field="category" label="Type" className="min-w-[80px]" />

                      {/* Performance Views & Orders */}
                      <SortHeader field="viewsCount" label="Views" align="right" bgClass="bg-purple-900 text-purple-100" className="min-w-[90px]" />
                      <SortHeader field="ordersCount" label="Orders" align="right" bgClass="bg-emerald-900 text-emerald-100" className="min-w-[85px]" />

                      {/* Brand Breakdown */}
                      <SortHeader field="brandOnboardingAmt" label="Brand Onboard" align="right" bgClass="bg-sky-900 text-sky-100" className="min-w-[95px]" />
                      <SortHeader field="brandReceivedAmt" label="Received" align="right" bgClass="bg-emerald-900 text-emerald-100" className="min-w-[90px]" />
                      <SortHeader field="brandPendingAmt" label="Pending" align="right" bgClass="bg-amber-900 text-amber-100" className="min-w-[85px]" />

                      {/* Influencer Payout Breakdown */}
                      <SortHeader field="influencerOnboardingAmt" label="Inf Onboard" align="right" bgClass="bg-purple-900 text-purple-100" className="min-w-[95px]" />
                      <SortHeader field="influencerPaidAmt" label="Paid" align="right" bgClass="bg-rose-900 text-rose-100" className="min-w-[85px]" />
                      <SortHeader field="influencerPendingAmt" label="Pending" align="right" bgClass="bg-amber-900 text-amber-100" className="min-w-[85px]" />

                      {/* Margin & Final Payment */}
                      <SortHeader field="ad2shipMargin" label="Margin" align="right" bgClass="bg-emerald-900 text-emerald-100" className="min-w-[95px]" />
                      <SortHeader field="finalPaymentReceived" label="Paid?" align="center" className="min-w-[60px]" />
                      <th className="px-3 py-3 border-b border-slate-700 text-right min-w-[70px] bg-slate-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedInfluencers.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="px-6 py-12 text-center text-slate-500 font-semibold">
                          No influencer records found matching your filters. Click "Add Influencer Record" or Reset Filters.
                        </td>
                      </tr>
                    ) : (
                      sortedInfluencers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => (
                        <tr key={item._id} className="hover:bg-purple-50/40 transition">
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400 border-r border-slate-200">
                            {item.sNo || idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                            {new Date(item.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-700 border-r border-slate-200 truncate max-w-[110px]">
                            {item.influencerManager || 'Manager'}
                          </td>
                          <td className="px-4 py-2.5 font-extrabold text-slate-900 border-r border-slate-200 truncate max-w-[130px]">
                            {item.brandName}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-purple-700 border-r border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[140px]">{item.influencerName}</span>
                              {item.profileLink && (
                                <a href={item.profileLink} target="_blank" rel="noreferrer" className="text-purple-500 hover:text-purple-700">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600 border-r border-slate-200">
                            {item.phone || '-'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${item.category === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {item.category}
                            </span>
                          </td>

                          {/* Performance Views & Orders */}
                          <td className="px-3 py-2.5 text-right font-extrabold text-purple-700 bg-purple-50/20 border-r border-slate-200">
                            👁️ {(item.viewsCount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 bg-emerald-50/20 border-r border-slate-200">
                            📦 {(item.ordersCount || 0).toLocaleString()}
                          </td>

                          {/* Brand Breakdown */}
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800 bg-sky-50/50 border-r border-slate-200">
                            ₹{(item.brandOnboardingAmt || item.inAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-emerald-600 bg-emerald-50/50 border-r border-slate-200">
                            ₹{(item.brandReceivedAmt || item.inAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-amber-600 bg-amber-50/30 border-r border-slate-200">
                            ₹{(item.brandPendingAmt || 0).toLocaleString()}
                          </td>

                          {/* Influencer Payout Breakdown */}
                          <td className="px-3 py-2.5 text-right font-bold text-purple-800 bg-purple-50/40 border-r border-slate-200">
                            ₹{(item.influencerOnboardingAmt || item.outAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-rose-600 bg-rose-50/50 border-r border-slate-200">
                            ₹{(item.influencerPaidAmt || item.outAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-amber-600 bg-amber-50/30 border-r border-slate-200">
                            ₹{(item.influencerPendingAmt || 0).toLocaleString()}
                          </td>

                          {/* Margin & Final Payment */}
                          <td className="px-3 py-2.5 text-right font-black text-purple-700 bg-emerald-50/60 border-r border-slate-200">
                            ₹{(item.ad2shipMargin || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-center border-r border-slate-200">
                            <button
                              onClick={() => handleFinalPaymentToggle(item._id, !!item.finalPaymentReceived)}
                              className={`px-2 py-0.5 rounded-lg font-extrabold text-[10px] transition cursor-pointer border shadow-2xs ${item.finalPaymentReceived
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                }`}
                              title="Click to toggle payment received status"
                            >
                              {item.finalPaymentReceived ? '☑ Yes' : '☐ No'}
                            </button>
                          </td>

                          <td className="px-3 py-2.5 text-right space-x-1">
                            <button onClick={() => openEditModal(item)} className="p-1 hover:bg-purple-100 text-purple-600 rounded">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {/* VIEW MODE 2: Content Deliverables View */}
              {viewMode === 'Content Deliverables' && (
                <>
                  <thead className="bg-slate-800 text-white font-extrabold uppercase text-[10px] sticky top-0 z-20">
                    <tr>
                      <SortHeader field="transactionDate" label="Date" className="min-w-[85px]" />
                      <SortHeader field="brandName" label="Brand" className="min-w-[140px]" />
                      <SortHeader field="influencerName" label="Influencer" className="min-w-[150px]" />
                      <th className="px-3 py-3 border-b border-r border-slate-700">Product Link</th>
                      <SortHeader field="videoType" label="Video Type" className="min-w-[140px]" />
                      <SortHeader field="orderId" label="Order ID" className="min-w-[100px]" />
                      <SortHeader field="viewsCount" label="Reel Views" align="right" className="min-w-[90px]" />
                      <SortHeader field="ordersCount" label="Orders Driven" align="right" className="min-w-[95px]" />
                      <SortHeader field="status" label="Status" align="center" className="min-w-[100px]" />
                      <th className="px-3 py-3 border-b border-r border-slate-700">Content Reel</th>
                      <th className="px-3 py-3 border-b border-r border-slate-700">Ads Code</th>
                      <SortHeader field="isApproved" label="Approved?" align="center" className="min-w-[100px]" />
                      <th className="px-3 py-3 border-b border-slate-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedInfluencers.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-6 py-12 text-center text-slate-500 font-semibold">
                          No deliverables found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      sortedInfluencers.map((item) => (
                        <tr key={item._id} className="hover:bg-purple-50/40 transition">
                          <td className="px-3 py-2.5 font-mono text-slate-600 border-r border-slate-200">
                            {new Date(item.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5 font-extrabold text-slate-900 border-r border-slate-200">
                            {item.brandName}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-purple-700 border-r border-slate-200">
                            {item.influencerName}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200">
                            {item.productLink ? (
                              <a href={item.productLink} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 font-semibold truncate max-w-[120px]">
                                <Link2 size={12} /> Product
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 font-medium text-slate-700">
                            {item.videoType || 'Single Product Video'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-xs font-bold text-slate-800">
                            {item.orderId || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-purple-700 bg-purple-50/30 border-r border-slate-200">
                            👁️ {(item.viewsCount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-emerald-700 bg-emerald-50/30 border-r border-slate-200">
                            📦 {(item.ordersCount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-slate-200">
                            <StatusPillDropdown
                              currentStatus={item.status || 'Completed'}
                              onSelect={(newStatus) => handleStatusChange(item._id, newStatus)}
                            />
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200">
                            {item.contentLink ? (
                              <a href={item.contentLink} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 font-bold">
                                <Video size={12} /> Reel Link
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-200 font-mono font-bold text-xs text-purple-700">
                            {item.adsCode || '-'}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-slate-200">
                            <ApprovalPillDropdown
                              isApproved={!!item.isApproved}
                              onSelect={(newApproved) => handleApprovalChange(item._id, newApproved)}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right space-x-1">
                            <button onClick={() => openEditModal(item)} className="p-1 hover:bg-purple-100 text-purple-600 rounded">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>

            {/* VIEW MODE 3: Payment Audit Logs */}
            {viewMode === 'Payment Audit Logs' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-white font-extrabold uppercase text-[10px] sticky top-0 z-20">
                  <tr>
                    <th className="px-3 py-3 border-b border-r border-slate-700 text-center min-w-[40px]">#</th>
                    <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[85px]">Date</th>
                    <th className="px-3 py-3 border-b border-r border-slate-700 text-center min-w-[130px]">Flow</th>
                    <th className="px-4 py-3 border-b border-r border-slate-700 min-w-[150px]">Influencer</th>
                    <th className="px-4 py-3 border-b border-r border-slate-700 min-w-[130px]">Brand</th>
                    <th className="px-4 py-3 border-b border-r border-slate-700 text-right min-w-[110px]">Amount (₹)</th>
                    <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[110px]">Mode</th>
                    <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[130px]">Ref / Txn No</th>
                    <th className="px-3 py-3 border-b border-r border-slate-700 min-w-[120px]">Handled By</th>
                    <th className="px-4 py-3 border-b border-r border-slate-700 min-w-[200px]">Notes</th>
                    <th className="px-3 py-3 border-b border-slate-700 text-right min-w-[60px]">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-slate-500 font-semibold">
                        <div className="flex flex-col items-center gap-3">
                          <Receipt size={36} className="text-slate-300" />
                          <div>No payment audit logs yet.</div>
                          <div className="text-xs text-slate-400">Click <span className="font-bold text-emerald-600">Record Payment Entry</span> to log the first payment.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paymentLogs.map((log, idx) => (
                      <tr key={log._id} className={`transition ${log.type === 'IN' ? 'hover:bg-emerald-50/30' : 'hover:bg-rose-50/30'}`}>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                          {new Date(log.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-3 py-2.5 text-center border-r border-slate-200">
                          {log.type === 'IN' ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300 inline-flex items-center gap-1">
                              📥 IN
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-300 inline-flex items-center gap-1">
                              📤 OUT
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-extrabold text-purple-700 border-r border-slate-200">{log.influencerName}</td>
                        <td className="px-4 py-2.5 font-extrabold text-slate-900 border-r border-slate-200">{log.brandName}</td>
                        <td className={`px-4 py-2.5 text-right font-black border-r border-slate-200 text-sm ${log.type === 'IN' ? 'text-emerald-600 bg-emerald-50/40' : 'text-rose-600 bg-rose-50/40'}`}>
                          {log.type === 'IN' ? `+₹${log.amount.toLocaleString()}` : `-₹${log.amount.toLocaleString()}`}
                        </td>
                        <td className="px-3 py-2.5 border-r border-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">{log.paymentMode || 'UPI'}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-700 border-r border-slate-200 text-[11px]">{log.referenceNo || '—'}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800 border-r border-slate-200">{log.handledBy || 'Admin'}</td>
                        <td className="px-4 py-2.5 text-slate-500 border-r border-slate-200 max-w-[200px] truncate">{log.notes || '—'}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button onClick={() => handleDeletePaymentLog(log._id)} className="p-1 hover:bg-rose-100 text-rose-500 rounded" title="Delete log">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((viewMode === 'Payment Audit Logs' ? paymentLogs.length : filteredInfluencers.length) / itemsPerPage)}
            totalItems={viewMode === 'Payment Audit Logs' ? paymentLogs.length : filteredInfluencers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Add / Edit Full Google Sheet Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Influencer Record' : 'Add New Influencer Record'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          {/* Section 1: General Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-purple-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User size={14} /> 1. Influencer & Brand Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Manager Name</label>
                <input
                  type="text"
                  value={influencerManager}
                  onChange={(e) => setInfluencerManager(e.target.value)}
                  placeholder="e.g. Yash / Lakshita"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Paid">💳 Paid Partnership</option>
                  <option value="Barter">🎁 Barter Exchange</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Brand</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => {
                    setSelectedBrandId(e.target.value);
                    if (e.target.value) setCustomBrandName('');
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.brandName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Influencer Name</label>
                <input
                  type="text"
                  required
                  value={influencerName}
                  onChange={(e) => setInfluencerName(e.target.value)}
                  placeholder="e.g. Archi Thakur"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 8894105116"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Instagram Profile Link</label>
              <input
                type="url"
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                placeholder="https://www.instagram.com/archithakur"
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-medium"
              />
            </div>
          </div>

          {/* Section 2: Financial Onboarding & Payout Breakdown */}
          <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 space-y-3">
            <h4 className="font-extrabold text-purple-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <DollarSign size={14} /> 2. Financial Breakdown & Margin Calculations
            </h4>

            {/* Brand Payment Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
              <span className="text-[10px] font-extrabold text-sky-700 uppercase">📥 Brand Payment Breakdown (IN)</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Total Brand Deal Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={brandOnboardingAmt}
                    onChange={(e) => setBrandOnboardingAmt(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10000"
                    className="w-full border border-sky-300 focus:border-sky-500 rounded-xl px-3 py-1.5 text-sm font-black text-sky-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Brand Amount Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={brandReceivedAmt}
                    onChange={(e) => setBrandReceivedAmt(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10000"
                    className="w-full border border-emerald-300 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-sm font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Brand Amount Pending (₹)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-black text-amber-700">
                    ₹{calcBrandPending.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Influencer Payout Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
              <span className="text-[10px] font-extrabold text-purple-700 uppercase">📤 Influencer Payout Breakdown (OUT)</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Influencer Agreed Payout (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={influencerOnboardingAmt}
                    onChange={(e) => setInfluencerOnboardingAmt(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="6000"
                    className="w-full border border-purple-300 focus:border-purple-500 rounded-xl px-3 py-1.5 text-sm font-black text-purple-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Influencer Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={influencerPaidAmt}
                    onChange={(e) => setInfluencerPaidAmt(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3000"
                    className="w-full border border-rose-300 focus:border-rose-500 rounded-xl px-3 py-1.5 text-sm font-black text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Influencer Payout Pending (₹)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-black text-amber-700">
                    ₹{calcInfPending.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Margin & Final Payment Checkbox */}
            <div className="bg-white p-3 rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-slate-500 font-bold">Agency Gross Margin: </span>
                <span className="text-base font-black text-emerald-600">₹{calcMargin.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold">Net Cash Flow Balance: </span>
                <span className={`text-base font-black ${calcNetBalance >= 0 ? 'text-purple-700' : 'text-amber-600'}`}>₹{calcNetBalance.toLocaleString()}</span>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer font-extrabold text-slate-800">
                <input
                  type="checkbox"
                  checked={finalPaymentReceived}
                  onChange={(e) => setFinalPaymentReceived(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>Full Payment Settled ☑</span>
              </label>
            </div>
          </div>

          {/* Section 3: Deliverables & Links */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Video size={14} /> 3. Deliverables, Order & Ad Codes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Product Link</label>
                <input
                  type="url"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="https://loomista.com/collections/..."
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Type of Video</label>
                <input
                  type="text"
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  placeholder="Single Product Video / Reel"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Order ID</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="#VAASVA16200"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Published Content Link</label>
                <input
                  type="url"
                  value={contentLink}
                  onChange={(e) => setContentLink(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Ads Code</label>
                <input
                  type="text"
                  value={adsCode}
                  onChange={(e) => setAdsCode(e.target.value)}
                  placeholder="e.g. IG-ADS-9982"
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            {/* Performance Tracking: Views & Orders Driven */}
            <div className="bg-white p-3 rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-900 font-extrabold uppercase mb-1 flex items-center gap-1 text-[11px]">
                  <Eye size={14} className="text-purple-600" /> Reel Views (Total Views)
                </label>
                <input
                  type="number"
                  min="0"
                  value={viewsCount}
                  onChange={(e) => setViewsCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full bg-purple-50/50 border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-1.5 font-bold text-purple-900"
                />
              </div>

              <div>
                <label className="block text-emerald-900 font-extrabold uppercase mb-1 flex items-center gap-1 text-[11px]">
                  <ShoppingBag size={14} className="text-emerald-600" /> Orders Generated / Sales Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={ordersCount}
                  onChange={(e) => setOrdersCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 25"
                  className="w-full bg-emerald-50/50 border border-emerald-200 focus:border-emerald-500 rounded-xl px-3 py-1.5 font-bold text-emerald-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Remarks / Notes</label>
              <textarea
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remarks e.g. RECEIVED BY LAKSHITA..."
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl p-2.5 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-bold transition text-xs shadow-md"
            >
              {editingItem ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Payment Audit Log Entry */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="📜 Record Payment Audit Log Entry"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handlePaymentLogSubmit} className="space-y-4 text-xs font-semibold text-slate-700">

          {/* Flow Type + Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Payment Flow</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPayLogType('IN')}
                  className={`flex-1 py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${payLogType === 'IN' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-emerald-50'}`}
                >
                  📥 IN (Brand Paid Us)
                </button>
                <button
                  type="button"
                  onClick={() => setPayLogType('OUT')}
                  className={`flex-1 py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${payLogType === 'OUT' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-rose-50'}`}
                >
                  📤 OUT (We Paid Influencer)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Transaction Date</label>
              <input
                type="date"
                required
                value={payLogDate}
                onChange={(e) => setPayLogDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Influencer + Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Influencer Name</label>
              <input
                type="text"
                required
                value={payLogInfluencerName}
                onChange={(e) => setPayLogInfluencerName(e.target.value)}
                placeholder="e.g. Archi Thakur"
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Brand Name</label>
              <input
                type="text"
                required
                value={payLogBrandName}
                onChange={(e) => setPayLogBrandName(e.target.value)}
                placeholder="e.g. Loomista / Vaasva"
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Amount + Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                value={payLogAmount}
                onChange={(e) => setPayLogAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10000"
                className={`w-full bg-white border focus:outline-none rounded-xl px-3 py-2 font-black text-sm ${payLogType === 'IN' ? 'border-emerald-300 focus:border-emerald-500 text-emerald-700' : 'border-rose-300 focus:border-rose-500 text-rose-700'}`}
              />
            </div>
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Payment Mode</label>
              <select
                value={payLogMode}
                onChange={(e) => setPayLogMode(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              >
                <option value="Bank Transfer">🏦 Bank Transfer (IMPS/NEFT)</option>
                <option value="UPI">📱 UPI Payment</option>
                <option value="Cash">💵 Cash</option>
                <option value="Cheque">📑 Cheque</option>
              </select>
            </div>
          </div>

          {/* Ref No + Handled By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Ref / Txn No.</label>
              <input
                type="text"
                value={payLogRefNo}
                onChange={(e) => setPayLogRefNo(e.target.value)}
                placeholder="e.g. TXN-LOM-9921"
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Handled By</label>
              <input
                type="text"
                value={payLogHandledBy}
                onChange={(e) => setPayLogHandledBy(e.target.value)}
                placeholder="e.g. Yash / Lakshita"
                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-800 font-extrabold uppercase mb-1.5">Payment Notes</label>
            <textarea
              rows={2}
              value={payLogNotes}
              onChange={(e) => setPayLogNotes(e.target.value)}
              placeholder="e.g. 50% advance payout cleared for Loomista reel campaign..."
              className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl p-2.5 font-medium focus:outline-none resize-none"
            />
          </div>

          {/* Amount Preview */}
          {payLogAmount !== '' && Number(payLogAmount) > 0 && (
            <div className={`p-3 rounded-xl text-center font-black text-lg border ${payLogType === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
              {payLogType === 'IN' ? '📥 +' : '📤 -'}₹{Number(payLogAmount).toLocaleString()} — {payLogType === 'IN' ? 'Brand Payment IN' : 'Influencer Payout OUT'}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded-xl font-bold transition text-xs shadow-md ${payLogType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              Save {payLogType === 'IN' ? '📥 IN' : '📤 OUT'} Payment Log
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
