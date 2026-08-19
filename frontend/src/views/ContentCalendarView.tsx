import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Plus, Search, Filter, Link2, Video, CheckCircle2, Clock, Trash2, Edit2, ExternalLink, ChevronDown, User, FileSpreadsheet, Eye, Grid, List, Share2, Copy, Check, MessageSquare, Mail, Send, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ContentCalendarItem, Brand, Employee } from '../types';
import { Modal } from '../components/Modal';

// Custom Searchable Brand Dropdown with Search Bar
const SearchableBrandDropdown: React.FC<{
  brands: string[];
  selectedBrand: string;
  onSelect: (brand: string) => void;
}> = ({ brands, selectedBrand, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands.filter(b =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center space-x-1.5 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
        <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider shrink-0">Brand:</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border border-purple-300 text-purple-950 text-xs font-black rounded-lg px-3 py-1.5 focus:outline-none hover:bg-purple-100 transition flex items-center justify-between gap-2 min-w-[150px] shadow-2xs cursor-pointer"
        >
          <span className="truncate">🏢 {selectedBrand || 'Select Brand'}</span>
          <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1.5 w-64 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-purple-100 bg-purple-50/50">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-purple-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand..."
                className="w-full bg-white border border-purple-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Scrollable Brands List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-purple-50/50">
            {filteredBrands.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                No brand found
              </div>
            ) : (
              filteredBrands.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onSelect(b);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-extrabold flex items-center justify-between transition ${
                    selectedBrand === b
                      ? 'bg-purple-600 text-white font-black'
                      : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
                  }`}
                >
                  <span className="truncate">🏢 {b}</span>
                  {selectedBrand === b && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ContentCalendarViewProps {
  currentUser?: any;
}

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({ currentUser }) => {
  const isEmployeeRole = currentUser?.role === 'Employee';
  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('Kala Kurti');
  const [selectedDesignerFilter, setSelectedDesignerFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedFortnight, setSelectedFortnight] = useState<string>('All');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // August (1-indexed)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'Spreadsheet Grid' | 'List View'>('Spreadsheet Grid');

  // Clear All Modal State
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearingLoading, setClearingLoading] = useState(false);

  // Create New Calendar Modal State
  const [showCreateNewCalendarModal, setShowCreateNewCalendarModal] = useState(false);
  const [newCalBrandId, setNewCalBrandId] = useState('');
  const [newCalBrandName, setNewCalBrandName] = useState('');
  const [newCalMonth, setNewCalMonth] = useState(8);
  const [newCalYear, setNewCalYear] = useState(2026);
  const [newCalFortnight, setNewCalFortnight] = useState('1st-15th');
  const [newCalTypeOfPost, setNewCalTypeOfPost] = useState('Intro Post');
  const [newCalPlatform, setNewCalPlatform] = useState('Instagram');
  const [newCalDesignerId, setNewCalDesignerId] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentCalendarItem | null>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);

  const handleShareCalendar = async () => {
    if (!selectedBrandFilter) {
      alert('Please select a brand to share');
      return;
    }
    setSharingLoading(true);
    try {
      const res = await api.post('/content-calendar/share', {
        brandName: selectedBrandFilter,
        year: currentYear,
        month: currentMonth
      });
      if (res.success && res.token) {
        const fullUrl = `${window.location.origin}/#/share/${res.token}`;
        setShareUrl(fullUrl);
        setShowShareModal(true);
        setCopied(false);
      } else {
        alert(res.message || 'Failed to generate share link');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate share link');
    } finally {
      setSharingLoading(false);
    }
  };

  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const msg = `Hello! 📜 Here is the Content Calendar for *${selectedBrandFilter}* (${monthName} ${currentYear}):\n\n${shareUrl}\n\nPlease review and let us know if you have any feedback or changes!`;
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const whatsappUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const subject = `Content Calendar - ${selectedBrandFilter} (${monthName} ${currentYear})`;
    const body = `Hi,\n\nPlease find the Content Calendar for ${selectedBrandFilter} (${monthName} ${currentYear}) at the link below:\n\n${shareUrl}\n\nFeel free to review and reach out if you have any questions.\n\nBest regards,\nInfluencer Marketing Team`;
    const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleShareGmail = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[currentMonth - 1] || currentMonth;
    const subject = `Content Calendar - ${selectedBrandFilter} (${monthName} ${currentYear})`;
    const body = `Hi,\n\nPlease find the Content Calendar for ${selectedBrandFilter} (${monthName} ${currentYear}) at the link below:\n\n${shareUrl}\n\nFeel free to review and reach out if you have any questions.\n\nBest regards,\nInfluencer Marketing Team`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Form Fields
  const [brandName, setBrandName] = useState('Kala Kurti');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeOfPost, setTypeOfPost] = useState('Intro Post');
  const [platform, setPlatform] = useState('Instagram');
  const [referenceLink, setReferenceLink] = useState('');
  const [mediaLink, setMediaLink] = useState('');
  const [assignedDesignerName, setAssignedDesignerName] = useState('');
  const [assignedDesignerId, setSelectedDesignerId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Pending' | 'Approved' | 'Published'>('Pending');
  const [notes, setNotes] = useState('');

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.success && res.data.length > 0) {
        setBrands(res.data);
        const bNames = res.data.map((b: any) => b.brandName);
        setSelectedBrandFilter(prev => {
          if (prev && bNames.includes(prev)) return prev;
          return bNames[0];
        });
      } else {
        setBrands([]);
        setSelectedBrandFilter('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.success) setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarEntries = async () => {
    if (!selectedBrandFilter) return;
    setLoading(true);
    try {
      let url = `/content-calendar?year=${currentYear}&month=${currentMonth}&brandName=${encodeURIComponent(selectedBrandFilter)}`;
      if (selectedFortnight !== 'All') url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;
      if (selectedDesignerFilter !== 'All') url += `&designer=${encodeURIComponent(selectedDesignerFilter)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch content calendar', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllCalendar = async () => {
    setClearingLoading(true);
    try {
      let url = `/content-calendar/clear-all?brandName=${encodeURIComponent(selectedBrandFilter)}&year=${currentYear}&month=${currentMonth}`;
      if (selectedFortnight !== 'All') url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;

      const res = await api.delete(url);
      if (res.success) {
        setShowClearAllModal(false);
        fetchCalendarEntries();
      } else {
        alert(res.message || 'Failed to clear calendar');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to clear calendar');
    } finally {
      setClearingLoading(false);
    }
  };

  const [newCalFrequency, setNewCalFrequency] = useState<'Daily' | 'Alternate' | 'Single'>('Daily');

  const openCreateNewCalendarModal = () => {
    const defaultB = selectedBrandFilter || uniqueBrands[0] || 'Zudio';
    const defaultP = uniqueDesigners[0] || employees[0]?.name || 'Riya Roy';

    const matchedB = brands.find(b => b.brandName === defaultB);
    setNewCalBrandId(matchedB ? matchedB._id : '');
    setNewCalBrandName(defaultB);

    const matchedEmp = employees.find(e => e.name === defaultP);
    setNewCalDesignerId(matchedEmp ? matchedEmp._id : '');

    setNewCalMonth(currentMonth);
    setNewCalYear(currentYear);
    setNewCalFortnight('1st-15th');
    setNewCalFrequency('Daily');
    setNewCalTypeOfPost('Intro Post');
    setNewCalPlatform('Instagram');
    setShowCreateNewCalendarModal(true);
  };

  const handleCreateNewCalendarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bObj = brands.find(b => b.brandName === newCalBrandName || b._id === newCalBrandId);
      const finalBName = newCalBrandName || (bObj ? bObj.brandName : selectedBrandFilter);

      const empObj = employees.find(e => e.name === assignedDesignerName || e._id === newCalDesignerId);
      const finalDesignerName = empObj ? empObj.name : (assignedDesignerName || uniqueDesigners[0] || '');

      const payload = {
        brandId: bObj ? bObj._id : undefined,
        brandName: finalBName,
        year: newCalYear,
        month: newCalMonth,
        fortnight: newCalFortnight,
        frequency: newCalFrequency,
        platform: newCalPlatform,
        assignedDesignerId: empObj ? empObj._id : undefined,
        assignedDesignerName: finalDesignerName,
        defaultPostType: newCalTypeOfPost
      };

      const res = await api.post('/content-calendar/create-cycle', payload);
      if (res.success) {
        setShowCreateNewCalendarModal(false);
        // Switch workspace filters to match newly created calendar & show entries immediately
        setSelectedBrandFilter(finalBName);
        setCurrentMonth(newCalMonth);
        setCurrentYear(newCalYear);
        setSelectedFortnight(newCalFortnight);
        setSelectedDesignerFilter('All');
      } else {
        alert(res.message || 'Failed to create new calendar');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create new calendar');
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchEmployees();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadEntries = async () => {
      if (!selectedBrandFilter) return;
      setLoading(true);
      try {
        let url = `/content-calendar?year=${currentYear}&month=${currentMonth}&brandName=${encodeURIComponent(selectedBrandFilter)}`;
        if (selectedFortnight !== 'All') url += `&fortnight=${encodeURIComponent(selectedFortnight)}`;
        if (selectedDesignerFilter !== 'All') url += `&designer=${encodeURIComponent(selectedDesignerFilter)}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

        const res = await api.get(url);
        if (!isCancelled && res.success) {
          setItems(res.data);
        }
      } catch (err) {
        if (!isCancelled) console.error('Failed to fetch content calendar', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadEntries();

    return () => {
      isCancelled = true;
    };
  }, [selectedBrandFilter, selectedDesignerFilter, selectedFortnight, currentYear, currentMonth, searchTerm]);

  const openAddModal = (dateStr?: string) => {
    setEditingItem(null);
    setBrandName(selectedBrandFilter || 'Kala Kurti');
    const matchedB = brands.find(b => b.brandName === selectedBrandFilter);
    setSelectedBrandId(matchedB ? matchedB._id : '');
    setPostDate(dateStr || new Date().toISOString().split('T')[0]);
    setTypeOfPost('Intro Post');
    setPlatform('Instagram');
    setReferenceLink('');
    setMediaLink('');
    setAssignedDesignerName('');
    setSelectedDesignerId('');
    setStatus('Pending');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: ContentCalendarItem) => {
    setEditingItem(item);
    setBrandName(item.brandName);
    setSelectedBrandId(typeof item.brandId === 'object' ? item.brandId?._id : item.brandId || '');
    setPostDate(item.postDate ? item.postDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setTypeOfPost(item.typeOfPost);
    setPlatform(item.platform || 'Instagram');
    setReferenceLink(item.referenceLink || '');
    setMediaLink(item.mediaLink || '');
    setAssignedDesignerName(item.assignedDesignerName || '');
    setSelectedDesignerId(typeof item.assignedDesignerId === 'object' ? item.assignedDesignerId?._id : item.assignedDesignerId || '');
    setStatus(item.status);
    setNotes(item.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPlan(true);
    try {
      const bObj = brands.find(b => b._id === selectedBrandId);
      const finalBName = bObj ? bObj.brandName : (brandName || selectedBrandFilter);

      const empObj = employees.find(e => e._id === assignedDesignerId);
      const finalDesignerName = empObj ? empObj.name : assignedDesignerName;

      const payload = {
        brandId: selectedBrandId || undefined,
        brandName: finalBName,
        postDate,
        typeOfPost,
        platform,
        referenceLink,
        mediaLink,
        assignedDesignerId: assignedDesignerId || undefined,
        assignedDesignerName: finalDesignerName,
        status,
        notes
      };

      let res;
      if (editingItem) {
        res = await api.put(`/content-calendar/${editingItem._id}`, payload);
      } else {
        res = await api.post('/content-calendar', payload);
      }

      if (res.success) {
        setShowModal(false);
        setEditingItem(null);
        fetchCalendarEntries();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save entry');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this calendar entry?')) return;
    try {
      const res = await api.delete(`/content-calendar/${id}`);
      if (res.success) {
        fetchCalendarEntries();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  const handleInlineStatusChange = async (id: string, newStatus: any) => {
    setItems(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
    try {
      await api.put(`/content-calendar/${id}`, { status: newStatus });
    } catch (err) {
      console.error(err);
      fetchCalendarEntries();
    }
  };

  // Filter items for status filter
  const filteredItems = items.filter(item => {
    if (selectedStatusFilter !== 'All' && item.status !== selectedStatusFilter) return false;
    return true;
  });

  // Unique brand list (from assigned brands API response)
  const uniqueBrands = Array.from(new Set([
    ...brands.map(b => b.brandName),
    ...(items.map(i => i.brandName))
  ].filter(Boolean))).sort();

  const uniqueDesigners = Array.from(new Set([...employees.map(e => e.name), ...items.map(i => i.assignedDesignerName).filter(Boolean)]));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header with Integrated Brand Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Content Calendar</h2>

              {/* Searchable Brand Selection Dropdown with Search Bar */}
              <SearchableBrandDropdown
                brands={uniqueBrands}
                selectedBrand={selectedBrandFilter}
                onSelect={(b) => setSelectedBrandFilter(b)}
              />
            </div>

            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Dedicated day-wise social media content planning, reference links, POC assignments, and media assets for <strong className="text-purple-700 font-extrabold">{selectedBrandFilter}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Create New Calendar Cycle Button */}
          <button
            onClick={openCreateNewCalendarModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            title="Create a new 15-day / monthly content calendar cycle"
          >
            <CalendarIcon size={16} />
            <span>+ Create New Calendar</span>
          </button>

          {/* Share Calendar Button */}
          <button
            onClick={handleShareCalendar}
            disabled={sharingLoading}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-xs transition hover:shadow-md cursor-pointer disabled:opacity-50"
            title="Share this content calendar with client"
          >
            <Share2 size={16} className="text-purple-600" />
            <span>{sharingLoading ? 'Sharing...' : 'Share Calendar'}</span>
          </button>

          {/* Add Post Button */}
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Post</span>
          </button>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Mode */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('Spreadsheet Grid')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'Spreadsheet Grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Grid size={14} /> Spreadsheet Grid
          </button>
          <button
            onClick={() => setViewMode('List View')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${viewMode === 'List View' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <List size={14} /> List Table
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value={7}>July 2026</option>
            <option value={8}>August 2026</option>
            <option value={9}>September 2026</option>
            <option value={10}>October 2026</option>
          </select>

          {/* 15-Day Fortnight Cycle Selector */}
          <select
            value={selectedFortnight}
            onChange={(e) => setSelectedFortnight(e.target.value)}
            className="bg-purple-50 border border-purple-200 text-purple-950 text-xs font-extrabold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
          >
            <option value="All">📅 Full Month Calendar</option>
            <option value="1st-15th">🗓️ 1st – 15th Cycle (1st Fortnight)</option>
            <option value="16th-End">🗓️ 16th – End Cycle (2nd Fortnight)</option>
          </select>

          {/* POC Filter */}
          <select
            value={selectedDesignerFilter}
            onChange={(e) => setSelectedDesignerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="All">👤 All POCs</option>
            {uniqueDesigners.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Delete All Calendar Entries Button */}
          <button
            onClick={() => setShowClearAllModal(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer"
            title="Delete all calendar entries for this brand & period at once"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>Clear Calendar</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET GRID VIEW (Matching exact Google Sheet layout from screenshot) */}
      {viewMode === 'Spreadsheet Grid' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-medium">Loading content calendar grid...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-semibold">
              No content entries for this month. Click "+ Add Content Entry" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {/* Row 1: Day Header (Pink/Purple header matching screenshot) */}
                  <tr className="bg-pink-200/90 text-slate-900 font-black text-sm">
                    <td className="p-3 bg-pink-300 border-b border-r border-pink-300 font-extrabold w-40 sticky left-0 z-10 text-slate-900">
                      Day
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-pink-300 min-w-[170px] font-black text-pink-950">
                        {item.dayOfWeek || new Date(item.postDate).toLocaleDateString('en-US', { weekday: 'long' })}
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Date */}
                  <tr className="bg-pink-100/70 text-slate-900 font-extrabold">
                    <td className="p-3 bg-pink-200 border-b border-r border-pink-300 font-bold sticky left-0 z-10 text-slate-800">
                      Date
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-pink-200 font-extrabold text-slate-900 font-mono">
                        {new Date(item.postDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Type of Post */}
                  <tr className="bg-white">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Type of Post
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200 font-bold text-purple-700 bg-purple-50/20">
                        {item.typeOfPost}
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Platform */}
                  <tr className="bg-slate-50/50">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Platform
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200 font-extrabold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px]">
                          {item.platform || 'Instagram'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Reference Link (Clickable Instagram Link matching screenshot) */}
                  <tr className="bg-white">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Reference Link
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        {item.referenceLink ? (
                          <a
                            href={item.referenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-medium text-[11px] break-all line-clamp-3 block bg-blue-50/50 p-2 rounded-lg border border-blue-100"
                            title={item.referenceLink}
                          >
                            {item.referenceLink}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 6: Video/Image Link */}
                  <tr className="bg-slate-50/50">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Video/Image Link
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        {item.mediaLink ? (
                          <a
                            href={item.mediaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline font-bold flex items-center justify-center gap-1 bg-purple-50 p-1.5 rounded-lg"
                          >
                            <Video size={12} /> Media Link
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 7: Assigned POC */}
                  <tr className="bg-white">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Assigned POC
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200 font-bold text-slate-800">
                        {item.assignedDesignerName ? (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs inline-flex items-center gap-1 border border-slate-200">
                            <User size={12} className="text-purple-600" /> {item.assignedDesignerName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 8: Status & Actions */}
                  <tr className="bg-slate-100/50">
                    <td className="p-3 bg-pink-200/80 border-b border-r border-slate-200 font-black text-slate-800 sticky left-0 z-10">
                      Status & Edit
                    </td>
                    {filteredItems.map((item) => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative inline-flex items-center">
                            <select
                              value={item.status}
                              onChange={(e) => handleInlineStatusChange(item._id, e.target.value)}
                              className={`appearance-none pr-6 pl-3 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-xs hover:shadow-md hover:scale-105 transition-all ${
                                item.status === 'Published'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                  : item.status === 'Approved'
                                  ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                                  : item.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-900 border-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Published">Published</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2 pointer-events-none text-slate-700 font-black" />
                          </div>

                          <div className="flex items-center space-x-1">
                            <button onClick={() => openEditModal(item)} className="p-1 hover:bg-purple-100 text-purple-600 rounded" title="Edit entry">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-1 hover:bg-rose-100 text-rose-600 rounded" title="Delete entry">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-white font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-3 border-b border-r border-slate-700 min-w-[100px]">Date</th>
                  <th className="p-3 border-b border-r border-slate-700 min-w-[90px]">Day</th>
                  <th className="p-4 border-b border-r border-slate-700 min-w-[120px]">Brand</th>
                  <th className="p-4 border-b border-r border-slate-700 min-w-[150px]">Type of Post</th>
                  <th className="p-3 border-b border-r border-slate-700 min-w-[100px]">Platform</th>
                  <th className="p-4 border-b border-r border-slate-700 min-w-[180px]">Reference Link</th>
                  <th className="p-3 border-b border-r border-slate-700 min-w-[120px]">POC</th>
                  <th className="p-3 border-b border-r border-slate-700 min-w-[110px]">Status</th>
                  <th className="p-3 border-b border-slate-700 text-right min-w-[70px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-semibold">
                      No content calendar entries found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-pink-50/30 transition">
                      <td className="p-3 font-mono font-bold text-slate-800 border-r border-slate-200">
                        {new Date(item.postDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 font-bold text-slate-600 border-r border-slate-200">
                        {item.dayOfWeek}
                      </td>
                      <td className="p-4 font-black text-pink-700 border-r border-slate-200">
                        {item.brandName}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 border-r border-slate-200">
                        {item.typeOfPost}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-700">
                        {item.platform || 'Instagram'}
                      </td>
                      <td className="p-4 border-r border-slate-200">
                        {item.referenceLink ? (
                          <a href={item.referenceLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold flex items-center gap-1 truncate max-w-[160px]">
                            <Link2 size={12} /> Reference
                          </a>
                        ) : '—'}
                      </td>
                      <td className="p-3 font-bold text-slate-800 border-r border-slate-200">
                        {item.assignedDesignerName || '—'}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <div className="relative inline-flex items-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleInlineStatusChange(item._id, e.target.value)}
                            className={`appearance-none pr-6 pl-3 py-1 rounded-xl text-[11px] font-extrabold focus:outline-none cursor-pointer border shadow-xs hover:shadow-md hover:scale-105 transition-all ${
                              item.status === 'Published'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                : item.status === 'Approved'
                                ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                                : item.status === 'Pending'
                                ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-900 border-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Published">Published</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 pointer-events-none text-slate-700 font-black" />
                        </div>
                      </td>
                      <td className="p-3 text-right space-x-1">
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
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Content Entry */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Content Entry' : 'Add New Content Calendar Entry'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-200 space-y-3">
            <h4 className="font-extrabold text-pink-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileSpreadsheet size={14} /> Content Calendar Entry Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Brand</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => {
                    setSelectedBrandId(e.target.value);
                    const b = brands.find(brand => brand._id === e.target.value);
                    if (b) setBrandName(b.brandName);
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map(b => (
                    <option key={b._id} value={b._id}>{b.brandName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Post Date</label>
                <input
                  type="date"
                  required
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Type of Post</label>
                <input
                  type="text"
                  required
                  value={typeOfPost}
                  onChange={(e) => setTypeOfPost(e.target.value)}
                  placeholder="e.g. Intro Post, Founders video, BTS..."
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Reference Link (Instagram URL)</label>
              <input
                type="url"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Video / Image Asset Link</label>
              <input
                type="url"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Assigned POC (Member)</label>
                <select
                  value={assignedDesignerId}
                  onChange={(e) => {
                    setSelectedDesignerId(e.target.value);
                    const emp = employees.find(employee => employee._id === e.target.value);
                    if (emp) setAssignedDesignerName(emp.name);
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select POC --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation || 'POC'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-extrabold uppercase mb-1">Notes / Caption</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter caption ideas, tags, or notes..."
                className="w-full bg-white border border-slate-200 focus:border-pink-500 rounded-xl p-2.5 font-medium resize-none"
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
              disabled={submittingPlan}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingPlan ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{editingItem ? 'Saving...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{editingItem ? 'Update Entry' : 'Save Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Calendar Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Content Calendar with Client"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-xs font-medium text-slate-700">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
              <Share2 size={18} className="text-purple-600" />
              <span>Public Client Link Generated!</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Anyone with this link can view a clean, read-only version of the <strong className="text-purple-800 font-extrabold">{selectedBrandFilter}</strong> content calendar for month ({currentMonth}/{currentYear}). No login required!
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-800 font-extrabold text-xs uppercase">Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shrink-0 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Instant Channels: WhatsApp & Email */}
          <div className="space-y-3 pt-2">
            <label className="block text-slate-800 font-extrabold text-xs uppercase">Direct Share Channels</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl font-bold flex items-center justify-start gap-3 transition shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                  <MessageSquare size={17} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-emerald-950">Share via WhatsApp</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Send link & message</p>
                </div>
              </button>

              {/* Gmail / Web Mail Button */}
              <button
                onClick={handleShareGmail}
                className="p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-950 rounded-2xl font-bold flex items-center justify-start gap-3 transition shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                  <Mail size={17} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-rose-950">Share via Email</p>
                  <p className="text-[10px] text-rose-700 font-semibold">Open Gmail composer</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-purple-700 hover:text-purple-900 font-extrabold text-xs flex items-center gap-1 hover:underline"
            >
              <ExternalLink size={13} /> Test Client View in New Tab
            </a>

            <button
              onClick={() => setShowShareModal(false)}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Bulk Delete / Clear All Calendar Entries */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear Entire Content Calendar"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs font-medium text-slate-700">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2 text-rose-950">
            <div className="flex items-center gap-2 font-black text-sm text-rose-800">
              <Trash2 size={18} className="text-rose-600 shrink-0" />
              <span>Are you sure you want to clear this calendar?</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-semibold">
              This will permanently delete all content calendar entries for <strong className="font-extrabold text-rose-950">{selectedBrandFilter}</strong> ({selectedFortnight === 'All' ? 'Full Month' : selectedFortnight === '1st-15th' ? '1st – 15th Cycle' : '16th – End Cycle'}, Month {currentMonth}/{currentYear}).
            </p>
            <p className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">⚠️ Action cannot be undone!</p>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowClearAllModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearAllCalendar}
              disabled={clearingLoading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Trash2 size={14} />
              <span>{clearingLoading ? 'Deleting Entries...' : 'Yes, Delete All Entries'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create New Content Calendar Cycle */}
      <Modal
        isOpen={showCreateNewCalendarModal}
        onClose={() => setShowCreateNewCalendarModal(false)}
        title="Create New Content Calendar Cycle"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateNewCalendarSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 rounded-2xl border border-purple-200 space-y-3">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm">
              <Sparkles size={18} className="text-purple-600" />
              <span>New Calendar Cycle Setup</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Create a new 15-day or monthly content calendar for a brand. Selecting a cycle will automatically set up the workspace for that period.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Target Brand</label>
                <select
                  value={newCalBrandName}
                  onChange={(e) => {
                    setNewCalBrandName(e.target.value);
                    const b = brands.find(brand => brand.brandName === e.target.value);
                    if (b) setNewCalBrandId(b._id);
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  {uniqueBrands.map(bName => (
                    <option key={bName} value={bName}>{bName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">15-Day Cycle Period</label>
                <select
                  value={newCalFortnight}
                  onChange={(e) => setNewCalFortnight(e.target.value)}
                  className="w-full bg-white border border-purple-300 focus:border-purple-500 rounded-xl px-3 py-2 font-bold text-purple-950"
                >
                  <option value="1st-15th">🗓️ 1st – 15th Cycle (Days 1 to 15)</option>
                  <option value="16th-End">🗓️ 16th – End Cycle (Days 16 to End)</option>
                  <option value="All">📅 Full Month Cycle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Target Month</label>
                <select
                  value={newCalMonth}
                  onChange={(e) => setNewCalMonth(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value={7}>July 2026</option>
                  <option value={8}>August 2026</option>
                  <option value={9}>September 2026</option>
                  <option value={10}>October 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Assigned POC</label>
                <select
                  value={assignedDesignerName || uniqueDesigners[0] || ''}
                  onChange={(e) => {
                    setAssignedDesignerName(e.target.value);
                    const emp = employees.find(empItem => empItem.name === e.target.value);
                    if (emp) setNewCalDesignerId(emp._id);
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  {uniqueDesigners.map(dName => (
                    <option key={dName} value={dName}>{dName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Posting Frequency</label>
                <select
                  value={newCalFrequency}
                  onChange={(e) => setNewCalFrequency(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Daily">⚡ Daily Postings (All 15 Days)</option>
                  <option value="Alternate">🗓️ Alternate Days (7-8 Posts)</option>
                  <option value="Single">📌 Single Starter Post</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold uppercase mb-1">Platform</label>
                <select
                  value={newCalPlatform}
                  onChange={(e) => setNewCalPlatform(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateNewCalendarModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Plus size={15} />
              <span>Create Calendar Cycle</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
