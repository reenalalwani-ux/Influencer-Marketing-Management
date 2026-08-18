import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Plus, Search, Filter, DollarSign, User, Trash2, Edit2, 
  ArrowUpRight, ArrowDownRight, ExternalLink, Video, Link2, ChevronDown, 
  Receipt, Eye, ShoppingBag, ChevronUp, ChevronsUpDown, Target, TrendingUp,
  Award, Clock, AlertCircle, CheckCircle2, ShieldCheck, Layers, RefreshCw, Users,
  Calendar, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import { api } from '../services/api';
import { InfluencerTransaction, Brand, PaymentLogItem, TargetItem, TeamTargetBreakdown, MemberTargetItem } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { InlineLoader } from '../components/PageLoader';
import { MonthDatePicker } from '../components/MonthDatePicker';

interface InfluencerManagementViewProps {
  userRole?: string;
  initialTab?: 'targets' | 'paid' | 'barter' | 'payments' | 'all';
  onTargetUpdated?: () => void;
}

// Helper to get current month timeframe key
const getCurrentMonthTimeframe = () => {
  const now = new Date();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  return `${monthNames[now.getMonth()]}_${now.getFullYear()}`;
};

// Custom Pill Select for Status
const StatusPillDropdown: React.FC<{
  currentStatus: string;
  onSelect: (newStatus: string) => void;
}> = ({ currentStatus, onSelect }) => {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus || 'Completed'}
        onChange={(e) => onSelect(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-2xs transition ${
          currentStatus === 'Completed'
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

// Custom Pill Select for Approval
const ApprovalPillDropdown: React.FC<{
  isApproved: boolean;
  onSelect: (newApproved: boolean) => void;
}> = ({ isApproved, onSelect }) => {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={isApproved ? 'Yes' : 'No'}
        onChange={(e) => onSelect(e.target.value === 'Yes')}
        className={`appearance-none pl-3 pr-7 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-2xs transition ${
          isApproved
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

export const InfluencerManagementView: React.FC<InfluencerManagementViewProps> = ({
  userRole,
  initialTab = 'paid',
  onTargetUpdated
}) => {
  const [influencers, setInfluencers] = useState<InfluencerTransaction[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [teamBreakdown, setTeamBreakdown] = useState<TeamTargetBreakdown | null>(null);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<MemberTargetItem | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'brands' | 'deals'>('overview');
  const [detailDealsSearch, setDetailDealsSearch] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab View Mode State
  const mapInitialTab = (tab: string) => {
    if (tab === 'targets') return 'Targets & Goals';
    if (tab === 'barter') return 'Barter Collaborations';
    if (tab === 'payments') return 'Payment Audit Logs';
    if (tab === 'all') return 'All Collaborations';
    return 'Paid Collaborations';
  };

  const [viewMode, setViewMode] = useState<'Targets & Goals' | 'Paid Collaborations' | 'Barter Collaborations' | 'Payment Audit Logs' | 'All Collaborations'>(mapInitialTab(initialTab));
  
  // Category Filter State
  const [activeCategory, setActiveCategory] = useState<'All' | 'Paid' | 'Barter'>('All');
  const [timeframe, setTimeframe] = useState<string>(getCurrentMonthTimeframe());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayLogType, setSelectedPayLogType] = useState<'All' | 'IN' | 'OUT'>('All');

  const monthsList = [
    { label: 'August 2026 (Current)', value: 'august_2026', monthIndex: 7, year: 2026 },
    { label: 'July 2026', value: 'july_2026', monthIndex: 6, year: 2026 },
    { label: 'June 2026', value: 'june_2026', monthIndex: 5, year: 2026 },
    { label: 'May 2026', value: 'may_2026', monthIndex: 4, year: 2026 },
    { label: 'April 2026', value: 'april_2026', monthIndex: 3, year: 2026 },
    { label: 'March 2026', value: 'march_2026', monthIndex: 2, year: 2026 },
    { label: 'February 2026', value: 'february_2026', monthIndex: 1, year: 2026 },
    { label: 'January 2026', value: 'january_2026', monthIndex: 0, year: 2026 },
    { label: 'All Months (Lifetime)', value: 'all', monthIndex: -1, year: 2026 },
  ];

  const handlePrevMonth = () => {
    const curIdx = monthsList.findIndex(m => m.value === timeframe);
    if (curIdx !== -1 && curIdx < monthsList.length - 2) {
      setTimeframe(monthsList[curIdx + 1].value);
    } else if (timeframe === 'all') {
      setTimeframe('august_2026');
    }
  };

  const handleNextMonth = () => {
    const curIdx = monthsList.findIndex(m => m.value === timeframe);
    if (curIdx > 0) {
      setTimeframe(monthsList[curIdx - 1].value);
    }
  };

  const handleCurrentMonth = () => {
    setTimeframe(getCurrentMonthTimeframe());
  };

  // Metrics
  const [metrics, setMetrics] = useState({
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    totalCount: 0
  });

  // Sorting State — Default Ascending (1, 2, 3...) by sNo
  const [sortKey, setSortKey] = useState<string>('sNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const isManagerOrAdmin = userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Marketing Manager' || userRole === 'Team Leader';

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

  // Modal State — Target Record
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);
  const [targetFormData, setTargetFormData] = useState({
    title: '',
    targetType: 'Paid' as 'Paid' | 'Barter',
    targetMetric: 'Margin' as 'Margin' | 'Revenue' | 'Count',
    targetAmount: '500000',
    targetCount: '120',
    currency: '₹',
    period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    isActive: true,
    autoSync: true,
    status: 'Active'
  });
  const [savingTarget, setSavingTarget] = useState(false);

  // Form Fields (Influencer Record)
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
  const itemsPerPage = 10;

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.success) setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Targets (Month-Aware)
  const fetchTargets = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await api.get(`/targets?timeframe=${timeframe}&year=${year}&month=${month}`);
      if (res.success) {
        setTargets(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch targets', err);
    }
  };

  // Fetch Team Breakdown (Month-Aware)
  const fetchTeamBreakdown = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await api.get(`/targets/team-breakdown?timeframe=${timeframe}&year=${year}&month=${month}`);
      if (res.success && res.data) {
        setTeamBreakdown(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch team target breakdown', err);
    }
  };

  // Fetch Influencers
  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      let url = `/influencers?timeframe=${timeframe}&year=${year}&month=${month}`;
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

  // Fetch Payment Audit Logs
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
    fetchTargets();
    fetchTeamBreakdown();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (viewMode === 'Payment Audit Logs') {
      fetchPaymentLogs();
    } else if (viewMode === 'Targets & Goals') {
      fetchTargets();
      fetchTeamBreakdown();
      fetchInfluencers();
    } else {
      fetchInfluencers();
    }
  }, [activeCategory, timeframe, currentDate, searchTerm, viewMode, selectedPayLogType]);

  // Target Action Handlers
  const handleOpenCreateTargetModal = (defaultType: 'Paid' | 'Barter' = 'Paid') => {
    const defaultPeriod = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
    setTargetFormData({
      title: defaultType === 'Barter' ? `Barter Target - ${defaultPeriod}` : `Monthly Revenue Target - ${defaultPeriod}`,
      targetType: defaultType,
      targetMetric: defaultType === 'Barter' ? 'Count' : 'Margin',
      targetAmount: '',
      targetCount: '',
      currency: defaultType === 'Barter' ? 'Collabs' : '₹',
      period: defaultPeriod,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: defaultType === 'Barter' 
        ? 'Monthly barter collaboration target set by AD2ship.'
        : 'Monthly AD2ship profit margin target (Brand Quoted Price - Influencer Cost).',
      isActive: true,
      autoSync: true,
      status: 'Active'
    });
    setEditingTarget(null);
    setShowTargetModal(true);
  };

  const handleOpenEditTargetModal = (target: TargetItem) => {
    setEditingTarget(target);
    setTargetFormData({
      title: target.title,
      targetType: target.targetType || 'Paid',
      targetMetric: target.targetMetric || (target.targetType === 'Barter' ? 'Count' : 'Margin'),
      targetAmount: (target.targetAmount || 0).toString(),
      targetCount: (target.targetCount || target.targetAmount || 0).toString(),
      currency: target.currency || (target.targetType === 'Barter' ? 'Collabs' : '₹'),
      period: target.period,
      startDate: target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : '',
      endDate: target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : '',
      description: target.description || '',
      isActive: target.isActive,
      autoSync: target.autoSync !== false,
      status: target.status
    });
    setShowTargetModal(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      const payload = {
        title: targetFormData.title,
        targetType: targetFormData.targetType,
        targetMetric: targetFormData.targetMetric,
        targetAmount: Number(targetFormData.targetAmount),
        targetCount: Number(targetFormData.targetCount || targetFormData.targetAmount),
        currency: targetFormData.currency,
        period: targetFormData.period,
        startDate: targetFormData.startDate || undefined,
        endDate: targetFormData.endDate || undefined,
        description: targetFormData.description,
        isActive: targetFormData.isActive,
        autoSync: targetFormData.autoSync,
        status: targetFormData.status
      };

      let res;
      if (editingTarget) {
        res = await api.put(`/targets/${editingTarget._id}`, payload);
      } else {
        res = await api.post('/targets', payload);
      }

      if (res.success) {
        setShowTargetModal(false);
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save target');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleSetActiveTarget = async (id: string) => {
    try {
      const res = await api.patch(`/targets/${id}/active`);
      if (res.success) {
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to set active target');
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this target record?')) return;
    try {
      const res = await api.delete(`/targets/${id}`);
      if (res.success) {
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete target');
    }
  };

  // Influencer Record Handlers
  const openAddModal = (defaultCategory: 'Paid' | 'Barter' = 'Paid') => {
    setEditingItem(null);
    setInfluencerManager('');
    setInfluencerName('');
    setSelectedBrandId('');
    setCustomBrandName('');
    setPhone('');
    setProfileLink('');
    setCategory(defaultCategory);
    setBrandOnboardingAmt('');
    setBrandReceivedAmt('');
    setInfluencerOnboardingAmt('');
    setInfluencerPaidAmt('');
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
    setViewsCount('');
    setOrdersCount('');
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

  const handleSubmitInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const brandObj = brands.find(b => b._id === selectedBrandId);
      const bName = brandObj ? brandObj.brandName : (customBrandName || 'Bunaiwala');

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
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save influencer record');
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this influencer record?')) return;
    try {
      const res = await api.delete(`/influencers/${id}`);
      if (res.success) {
        fetchInfluencers();
        fetchTargets();
        if (onTargetUpdated) onTargetUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  // Payment Log Handlers
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
        brandName: payLogBrandName || 'Bunaiwala',
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

  // Inline table update handlers
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

  // Filtered & Sorted Influencers
  const filteredInfluencers = influencers.filter(i => {
    if (viewMode === 'Paid Collaborations' && i.category !== 'Paid') return false;
    if (viewMode === 'Barter Collaborations' && i.category !== 'Barter') return false;
    return true;
  }).sort((a, b) => {
    let valA = (a as any)[sortKey];
    let valB = (b as any)[sortKey];

    if (sortKey === 'sNo') {
      valA = a.sNo || 0;
      valB = b.sNo || 0;
    } else if (sortKey === 'transactionDate') {
      valA = new Date(a.transactionDate).getTime();
      valB = new Date(b.transactionDate).getTime();
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate Metrics from Current View
  const paidCollabs = influencers.filter(i => i.category === 'Paid');
  const barterCollabs = influencers.filter(i => i.category === 'Barter');

  const totalBrandBilling = paidCollabs.reduce((acc, curr) => acc + (curr.brandOnboardingAmt || curr.inAmount || 0), 0);
  const totalInfluencerCost = paidCollabs.reduce((acc, curr) => acc + (curr.influencerOnboardingAmt || curr.outAmount || 0), 0);
  const netAd2shipMargin = totalBrandBilling - totalInfluencerCost;
  const marginPercentage = totalBrandBilling > 0 ? Math.round((netAd2shipMargin / totalBrandBilling) * 100) : 0;

  const totalBrandReceived = paidCollabs.reduce((acc, curr) => acc + (curr.brandReceivedAmt || curr.inAmount || 0), 0);
  const totalInfluencerPaid = paidCollabs.reduce((acc, curr) => acc + (curr.influencerPaidAmt || curr.outAmount || 0), 0);
  const cashflowBalance = totalBrandReceived - totalInfluencerPaid;

  const totalBarterViews = barterCollabs.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
  const totalBarterOrders = barterCollabs.reduce((acc, curr) => acc + (curr.ordersCount || 0), 0);

  // Active Target Calculations
  const activePaidTarget = targets.find(t => t.isActive && (t.targetType === 'Paid' || !t.targetType)) || targets.find(t => (t.targetType === 'Paid' || !t.targetType));
  const activeBarterTarget = targets.find(t => t.isActive && t.targetType === 'Barter') || targets.find(t => t.targetType === 'Barter');

  const paidAchieved = activePaidTarget ? activePaidTarget.achievedAmount : (teamBreakdown?.teamAchievedMargin || netAd2shipMargin);
  const paidGoal = activePaidTarget ? activePaidTarget.targetAmount : (teamBreakdown?.teamTargetAmount || 720000);
  const paidPct = paidGoal > 0 ? Math.min(100, Math.round((paidAchieved / paidGoal) * 100)) : 0;

  const barterAchieved = activeBarterTarget ? (activeBarterTarget.achievedCount || activeBarterTarget.achievedAmount || 0) : (teamBreakdown?.teamAchievedBarterCount || barterCollabs.length);
  const barterGoal = (activeBarterTarget && activeBarterTarget.targetAmount) ? (activeBarterTarget.targetCount || activeBarterTarget.targetAmount) : (teamBreakdown?.teamBarterTarget || 0);
  const barterPct = barterGoal > 0 ? Math.min(100, Math.round((barterAchieved / barterGoal) * 100)) : 0;

  // Pagination
  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedInfluencers = filteredInfluencers.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const SortHeader = ({ field, label, align = 'left' }: { field: string; label: string; align?: 'left' | 'right' | 'center' }) => {
    const isSorted = sortKey === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`px-3.5 py-3 border-b border-r border-slate-700/80 select-none cursor-pointer hover:bg-slate-700/90 transition-colors bg-slate-800 text-slate-200 text-xs font-bold ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span className="truncate">{label}</span>
          {isSorted ? (
            sortDir === 'asc' ? <ChevronUp size={13} className="text-purple-300" /> : <ChevronDown size={13} className="text-purple-300" />
          ) : (
            <ChevronsUpDown size={11} className="text-slate-400 opacity-40 hover:opacity-100" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Influencer & Revenue Management</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Paid Collaboration Profit Margins, Barter Collaboration Count Goals, and Complete Payment In/Out Ledger.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {isManagerOrAdmin && (
            <button
              onClick={() => handleOpenCreateTargetModal('Paid')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center space-x-2 transition"
            >
              <Target size={16} className="text-purple-600" />
              <span>Set Target</span>
            </button>
          )}

          <button
            onClick={() => openAddModal('Paid')}
            className="px-4 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-md transition"
          >
            <Plus size={16} />
            <span>Add Collaboration</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setViewMode('Targets & Goals')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition ${
              viewMode === 'Targets & Goals'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
            }`}
          >
            <Target size={15} />
            <span>Targets & Goals</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              viewMode === 'Targets & Goals' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
            }`}>
              {targets.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('Paid Collaborations')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition ${
              viewMode === 'Paid Collaborations'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
            }`}
          >
            <DollarSign size={15} />
            <span>Paid Collaborations</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              viewMode === 'Paid Collaborations' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {paidCollabs.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('Barter Collaborations')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition ${
              viewMode === 'Barter Collaborations'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Barter Collaborations</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              viewMode === 'Barter Collaborations' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {barterCollabs.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('Payment Audit Logs')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition ${
              viewMode === 'Payment Audit Logs'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
            }`}
          >
            <Receipt size={15} />
            <span>Payment Audit Logs</span>
          </button>

          <button
            onClick={() => setViewMode('All Collaborations')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2 transition ${
              viewMode === 'All Collaborations'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold'
            }`}
          >
            <Layers size={15} />
            <span>All Records</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
              viewMode === 'All Collaborations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {influencers.length}
            </span>
          </button>
        </div>

        {/* Global Filters with Modern Visual Calendar Picker */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <MonthDatePicker 
            timeframe={timeframe} 
            onChange={(newTimeframe) => setTimeframe(newTimeframe)} 
          />

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search influencer / brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium w-48 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: TARGETS & REVENUE GOALS */}
      {viewMode === 'Targets & Goals' && (
        <div className="space-y-6">
          {/* Top Restructured Auto-Fill Summary Banner (Light Theme) */}
          <div className="p-6 bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-emerald-50/90 text-slate-900 rounded-3xl border border-purple-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  ⚡ Auto-Filled from Active Team Size
                </span>
                <span className="text-xs text-purple-700 font-extrabold">
                  {teamBreakdown?.teamSize || 6} Active Influencer Marketing Executives
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                <Target className="text-purple-600" size={24} />
                Team Monthly Margin Target: <span className="text-emerald-700">₹{new Intl.NumberFormat().format(teamBreakdown?.teamTargetAmount || 720000)}</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Auto-calculated quota: <strong className="text-slate-900 font-black">₹1,20,000 Net Margin per member</strong> × {teamBreakdown?.teamSize || 6} executives.
              </p>
            </div>

            <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Team Achieved Margin</span>
                <span className="text-2xl font-black text-emerald-600">
                  ₹{new Intl.NumberFormat().format(teamBreakdown?.teamAchievedMargin || 0)}
                </span>
                <span className="text-[11px] font-extrabold text-purple-700 block">
                  {teamBreakdown?.teamCompletionPercent || 0}% Team Quota Met
                </span>
              </div>

              <div className="h-10 w-px bg-slate-200 hidden sm:block" />

              <span className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase border shadow-2xs ${
                (teamBreakdown?.teamAchievedMargin || 0) >= (teamBreakdown?.teamTargetAmount || 720000)
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : (teamBreakdown?.teamAchievedMargin || 0) >= ((teamBreakdown?.teamSize || 6) * 80000)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {(teamBreakdown?.teamAchievedMargin || 0) >= (teamBreakdown?.teamTargetAmount || 720000) ? '🏆 10% Slab' : (teamBreakdown?.teamAchievedMargin || 0) >= ((teamBreakdown?.teamSize || 6) * 80000) ? '🥈 5% Slab (80k+)' : '⚡ 0% Slab'}
              </span>
            </div>
          </div>

          {/* 3 Incentive Slabs & Restructuring Rules Visualizer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-2 bg-gradient-to-br from-emerald-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                  <Award size={16} className="text-emerald-600" /> Tier 1: 10% Incentive Slab
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
                  10% Payout
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                Target: ₹1,00,000+ / ₹1,20,000 Net Margin
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Executive receives <strong className="text-emerald-700 font-bold">10% incentive</strong> on entire Ad2ship Net Profit Margin achieved.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-2 bg-gradient-to-br from-blue-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-800 uppercase flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-blue-600" /> Tier 2: 5% Incentive Slab
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
                  5% Payout
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                Target: ₹80,000 to ₹99,999 Net Margin
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Executive receives <strong className="text-blue-700 font-bold">5% incentive</strong> on entire Ad2ship Net Profit Margin achieved.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2 bg-gradient-to-br from-amber-50/50 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-600" /> 100+ Orders Video Bonus
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900">
                  +10% Deal Bonus
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-900">
                Per Video with 100+ Orders Driven
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Extra <strong className="text-amber-800 font-bold">10% bonus on that video's Ad2ship margin</strong> (stacks on top of monthly incentive).
              </p>
            </div>
          </div>

          {/* Social Media & Influencer Marketing Team Quota Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-purple-600" />
                  Social Media & Influencer Marketing Team Quota Breakdown
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Auto-filled ₹1,20,000 monthly quota per active executive. Click any card to view detailed brand assignments & deal breakdown.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
                Total Team Members: <strong className="text-purple-700 font-extrabold">{teamBreakdown?.teamSize || 6} Executives</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(teamBreakdown?.members || []).map((m) => {
                const isTier1 = m.targetTier === '10%';
                const isTier2 = m.targetTier === '5%';

                return (
                  <div 
                    key={m.employee.id} 
                    onClick={() => {
                      setSelectedMemberForDetail(m);
                      setDetailActiveTab('overview');
                    }}
                    className="p-4 bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
                          {m.employee.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-purple-700 transition-colors flex items-center gap-1">
                            <span>{m.employee.name}</span>
                            <ArrowUpRight size={12} className="text-slate-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition" />
                          </h4>
                          <span className="text-[10px] text-purple-600 font-bold">{m.employee.employeeId} • {m.employee.assignedBrandsCount} Brands</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isTier1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isTier2 ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isTier1 ? '🏆 10% Slab' : isTier2 ? '🥈 5% Slab (80k+)' : '0% Slab'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-600">Net Margin: <strong className="text-slate-900">₹{new Intl.NumberFormat().format(m.netMargin)}</strong></span>
                        <span className="text-purple-600">{m.targetAchievedPercent}% of ₹1.2L</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.targetAchievedPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Auto-Calculated Barter Goal for Member */}
                    {m.individualBarterTarget !== undefined && m.individualBarterTarget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Barter Collabs: <strong className="text-purple-700">{m.barterCount} / {m.individualBarterTarget}</strong></span>
                          <span className="text-purple-600 font-extrabold">{m.barterAchievedPercent || 0}% Goal</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${m.barterAchievedPercent || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Incentive Breakdown Box */}
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Target Bonus {isTier1 ? '(10%)' : isTier2 ? '(5%)' : '(0%)'}
                        </span>
                        <span className="font-extrabold text-slate-800 text-xs">₹{new Intl.NumberFormat().format(m.targetIncentiveAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">100+ Order Bonus</span>
                        <span className="font-extrabold text-amber-700 text-xs">+₹{new Intl.NumberFormat().format(m.orderBonusAmount)}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-black text-emerald-700">Total Take-Home:</span>
                        <span className="font-black text-emerald-600 text-sm">₹{new Intl.NumberFormat().format(m.totalTakeHomeIncentive)}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold flex justify-between items-center">
                      <span>Collabs Done: <strong className="text-purple-700">{m.barterCount}B : {m.paidCount}P</strong></span>
                      {m.qualifyingBonusDealsCount > 0 ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">🌟 {m.qualifyingBonusDealsCount} viral</span>
                      ) : (
                        <span className="text-purple-600 font-bold text-[10px] group-hover:underline">View details →</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dual Compact Active Target Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Paid Target (AD2ship Margin) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Paid Revenue Target
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {activePaidTarget ? activePaidTarget.title : 'Monthly Revenue Target'}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {activePaidTarget ? activePaidTarget.period : `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Target Margin</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(paidGoal)}` : <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-black">PAID</span>}
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Achieved Margin</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(paidAchieved)}` : <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">PAID</span>}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-600" /> {paidPct}% Progress
                  </span>
                  <span className="text-slate-400">
                    {isManagerOrAdmin ? `Remaining: ₹${new Intl.NumberFormat().format(Math.max(0, paidGoal - paidAchieved))}` : <span className="text-[10px] font-bold text-purple-600">PAID COLLABORATIONS</span>}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>

              {isManagerOrAdmin && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">Auto-Sync: <strong className="text-emerald-600">{activePaidTarget?.autoSync !== false ? 'Active' : 'Off'}</strong></span>
                  {activePaidTarget ? (
                    <button
                      onClick={() => handleOpenEditTargetModal(activePaidTarget)}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Edit Target
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCreateTargetModal('Paid')}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
                    >
                      <Plus size={12} /> Create Target
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Barter Target (120 Collabs) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Barter Collabs Goal
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {activeBarterTarget ? activeBarterTarget.title : 'Monthly Barter Target'}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {activeBarterTarget ? activeBarterTarget.period : `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Target Collab Volume</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {barterGoal} <span className="text-xs font-normal text-slate-400">Collabs</span>
                  </p>
                </div>
                <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">Achieved Barter Deals</p>
                  <p className="text-lg font-black text-purple-600 mt-0.5">
                    {barterAchieved} <span className="text-xs font-normal text-slate-400">Done</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <Award size={12} className="text-purple-600" /> {barterPct}% Completed
                  </span>
                  <span className="text-slate-400">
                    Remaining: {Math.max(0, barterGoal - barterAchieved)} Collabs
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${barterPct}%` }}
                  />
                </div>
              </div>

              {isManagerOrAdmin && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">Auto-Sync: <strong className="text-purple-600">{activeBarterTarget?.autoSync !== false ? 'Active' : 'Off'}</strong></span>
                  {activeBarterTarget ? (
                    <button
                      onClick={() => handleOpenEditTargetModal(activeBarterTarget)}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Edit Target
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCreateTargetModal('Barter')}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-lg transition text-xs flex items-center gap-1"
                    >
                      <Plus size={12} /> Create Target
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Full Target Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-purple-600" />
                  Target Records Directory
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  All active & historical AD2ship monthly targets.
                </p>
              </div>

              {isManagerOrAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenCreateTargetModal('Paid')}
                    className="px-3.5 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Set Paid Target
                  </button>
                  <button
                    onClick={() => handleOpenCreateTargetModal('Barter')}
                    className="px-3.5 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Set Barter Target
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 font-bold">
                    <th className="p-3 border-b border-r border-slate-700">Target Title</th>
                    <th className="p-3 border-b border-r border-slate-700">Type</th>
                    <th className="p-3 border-b border-r border-slate-700 text-right">Target Goal</th>
                    <th className="p-3 border-b border-r border-slate-700 text-right">Achieved</th>
                    <th className="p-3 border-b border-r border-slate-700">Progress</th>
                    <th className="p-3 border-b border-r border-slate-700">Period</th>
                    <th className="p-3 border-b border-r border-slate-700 text-center">Status</th>
                    <th className="p-3 border-b border-slate-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">
                        No targets created yet. Click "+ Set Monthly Target" to get started.
                      </td>
                    </tr>
                  ) : (
                    targets.map((t) => {
                      const isBarter = t.targetType === 'Barter';
                      const goalVal = isBarter ? (t.targetCount || t.targetAmount) : t.targetAmount;
                      const achVal = isBarter ? (t.achievedCount || t.achievedAmount || 0) : t.achievedAmount;
                      const pct = Math.min(100, Math.round(((achVal || 0) / (goalVal || 1)) * 100));

                      return (
                        <tr key={t._id} className={`hover:bg-slate-50 transition ${t.isActive ? 'bg-purple-50/40 font-semibold' : ''}`}>
                          <td className="p-3 border-r border-slate-100">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {t.isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Banner Target" />}
                              <span>{t.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{t.description || 'Monthly AD2ship Target'}</span>
                          </td>

                          <td className="p-3 border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                              isBarter ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'
                            }`}>
                              {t.targetType || 'Paid'}
                            </span>
                          </td>

                          <td className="p-3 border-r border-slate-100 text-right font-extrabold text-slate-900">
                            {isBarter ? `${goalVal} Collabs` : isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(goalVal)}` : <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black">PAID</span>}
                          </td>

                          <td className="p-3 border-r border-slate-100 text-right font-extrabold text-emerald-600">
                            {isBarter ? `${achVal} Collabs` : isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(achVal)}` : <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">PAID</span>}
                          </td>

                          <td className="p-3 border-r border-slate-100 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isBarter ? 'bg-blue-500' : 'bg-purple-600'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-extrabold shrink-0 text-slate-700">{pct}%</span>
                            </div>
                          </td>

                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-600">
                            {t.period}
                          </td>

                          <td className="p-3 border-r border-slate-100 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              t.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {t.status}
                            </span>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {isManagerOrAdmin && (
                              <div className="flex items-center justify-center gap-2">
                                {!t.isActive ? (
                                  <button
                                    onClick={() => handleSetActiveTarget(t._id)}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-200 transition cursor-pointer"
                                    title="Set as Top Banner Active Target"
                                  >
                                    Set Active
                                  </button>
                                ) : (
                                  <div className="w-[70px]" />
                                )}
                                <div className="flex items-center space-x-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditTargetModal(t)}
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-purple-600 border border-slate-200 hover:border-purple-200 transition cursor-pointer"
                                    title="Edit Target"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTarget(t._id)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                    title="Delete Target"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2 & VIEW 3 & VIEW 5: PAID / BARTER / ALL COLLABORATIONS */}
      {(viewMode === 'Paid Collaborations' || viewMode === 'Barter Collaborations' || viewMode === 'All Collaborations') && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          {viewMode === 'Barter Collaborations' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Barter Collabs Done</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{barterCollabs.length}</h4>
                  <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Completed Product Deals</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShoppingBag size={24} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Monthly Goal Progress</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">
                    {barterAchieved} {barterGoal > 0 ? `/ ${barterGoal}` : ''}
                  </h4>
                  <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                    {barterGoal > 0 ? `${barterPct}% Goal Achieved` : 'No Active Goal'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Award size={24} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Views Generated</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{new Intl.NumberFormat().format(totalBarterViews)}</h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Sum of Content Views</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Eye size={24} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Orders Driven</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{new Intl.NumberFormat().format(totalBarterOrders)}</h4>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Conversion Product Orders</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Brand Onboarding (IN)</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(totalBrandBilling)}` : <span className="inline-flex items-center px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-sm font-black shadow-2xs">PAID</span>}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Client Agreed Revenue</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ArrowDownRight size={24} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Creator Cost (OUT)</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(totalInfluencerCost)}` : <span className="inline-flex items-center px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-sm font-black shadow-2xs">PAID</span>}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Real Influencer Payout</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  <ArrowUpRight size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-md flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">AD2ship Profit Margin</p>
                  <h4 className="text-2xl font-black text-white mt-1">
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(netAd2shipMargin)}` : <span className="inline-flex items-center px-3 py-1 rounded-xl bg-white/20 text-white text-sm font-black shadow-2xs backdrop-blur-xs">PAID</span>}
                  </h4>
                  <p className="text-[11px] text-emerald-100 font-bold mt-0.5">{isManagerOrAdmin ? `Margin: ${marginPercentage}% Profit` : 'Paid Collaborations Active'}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold backdrop-blur-xs">
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cashflow Balance</p>
                  <h4 className={`text-2xl font-black mt-1 ${cashflowBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isManagerOrAdmin ? `₹${new Intl.NumberFormat().format(cashflowBalance)}` : <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-black shadow-2xs">PAID</span>}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Received IN - Paid OUT</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Receipt size={24} />
                </div>
              </div>
            </div>
          )}

          {/* Main Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {viewMode === 'Paid Collaborations' && <DollarSign className="text-emerald-600" size={20} />}
                  {viewMode === 'Barter Collaborations' && <ShoppingBag className="text-blue-600" size={20} />}
                  {viewMode === 'All Collaborations' && <Layers className="text-purple-600" size={20} />}
                  {viewMode} Ledger
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Showing {filteredInfluencers.length} records • Real-time AD2ship financial margins and deliverable metrics.
                </p>
              </div>

              <button
                onClick={() => openAddModal(viewMode === 'Barter Collaborations' ? 'Barter' : 'Paid')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={15} /> Add Record
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 font-bold">
                    <SortHeader field="sNo" label="#" align="center" />
                    <SortHeader field="transactionDate" label="Date" />
                    <SortHeader field="influencerManager" label="Manager" />
                    <SortHeader field="brandName" label="Brand" />
                    <SortHeader field="influencerName" label="Influencer" />
                    <SortHeader field="category" label="Category" align="center" />
                    
                    {/* Paid Financial Headers */}
                    {(viewMode === 'Paid Collaborations' || viewMode === 'All Collaborations') && (
                      <>
                        <SortHeader field="brandOnboardingAmt" label="Brand Price (IN)" align="right" />
                        <SortHeader field="influencerOnboardingAmt" label="Creator Price (OUT)" align="right" />
                        <SortHeader field="ad2shipMargin" label="AD2ship Margin" align="right" />
                        <SortHeader field="ordersCount" label="Orders & Bonus" align="center" />
                      </>
                    )}

                    {/* Barter Deliverable Headers */}
                    {(viewMode === 'Barter Collaborations' || viewMode === 'All Collaborations') && (
                      <>
                        <SortHeader field="videoType" label="Deliverable" />
                        <SortHeader field="viewsCount" label="Views / Orders" align="right" />
                      </>
                    )}

                    <SortHeader field="status" label="Status" align="center" />
                    <SortHeader field="isApproved" label="Approved" align="center" />
                    <th className="p-3 border-b border-slate-700 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="p-12 text-center">
                        <InlineLoader message="Loading influencer ledger data..." />
                      </td>
                    </tr>
                  ) : paginatedInfluencers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-12 text-center text-slate-400 font-semibold">
                        No records match the selected filters. Click "+ Add Record" to enter new collaborations.
                      </td>
                    </tr>
                  ) : (
                    paginatedInfluencers.map((item, idx) => {
                      const isPaid = item.category === 'Paid';
                      const margin = (item.brandOnboardingAmt || item.inAmount || 0) - (item.influencerOnboardingAmt || item.outAmount || 0);
                      const orders = item.ordersGenerated !== undefined ? item.ordersGenerated : (item.ordersCount || 0);
                      const isBonusQualified = isPaid && orders >= 100;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50 transition">
                          <td className="p-3 border-r border-slate-100 text-center font-extrabold text-slate-500">
                            {(safeCurrentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          <td className="p-3 border-r border-slate-100 font-semibold whitespace-nowrap text-slate-600">
                            {new Date(item.transactionDate).toLocaleDateString()}
                          </td>

                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">
                            {item.influencerManager || 'Staff'}
                          </td>

                          <td className="p-3 border-r border-slate-100 font-extrabold text-slate-900">
                            {item.brandName}
                          </td>

                          <td className="p-3 border-r border-slate-100">
                            <div className="font-extrabold text-purple-700">{item.influencerName}</div>
                            {item.phone && <div className="text-[10px] text-slate-400 font-medium">{item.phone}</div>}
                          </td>

                          <td className="p-3 border-r border-slate-100 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {item.category}
                            </span>
                          </td>

                          {/* Financial Columns */}
                          {(viewMode === 'Paid Collaborations' || viewMode === 'All Collaborations') && (
                            <>
                              <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900">
                                {isManagerOrAdmin ? (
                                  `₹${new Intl.NumberFormat().format(item.brandOnboardingAmt || item.inAmount || 0)}`
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-black border border-purple-200">PAID</span>
                                )}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-right font-black text-slate-700">
                                {isManagerOrAdmin ? (
                                  `₹${new Intl.NumberFormat().format(item.influencerOnboardingAmt || item.outAmount || 0)}`
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-black border border-purple-200">PAID</span>
                                )}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-right font-black text-emerald-600 bg-emerald-50/30">
                                {isManagerOrAdmin ? (
                                  `₹${new Intl.NumberFormat().format(margin)}`
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">PAID</span>
                                )}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-center">
                                {isBonusQualified ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                      🌟 {orders} orders
                                    </span>
                                    {isManagerOrAdmin && (
                                      <div className="text-[10px] font-black text-emerald-700">
                                        +₹{new Intl.NumberFormat().format(Math.round(margin * 0.10))} Bonus
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {orders > 0 ? `${orders} orders` : '—'}
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          {/* Barter Columns */}
                          {(viewMode === 'Barter Collaborations' || viewMode === 'All Collaborations') && (
                            <>
                              <td className="p-3 border-r border-slate-100">
                                <span className="font-semibold text-slate-800">{item.videoType || 'Product Video'}</span>
                                {item.contentLink && (
                                  <a href={item.contentLink} target="_blank" rel="noreferrer" className="block text-[10px] text-purple-600 font-bold hover:underline truncate max-w-[120px]">
                                    🔗 Link
                                  </a>
                                )}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-700">
                                {item.viewsCount || 0} views / {orders} orders
                              </td>
                            </>
                          )}

                          <td className="p-3 border-r border-slate-100 text-center">
                            <StatusPillDropdown
                              currentStatus={item.status}
                              onSelect={(newStat) => handleStatusChange(item._id, newStat)}
                            />
                          </td>

                          <td className="p-3 border-r border-slate-100 text-center">
                            <ApprovalPillDropdown
                              isApproved={item.isApproved !== false}
                              onSelect={(newAppr) => handleApprovalChange(item._id, newAppr)}
                            />
                          </td>

                          <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                              title="Edit Record"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteInfluencer(item._id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={filteredInfluencers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: PAYMENT AUDIT LOGS */}
      {viewMode === 'Payment Audit Logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt className="text-purple-600" size={20} />
                Payment In/Out Audit Logs
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Exact log of all payments received from client brands (IN) and payouts disbursed to creators (OUT).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedPayLogType}
                onChange={(e: any) => setSelectedPayLogType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold bg-slate-50"
              >
                <option value="All">All Types (IN & OUT)</option>
                <option value="IN">Payments IN (From Brand)</option>
                <option value="OUT">Payments OUT (To Creator)</option>
              </select>

              <button
                onClick={openPaymentModal}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={14} /> Log New Payment
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-200 font-bold">
                  <th className="p-3 border-b border-r border-slate-700">Date</th>
                  <th className="p-3 border-b border-r border-slate-700 text-center">Type</th>
                  <th className="p-3 border-b border-r border-slate-700">Brand Name</th>
                  <th className="p-3 border-b border-r border-slate-700">Influencer Name</th>
                  <th className="p-3 border-b border-r border-slate-700 text-right">Amount</th>
                  <th className="p-3 border-b border-r border-slate-700">Mode & Ref #</th>
                  <th className="p-3 border-b border-r border-slate-700">Handled By</th>
                  <th className="p-3 border-b border-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {paymentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                      No payment log entries recorded yet. Click "Log New Payment" to record a transaction.
                    </td>
                  </tr>
                ) : (
                  paymentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 border-r border-slate-100 font-semibold whitespace-nowrap text-slate-600">
                        {new Date(log.transactionDate).toLocaleDateString()}
                      </td>

                      <td className="p-3 border-r border-slate-100 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          log.type === 'IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-pink-100 text-pink-800 border border-pink-300'
                        }`}>
                          {log.type === 'IN' ? '📥 Payments IN' : '📤 Payments OUT'}
                        </span>
                      </td>

                      <td className="p-3 border-r border-slate-100 font-extrabold text-slate-900">
                        {log.brandName}
                      </td>

                      <td className="p-3 border-r border-slate-100 font-extrabold text-purple-700">
                        {log.influencerName}
                      </td>

                      <td className={`p-3 border-r border-slate-100 text-right font-black ${
                        log.type === 'IN' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {isManagerOrAdmin ? (
                          `${log.type === 'IN' ? '+' : '-'}₹${new Intl.NumberFormat().format(log.amount)}`
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-black border border-purple-200">PAID</span>
                        )}
                      </td>

                      <td className="p-3 border-r border-slate-100">
                        <div className="font-bold text-slate-800">{log.paymentMode}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Ref: {log.referenceNo || 'N/A'}</div>
                      </td>

                      <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">
                        {log.handledBy || 'Admin'}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeletePaymentLog(log._id)}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Delete Audit Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT INFLUENCER COLLABORATION */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Collaboration Record' : 'New Influencer Collaboration'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitInfluencer} className="space-y-4 text-xs font-bold">
          {/* Category Selector */}
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
            <span className="text-slate-700 font-black">Collaboration Type:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCategory('Paid')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  category === 'Paid' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                💼 Paid Collaboration
              </button>
              <button
                type="button"
                onClick={() => setCategory('Barter')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  category === 'Barter' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                🎁 Barter Collaboration
              </button>
            </div>
          </div>

          {/* General Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Influencer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={influencerName}
                onChange={(e) => setInfluencerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Brand Name *</label>
              <select
                value={selectedBrandId}
                onChange={(e) => {
                  setSelectedBrandId(e.target.value);
                  const found = brands.find(b => b._id === e.target.value);
                  if (found) setCustomBrandName(found.brandName);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold"
              >
                <option value="">-- Select Brand --</option>
                {brands.map(b => (
                  <option key={b._id} value={b._id}>{b.brandName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Vikram Sethi"
                value={influencerManager}
                onChange={(e) => setInfluencerManager(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Transaction Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* FINANCIAL BREAKDOWN SECTION (PAID COLLABS) */}
          {category === 'Paid' && isManagerOrAdmin && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 flex items-center justify-between">
                <span>Financial Breakdown (AD2ship Margin Engine)</span>
                <span className="text-[11px] text-purple-700 font-extrabold bg-purple-100 px-2 py-0.5 rounded-md">
                  Auto-Calculated Margin
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand Payment (IN) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Client Brand Payment (IN)</span>
                  <div>
                    <label className="block text-[10px] text-slate-600">Quoted Price to Brand (IN) ₹</label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={brandOnboardingAmt}
                      onChange={(e) => setBrandOnboardingAmt(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Actual Amount Received (IN) ₹</label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={brandReceivedAmt}
                      onChange={(e) => setBrandReceivedAmt(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-emerald-700"
                    />
                  </div>
                </div>

                {/* Creator Payout (OUT) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Influencer Payout (OUT)</span>
                  <div>
                    <label className="block text-[10px] text-slate-600">Cost Paid to Creator (OUT) ₹</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={influencerOnboardingAmt}
                      onChange={(e) => setInfluencerOnboardingAmt(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Actual Amount Disbursed (OUT) ₹</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={influencerPaidAmt}
                      onChange={(e) => setInfluencerPaidAmt(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-black text-pink-700"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time AD2ship Margin Preview */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 rounded-xl text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-100">Calculated AD2ship Profit Margin</span>
                  <p className="text-base font-black">
                    ₹{new Intl.NumberFormat().format(Number(brandOnboardingAmt || 0) - Number(influencerOnboardingAmt || 0))}
                  </p>
                </div>
                <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-lg">
                  {Number(brandOnboardingAmt || 0) > 0 
                    ? `${Math.round(((Number(brandOnboardingAmt || 0) - Number(influencerOnboardingAmt || 0)) / Number(brandOnboardingAmt || 1)) * 100)}% Profit`
                    : '0%'}
                </span>
              </div>
            </div>
          )}

          {category === 'Paid' && !isManagerOrAdmin && (
            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 flex items-center justify-between text-purple-900 font-extrabold text-xs">
              <span>🔒 Paid Collaboration Record</span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-200/80 text-purple-900 text-[11px] font-black uppercase">Financial Confidentiality Active</span>
            </div>
          )}

          {/* DELIVERABLES SECTION (BARTER & CONTENT) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-black text-slate-900">Deliverable & Video Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1">Deliverable Video Type</label>
                <select
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Single Product Video">Single Product Video</option>
                  <option value="Instagram Reel (2 Reels)">Instagram Reel (2 Reels)</option>
                  <option value="Story Promotion">Story Promotion</option>
                  <option value="YouTube Integration">YouTube Integration</option>
                  <option value="Unboxing & Review">Unboxing & Review</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="X (Twitter)">X (Twitter)</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1">Product Link</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Content Post Link</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/p/..."
                  value={contentLink}
                  onChange={(e) => setContentLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1">Views Count</label>
                <input
                  type="number"
                  placeholder="0"
                  value={viewsCount}
                  onChange={(e) => setViewsCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 flex items-center justify-between">
                  <span>Orders Generated</span>
                  {Number(ordersCount) >= 100 && category === 'Paid' && (
                    <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      🌟 10% Bonus Qualified
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={ordersCount}
                  onChange={(e) => setOrdersCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  100+ orders on a paid collab unlocks an extra 10% bonus on this deal's margin.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-extrabold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-extrabold shadow-md"
            >
              {editingItem ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CREATE / EDIT TARGET */}
      <Modal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        title={editingTarget ? 'Edit Target Goal' : 'Set New AD2ship Target'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTarget} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-slate-700 mb-1">Target Category *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetFormData({ ...targetFormData, targetType: 'Paid', currency: '₹', targetMetric: 'Margin' })}
                className={`py-2 px-3 rounded-xl font-black transition ${
                  targetFormData.targetType === 'Paid' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                💼 Paid Revenue Target
              </button>
              <button
                type="button"
                onClick={() => setTargetFormData({ ...targetFormData, targetType: 'Barter', currency: 'Collabs', targetMetric: 'Count', targetAmount: '' })}
                className={`py-2 px-3 rounded-xl font-black transition ${
                  targetFormData.targetType === 'Barter' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                🎁 Barter Collabs Target
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Target Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. August 2026 Revenue Target"
              value={targetFormData.title}
              onChange={(e) => setTargetFormData({ ...targetFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">
                {targetFormData.targetType === 'Barter' ? 'Target Collab Count *' : 'Target Amount (₹) *'}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder={targetFormData.targetType === 'Barter' ? '120' : '500000'}
                value={targetFormData.targetAmount}
                onChange={(e) => setTargetFormData({ ...targetFormData, targetAmount: e.target.value, targetCount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-extrabold outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Target Period *</label>
              <input
                type="text"
                required
                placeholder="e.g. August 2026"
                value={targetFormData.period}
                onChange={(e) => setTargetFormData({ ...targetFormData, period: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {targetFormData.targetType === 'Paid' && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-purple-900">
                  ⚡ Auto-Calculate Team Target
                </p>
                <p className="text-[10px] text-purple-600 font-semibold">
                  {teamBreakdown?.teamSize || 6} Executives × ₹1,20,000 = ₹{new Intl.NumberFormat().format((teamBreakdown?.teamSize || 6) * 120000)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetFormData({
                  ...targetFormData,
                  targetAmount: String((teamBreakdown?.teamSize || 6) * 120000),
                  title: `${targetFormData.period || 'Monthly'} Team Revenue Target (${teamBreakdown?.teamSize || 6} Members)`,
                  description: `Auto-filled quota for ${teamBreakdown?.teamSize || 6} Social Media & Influencer Marketing Executives at ₹1.2L margin/member.`
                })}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-extrabold transition shadow-2xs"
              >
                Auto-Fill ₹{new Intl.NumberFormat().format((teamBreakdown?.teamSize || 6) * 120000)}
              </button>
            </div>
          )}

          {targetFormData.targetType === 'Barter' && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-purple-900">
                  ⚡ Auto-Calculate Barter Collab Goal
                </p>
                <p className="text-[10px] text-purple-600 font-semibold">
                  {teamBreakdown?.teamBarterTarget || 0} Total Collabs across {teamBreakdown?.teamSize || 6} Team Members' Brands (7B Running : 8B New)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetFormData({
                  ...targetFormData,
                  targetAmount: String(teamBreakdown?.teamBarterTarget || 0),
                  targetCount: String(teamBreakdown?.teamBarterTarget || 0),
                  title: `${targetFormData.period || 'Monthly'} Barter Collaborations Goal (${teamBreakdown?.teamBarterTarget || 0} Collabs)`,
                  description: `Auto-calculated barter volume quota across assigned brands (${teamBreakdown?.teamBarterTarget || 0} Collabs).`
                })}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-extrabold transition shadow-2xs"
              >
                Auto-Fill {teamBreakdown?.teamBarterTarget || 0} Collabs
              </button>
            </div>
          )}

          <div>
            <label className="block text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Notes on AD2ship monthly target..."
              value={targetFormData.description}
              onChange={(e) => setTargetFormData({ ...targetFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={targetFormData.autoSync}
                onChange={(e) => setTargetFormData({ ...targetFormData, autoSync: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span className="text-slate-800 font-extrabold">Auto-Sync from Database</span>
            </label>
            <p className="text-[10px] text-slate-500 font-medium">
              Automatically calculates achieved progress from actual transaction entries in MongoDB.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowTargetModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingTarget}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md"
            >
              {savingTarget ? 'Saving...' : 'Save Target Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: LOG MANUAL PAYMENT ENTRY */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Log Payment Audit Entry"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentLogSubmit} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-slate-700 mb-1">Transaction Type *</label>
            <select
              value={payLogType}
              onChange={(e: any) => setPayLogType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-extrabold outline-none"
            >
              <option value="IN">📥 Payments IN (From Client Brand)</option>
              <option value="OUT">📤 Payments OUT (To Creator / Influencer)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bunaiwala"
                value={payLogBrandName}
                onChange={(e) => setPayLogBrandName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Influencer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Singh"
                value={payLogInfluencerName}
                onChange={(e) => setPayLogInfluencerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="10000"
                value={payLogAmount}
                onChange={(e) => setPayLogAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={payLogDate}
                onChange={(e) => setPayLogDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1">Payment Mode</label>
              <select
                value={payLogMode}
                onChange={(e) => setPayLogMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Ref / UTR Number</label>
              <input
                type="text"
                placeholder="e.g. UTR987654"
                value={payLogRefNo}
                onChange={(e) => setPayLogRefNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Notes / Description</label>
            <input
              type="text"
              placeholder="Payment receipt details..."
              value={payLogNotes}
              onChange={(e) => setPayLogNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 btn-gradient-primary text-white rounded-xl font-black shadow-md"
            >
              Save Log Entry
            </button>
          </div>
        </form>
      </Modal>
      {/* MODAL 4: EXECUTIVE TARGET & INCENTIVE DETAIL MODAL */}
      <Modal
        isOpen={!!selectedMemberForDetail}
        onClose={() => setSelectedMemberForDetail(null)}
        title={selectedMemberForDetail ? `${selectedMemberForDetail.employee.name} — Quota & Incentive Ledger` : 'Executive Details'}
        maxWidth="max-w-4xl"
      >
        {selectedMemberForDetail && (
          <div className="space-y-4 text-xs">
            {/* Header Profile Ribbon */}
            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-emerald-50/70 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {selectedMemberForDetail.employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedMemberForDetail.employee.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-slate-600 font-bold text-[11px]">
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md text-[10px] font-black">{selectedMemberForDetail.employee.employeeId}</span>
                    <span>•</span>
                    <span>{selectedMemberForDetail.employee.designation || 'Influencer Marketing Executive'}</span>
                    <span>•</span>
                    <span className="text-purple-700 font-extrabold">{selectedMemberForDetail.assignedBrands?.length || selectedMemberForDetail.employee.assignedBrandsCount} Assigned Brands</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border shadow-2xs ${
                  selectedMemberForDetail.targetTier === '10%'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : selectedMemberForDetail.targetTier === '5%'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedMemberForDetail.targetTier === '10%' ? '🏆 10% Slab (1L+)' : selectedMemberForDetail.targetTier === '5%' ? '🥈 5% Slab (80k+)' : '0% Slab (<80k)'}
                </span>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-2 pb-1 font-extrabold text-xs">
              <button
                onClick={() => setDetailActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  detailActiveTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp size={14} /> Performance & Incentive Ledger
              </button>
              <button
                onClick={() => setDetailActiveTab('brands')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  detailActiveTab === 'brands'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag size={14} /> Assigned Brands ({selectedMemberForDetail.assignedBrands?.length || selectedMemberForDetail.employee.assignedBrandsCount})
              </button>
              <button
                onClick={() => setDetailActiveTab('deals')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  detailActiveTab === 'deals'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers size={14} /> Collab Deals ({selectedMemberForDetail.deals?.length || 0})
              </button>
            </div>

            {/* TAB 1: OVERVIEW & INCENTIVE BREAKDOWN */}
            {detailActiveTab === 'overview' && (
              <div className="space-y-4 pt-1">
                {/* Quota Progress Meter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700">Monthly Net Margin Quota Progress</span>
                    <span className="text-purple-700">
                      ₹{new Intl.NumberFormat().format(selectedMemberForDetail.netMargin)} / ₹{new Intl.NumberFormat().format(selectedMemberForDetail.individualTarget)} ({selectedMemberForDetail.targetAchievedPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedMemberForDetail.targetAchievedPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedMemberForDetail.targetAchievedPercent >= 100
                      ? '🎉 Congratulations! Full ₹1,20,000 quota achieved. Qualified for 10% Incentive Slab.'
                      : selectedMemberForDetail.netMargin >= 80000
                        ? '🥈 5% Incentive Slab unlocked (₹80k+ threshold crossed). ₹' + new Intl.NumberFormat().format(100000 - selectedMemberForDetail.netMargin) + ' needed for 10% Slab.'
                        : '⚡ ₹' + new Intl.NumberFormat().format(80000 - selectedMemberForDetail.netMargin) + ' more Net Margin needed to unlock the 5% Incentive Slab.'}
                  </p>
                </div>

                {/* Barter Quota Progress Meter */}
                {selectedMemberForDetail.individualBarterTarget !== undefined && selectedMemberForDetail.individualBarterTarget > 0 && (
                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-purple-900 flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-purple-600" />
                        Monthly Barter Collabs Goal ({selectedMemberForDetail.assignedBrands?.length || selectedMemberForDetail.employee.assignedBrandsCount} Brands)
                      </span>
                      <span className="text-purple-700">
                        {selectedMemberForDetail.barterCount} / {selectedMemberForDetail.individualBarterTarget} Collabs ({selectedMemberForDetail.barterAchievedPercent || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedMemberForDetail.barterAchievedPercent || 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-purple-700 font-medium">
                      Auto-calculated from assigned brands quota (7B per Running Brand : 8B per New Brand).
                    </p>
                  </div>
                )}

                {/* 4 Financial Highlight Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ad2ship Margin</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      ₹{new Intl.NumberFormat().format(selectedMemberForDetail.netMargin)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{selectedMemberForDetail.paidCount} Paid Collabs</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Incentive Slab</span>
                    <span className="text-base font-black text-purple-700 mt-0.5 block">
                      {selectedMemberForDetail.targetIncentivePercentage}% Payout
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {selectedMemberForDetail.netMargin >= 100000 ? '1L+ Threshold Met' : selectedMemberForDetail.netMargin >= 80000 ? '80k Threshold Met' : '< 80k Threshold'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Bonus</span>
                    <span className="text-base font-black text-slate-800 mt-0.5 block">
                      ₹{new Intl.NumberFormat().format(selectedMemberForDetail.targetIncentiveAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{selectedMemberForDetail.targetIncentivePercentage}% × Net Margin</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">100+ Orders Bonus</span>
                    <span className="text-base font-black text-amber-800 mt-0.5 block">
                      +₹{new Intl.NumberFormat().format(selectedMemberForDetail.orderBonusAmount)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">{selectedMemberForDetail.qualifyingBonusDealsCount} Viral Videos</span>
                  </div>
                </div>

                {/* Total Take-Home Incentive Banner */}
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 block">
                      Total Monthly Take-Home Incentive Payout
                    </span>
                    <span className="text-2xl font-black mt-0.5 block">
                      ₹{new Intl.NumberFormat().format(selectedMemberForDetail.totalTakeHomeIncentive)}
                    </span>
                    <p className="text-[10px] text-emerald-100 font-semibold mt-0.5">
                      = Target Slab Incentive (₹{new Intl.NumberFormat().format(selectedMemberForDetail.targetIncentiveAmount)}) + 100+ Orders Video Bonus (₹{new Intl.NumberFormat().format(selectedMemberForDetail.orderBonusAmount)})
                    </p>
                  </div>

                  <div className="text-right bg-white/20 px-3 py-2 rounded-xl backdrop-blur-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-100 block">Collabs Completed</span>
                    <span className="text-sm font-black text-white">
                      {selectedMemberForDetail.barterCount} Barter : {selectedMemberForDetail.paidCount} Paid
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ASSIGNED BRANDS */}
            {detailActiveTab === 'brands' && (
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700">
                    Brands Assigned to {selectedMemberForDetail.employee.name} ({selectedMemberForDetail.assignedBrands?.length || 0} Total)
                  </span>
                </div>

                {(!selectedMemberForDetail.assignedBrands || selectedMemberForDetail.assignedBrands.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-semibold">
                    No brand assignments found for this executive.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {selectedMemberForDetail.assignedBrands.map((b, idx) => (
                      <div key={b.id || idx} className="p-3 bg-white hover:bg-purple-50/40 rounded-xl border border-slate-200 shadow-2xs transition space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-slate-900 text-xs truncate">{b.name}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                            b.brandType === 'New'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {b.brandType === 'New' ? '✨ New' : '⚡ Running'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold flex justify-between pt-1 border-t border-slate-100">
                          <span>Target: <strong className="text-purple-700">{b.targetBarterCollabs}B : {b.targetPaidCollabs}P</strong></span>
                          <span className="text-slate-700 font-bold">{b.targetTotalCollabs} Total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DEALS & COLLABORATIONS */}
            {detailActiveTab === 'deals' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-700">
                    All Collaborations ({selectedMemberForDetail.deals?.length || 0})
                  </span>
                  <div className="relative w-56">
                    <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search influencer or brand..."
                      value={detailDealsSearch}
                      onChange={(e) => setDetailDealsSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {(!selectedMemberForDetail.deals || selectedMemberForDetail.deals.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-semibold">
                    No collaboration deals recorded for this executive.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-slate-200 font-bold text-[11px] sticky top-0">
                          <th className="p-2.5 border-b border-r border-slate-700">Brand</th>
                          <th className="p-2.5 border-b border-r border-slate-700">Influencer</th>
                          <th className="p-2.5 border-b border-r border-slate-700 text-center">Type</th>
                          <th className="p-2.5 border-b border-r border-slate-700 text-right">Brand (IN)</th>
                          <th className="p-2.5 border-b border-r border-slate-700 text-right">Creator (OUT)</th>
                          <th className="p-2.5 border-b border-r border-slate-700 text-right">Margin</th>
                          <th className="p-2.5 border-b border-slate-700 text-center">Orders & Bonus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800 text-[11px]">
                        {selectedMemberForDetail.deals
                          .filter(d => {
                            if (!detailDealsSearch) return true;
                            const q = detailDealsSearch.toLowerCase();
                            return (d.brandName && d.brandName.toLowerCase().includes(q)) || (d.influencerName && d.influencerName.toLowerCase().includes(q));
                          })
                          .map((d, idx) => (
                            <tr key={d.id || idx} className="hover:bg-purple-50/30 transition">
                              <td className="p-2.5 border-r border-slate-100 font-extrabold text-slate-900">{d.brandName}</td>
                              <td className="p-2.5 border-r border-slate-100 font-bold text-slate-700">{d.influencerName}</td>
                              <td className="p-2.5 border-r border-slate-100 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  d.category === 'Paid' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {d.category}
                                </span>
                              </td>
                              <td className="p-2.5 border-r border-slate-100 text-right font-semibold">
                                {d.category === 'Paid' ? `₹${new Intl.NumberFormat().format(d.brandOnboardingAmt)}` : '-'}
                              </td>
                              <td className="p-2.5 border-r border-slate-100 text-right font-semibold text-rose-600">
                                {d.category === 'Paid' ? `₹${new Intl.NumberFormat().format(d.influencerOnboardingAmt)}` : '-'}
                              </td>
                              <td className="p-2.5 border-r border-slate-100 text-right font-black text-emerald-600">
                                {d.category === 'Paid' ? `₹${new Intl.NumberFormat().format(d.ad2shipMargin)}` : '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                {d.ordersGenerated >= 100 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                    🌟 {d.ordersGenerated} (+₹{new Intl.NumberFormat().format(Math.round(d.ad2shipMargin * 0.10))})
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold">{d.ordersGenerated || 0} orders</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Modal Close Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberForDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
