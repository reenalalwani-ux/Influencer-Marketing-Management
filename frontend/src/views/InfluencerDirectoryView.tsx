import React, { useEffect, useState } from 'react';
import {
  Users, Search, Filter, Plus, ExternalLink, Instagram, Phone, Mail,
  Star, Award, TrendingUp, Sparkles, CheckCircle2, Bookmark, Check,
  Trash2, Edit2, ShieldCheck, MapPin, MessageSquare, Layers, Eye, RefreshCw,
  Heart, MessageCircle, BarChart2, Globe, SlidersHorizontal, UserCheck, AlertCircle, Grid, Table as TableIcon
} from 'lucide-react';
import { api } from '../services/api';
import { InfluencerDirectoryItem, DiscoveredInfluencer } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';

interface InfluencerDirectoryViewProps {
  userRole?: string;
  currentUser?: any;
}

const CATEGORIES = [
  { id: 'All', label: 'All Categories', icon: '🌟' },
  { id: 'Fashion', label: 'Fashion & Styling', icon: '👗' },
  { id: 'Beauty', label: 'Beauty & Skincare', icon: '💄' },
  { id: 'Tech', label: 'Tech & Gadgets', icon: '📱' },
  { id: 'Fitness', label: 'Fitness & Health', icon: '🏋️' },
  { id: 'Food', label: 'Food & Dining', icon: '🍕' },
  { id: 'Travel', label: 'Travel & Lifestyle', icon: '✈️' },
  { id: 'Gaming', label: 'Gaming & Esports', icon: '🎮' },
  { id: 'Entertainment', label: 'Entertainment & Comedy', icon: '🎬' }
];

export const InfluencerDirectoryView: React.FC<InfluencerDirectoryViewProps> = ({ userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'discover'>('directory');
  
  // Database Directory State & Pagination
  const [directoryItems, setDirectoryItems] = useState<InfluencerDirectoryItem[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [followerTier, setFollowerTier] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  // Discovery State
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredInfluencer[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [discoveryCategory, setDiscoveryCategory] = useState('Fashion');
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryMinFollowers, setDiscoveryMinFollowers] = useState<number>(0);
  const [discoveryMaxFollowers, setDiscoveryMaxFollowers] = useState<number>(10000000);
  const [discoveryMinEngagement, setDiscoveryMinEngagement] = useState<number>(0);
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [discoveryTotalPages, setDiscoveryTotalPages] = useState(1);
  const [discoveryTotalItems, setDiscoveryTotalItems] = useState(0);
  const [savingHandle, setSavingHandle] = useState<string | null>(null);
  const [syncingLiveStats, setSyncingLiveStats] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfluencerDirectoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InfluencerDirectoryItem>>({
    instagramHandle: '',
    name: '',
    avatar: '',
    category: 'Fashion',
    followersCount: 10000,
    engagementRate: 4.0,
    phone: '',
    email: '',
    location: 'India',
    profileLink: '',
    status: 'Available',
    rating: 5,
    notes: '',
    bio: ''
  });

  // Success / Error Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Saved Database Directory (Fast & Paginated)
  const fetchDirectory = async (page: number = currentPage, forceSync: boolean = false) => {
    setLoadingDirectory(true);
    try {
      let url = `/influencer-directory?page=${page}&limit=${pageSize}&category=${encodeURIComponent(selectedCategory)}&status=${encodeURIComponent(selectedStatus)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (forceSync) url += `&forceSync=true`;

      if (followerTier === 'micro') {
        url += `&minFollowers=10000&maxFollowers=50000`;
      } else if (followerTier === 'mid') {
        url += `&minFollowers=50000&maxFollowers=500000`;
      } else if (followerTier === 'macro') {
        url += `&minFollowers=500000`;
      }

      const res = await api.get(url);
      if (res.success) {
        setDirectoryItems(res.items || []);
        if (res.pagination) {
          setTotalItems(res.pagination.total || (res.items || []).length);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(res.pagination.page || page);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch directory:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  // Run Discovery API Search
  const handleDiscoverSearch = async (overrideCategory?: string, pageNum: number = 1) => {
    setLoadingDiscovery(true);
    try {
      const cat = overrideCategory || discoveryCategory;
      const res = await api.post('/influencer-directory/discover', {
        category: cat,
        query: discoveryQuery,
        minFollowers: discoveryMinFollowers,
        maxFollowers: discoveryMaxFollowers,
        minEngagement: discoveryMinEngagement,
        page: pageNum,
        pageSize: 12
      });
      if (res.success) {
        setDiscoveredItems(res.influencers || []);
        if (res.pagination) {
          setDiscoveryPage(res.pagination.page || pageNum);
          setDiscoveryTotalPages(res.pagination.totalPages || 1);
          setDiscoveryTotalItems(res.pagination.totalItems || (res.influencers || []).length);
        } else {
          setDiscoveryPage(pageNum);
          setDiscoveryTotalPages(1);
          setDiscoveryTotalItems((res.influencers || []).length);
        }
        if ((res.influencers || []).length > 0) {
          showToast(`✨ Found ${res.pagination?.totalItems || (res.influencers || []).length} database creators!`);
        }
      } else {
        showToast(`⚠️ ${res.message || 'Discovery search failed'}`);
      }
    } catch (err: any) {
      console.error('Discovery search error:', err);
      showToast(`⚠️ ${err.message || 'Discovery search failed. Please try refreshing.'}`);
    } finally {
      setLoadingDiscovery(false);
    }
  };

  // Sync Live Instagram Stats via Python IG Scraper for all creators
  const handleSyncLiveInstagramStats = async () => {
    setSyncingLiveStats(true);
    try {
      const res = await api.post('/influencer-directory/sync-live-instagram', {});
      if (res.success) {
        showToast(`✅ ${res.message || 'Synced via Instagram API!'}`);
        fetchDirectory(currentPage, true);
      } else {
        showToast(`⚠️ ${res.message || 'Sync failed'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Failed to sync via Instagram API'}`);
    } finally {
      setSyncingLiveStats(false);
    }
  };

  // Reset old fake follower data from DB so Instagram API can write real values
  const handleResetOldData = async () => {
    if (!window.confirm('This will clear all fake follower counts from the database so live Instagram API can sync real data. Continue?')) return;
    try {
      const res = await api.post('/influencer-directory/reset-old-data', {});
      if (res.success) {
        showToast(`🗑️ ${res.message}`);
        fetchDirectory(currentPage, true);
      }
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Reset failed'}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      setCurrentPage(1);
      fetchDirectory(1);
    } else {
      setDiscoveredItems([]);
    }
  }, [activeTab, selectedCategory, selectedStatus, followerTier]);

  // Handle Save Discovered Influencer to DB
  const handleSaveDiscoveredToDb = async (influencer: DiscoveredInfluencer) => {
    setSavingHandle(influencer.instagramHandle);
    try {
      const res = await api.post('/influencer-directory', {
        instagramHandle: influencer.instagramHandle,
        name: influencer.name,
        avatar: influencer.avatar,
        category: influencer.category,
        nicheTags: influencer.nicheTags,
        followersCount: influencer.followersCount,
        followingCount: influencer.followingCount,
        postsCount: influencer.postsCount,
        engagementRate: influencer.engagementRate,
        avgLikes: influencer.avgLikes,
        avgComments: influencer.avgComments,
        bio: influencer.bio,
        location: influencer.location,
        email: influencer.email,
        phone: influencer.phone,
        profileLink: influencer.profileLink,
        isVerified: influencer.isVerified,
        status: 'Available',
        source: 'API Discovery'
      });

      if (res.success) {
        showToast(`Saved @${influencer.instagramHandle.replace('@', '')} to Database Directory!`);
        // Update local state flag
        setDiscoveredItems(prev => prev.map(item => {
          if (item.instagramHandle === influencer.instagramHandle) {
            return { ...item, isSavedInDb: true, dbId: res.influencer?._id };
          }
          return item;
        }));
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Could not save influencer'}`);
    } finally {
      setSavingHandle(null);
    }
  };

  // Save / Update Form Submission for Saved Directory Modal
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem && editingItem._id) {
        const res = await api.put(`/influencer-directory/${editingItem._id}`, formData);
        if (res.success) {
          showToast(`Influencer ${formData.name} updated successfully!`);
          setIsModalOpen(false);
          fetchDirectory();
        }
      } else {
        const res = await api.post('/influencer-directory', formData);
        if (res.success) {
          showToast(`Influencer ${formData.name} saved to directory!`);
          setIsModalOpen(false);
          fetchDirectory();
        }
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to save influencer'}`);
    }
  };

  // Delete from Directory
  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your directory?`)) return;
    try {
      const res = await api.delete(`/influencer-directory/${id}`);
      if (res.success) {
        showToast(`Removed ${name} from directory.`);
        fetchDirectory();
      }
    } catch (err: any) {
      showToast(`Error deleting: ${err.message}`);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      instagramHandle: '',
      name: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Fashion',
      followersCount: 25000,
      engagementRate: 4.5,
      phone: '',
      email: '',
      location: 'India',
      profileLink: '',
      status: 'Available',
      rating: 5,
      notes: '',
      bio: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InfluencerDirectoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Helper to ensure Instagram profile URLs never contain spaces or %20
  const getCleanInstagramUrl = (handle?: string, link?: string) => {
    if (link && link.trim() && link.startsWith('http') && !link.includes(' ') && !link.includes('%20')) {
      return link.trim();
    }
    const clean = (handle || '').replace(/^@/, '').replace(/\s+/g, '').replace(/%20/g, '').trim();
    return `https://instagram.com/${clean}`;
  };

  // Helper to get unique diverse avatar for creators
  const DIVERSE_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  ];

  const getCreatorAvatar = (avatarUrl?: string, handle?: string, name?: string) => {
    // If valid working HTTP image URL (that is not an expired Instagram scontent link or ui-avatars)
    if (avatarUrl && avatarUrl.trim() && avatarUrl.startsWith('http') && !avatarUrl.includes('scontent.cdninstagram.com') && !avatarUrl.includes('ui-avatars')) {
      return avatarUrl.trim();
    }
    // Fallback: Pick a beautiful unique profile portrait photo from DIVERSE_AVATARS based on handle hash
    const key = (handle || name || 'creator').toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % DIVERSE_AVATARS.length;
    return DIVERSE_AVATARS[idx];
  };

  // Helper to ensure creator name is never a raw URL string
  const getCleanCreatorName = (name: string, handle?: string) => {
    if (!name || name.startsWith('http') || name.toLowerCase().includes('instagram.com') || name.toLowerCase().includes('reel')) {
      const raw = handle ? handle.replace(/^@/, '') : (name ? name.split('?')[0].split('/').filter(Boolean).pop() : 'Creator');
      const clean = (raw || 'Creator').replace(/[\-_.]/g, ' ').replace(/\s+/g, ' ').trim();
      return clean ? (clean.charAt(0).toUpperCase() + clean.slice(1)) : 'Creator';
    }
    return name;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-purple-500/30">
          <Sparkles className="text-amber-400 shrink-0" size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner (Light Elegant Design) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-purple-600" /> Influencer Operations Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Influencer Directory & Discovery
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-2xl font-medium">
              Access your database of influencers from past Barter & Paid collabs, or discover new Instagram creators filtered by category, followers, and engagement.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 shrink-0 min-w-[300px]">
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-2xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Database Creators</div>
              <div className="text-2xl font-black text-purple-700 mt-0.5">{totalItems}</div>
            </div>
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-2xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Categories</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">8+</div>
            </div>
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-2xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Avg Engagement</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">4.8%</div>
            </div>
          </div>
        </div>

        {/* Sub-module Navigation Tabs & Action Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-0">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'border-transparent bg-slate-50 text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
              }`}
            >
              <Bookmark size={17} className={activeTab === 'directory' ? 'text-white' : 'text-slate-400'} />
              My Influencer Database
              <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalItems}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'border-transparent bg-slate-50 text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
              }`}
            >
              <Search size={17} className={activeTab === 'discover' ? 'text-white' : 'text-slate-400'} />
              Discover Instagram Creators
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeTab === 'discover' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                DIRECTORY
              </span>
            </button>
          </div>

          {/* Repositioned Action Buttons (Single Solid Shade) */}
          <div className="flex items-center gap-2.5 pb-2.5">
            <button
              onClick={handleSyncLiveInstagramStats}
              disabled={syncingLiveStats}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
              title="Fetch real follower counts, engagement rates & profile pictures from Instagram for all creators"
            >
              <Sparkles size={14} className={syncingLiveStats ? 'animate-spin' : ''} />
              <span>{syncingLiveStats ? 'Syncing Instagram...' : '⚡ Sync Live IG Data'}</span>
            </button>

            <button
              onClick={handleResetOldData}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              title="Clear old fake follower counts from DB so live Instagram sync can write real data"
            >
              <span>🗑️ Reset Fake Data</span>
            </button>

            <button
              onClick={() => fetchDirectory(1, true)}
              disabled={loadingDirectory}
              className="px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
              title="Refresh Database"
            >
              <RefreshCw size={14} className={loadingDirectory ? 'animate-spin text-purple-300' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PART 1: DATABASE DIRECTORY VIEW ("MY INFLUENCERS")                   */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Directory Toolbar / Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDirectory()}
                placeholder="Search by name, handle, bio, or location..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer hover:border-purple-300"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer hover:border-purple-300"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Contacted">Contacted</option>
                <option value="In Discussion">In Discussion</option>
                <option value="Preferred">Preferred</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>

              {/* Follower Tier */}
              <select
                value={followerTier}
                onChange={(e) => setFollowerTier(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer hover:border-purple-300"
              >
                <option value="All">All Follower Counts</option>
                <option value="micro">Micro (10K - 50K)</option>
                <option value="mid">Mid-Tier (50K - 500K)</option>
                <option value="macro">Macro (500K+)</option>
              </select>

              {/* Grid / Table Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500'}`}
                >
                  <Grid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500'}`}
                >
                  <TableIcon size={15} />
                </button>
              </div>

              {/* Add New Influencer Button */}
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Plus size={16} /> Add Influencer
              </button>
            </div>
          </div>

          {/* Directory Content List / Grid */}
          {loadingDirectory ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="animate-spin text-purple-600 mx-auto mb-3" size={28} />
              <p className="text-sm font-bold text-slate-600">Loading your saved influencers...</p>
            </div>
          ) : directoryItems.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
              <Users size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Saved Influencers Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No creators matched your current search filters or category. Add influencers manually or use the Discovery tab to save new creators!
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus size={15} /> Add First Influencer
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* COMPACT GRID CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {directoryItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
                >
                  {/* Top Colored Banner Bar */}
                  <div className="h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 relative">
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-2xs ${
                        item.status === 'Preferred' ? 'bg-emerald-500 text-white' :
                        item.status === 'Blacklisted' ? 'bg-rose-500 text-white' :
                        item.status === 'In Discussion' ? 'bg-amber-400 text-slate-950' :
                        'bg-white/95 text-purple-900 font-extrabold'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Profile Info Row */}
                  <div className="px-4 pt-0 pb-4 flex-1 flex flex-col -mt-7">
                    <div className="flex items-end justify-between">
                      <div className="relative">
                        <img
                          src={getCreatorAvatar(item.avatar, item.instagramHandle, item.name)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const key = (item.instagramHandle || item.name || 'creator').toLowerCase();
                            let hash = 0;
                            for (let i = 0; i < key.length; i++) {
                              hash = (hash << 5) - hash + key.charCodeAt(i);
                              hash |= 0;
                            }
                            const idx = Math.abs(hash) % DIVERSE_AVATARS.length;
                            target.src = DIVERSE_AVATARS[idx];
                          }}
                          style={{ width: '56px', height: '56px' }}
                          className="rounded-xl border-2 border-white object-cover shadow-sm bg-slate-100 shrink-0"
                        />
                        {item.isVerified && (
                          <CheckCircle2 size={15} className="absolute -bottom-0.5 -right-0.5 text-purple-600 fill-purple-100 bg-white rounded-full" />
                        )}
                      </div>

                      {/* Past Collabs Counter */}
                      <div className="bg-purple-50 border border-purple-200/80 rounded-lg px-2 py-0.5 text-center">
                        <div className="text-[9px] uppercase font-extrabold text-purple-600 leading-tight">Past Collabs</div>
                        <div className="text-[11px] font-black text-purple-900 leading-tight">{item.pastCollabsCount || 0} Deals</div>
                      </div>
                    </div>

                    <div className="mt-2.5 min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug truncate group-hover:text-purple-700 transition-colors" title={item.name}>
                        {getCleanCreatorName(item.name, item.instagramHandle)}
                      </h3>
                      <a
                        href={getCleanInstagramUrl(item.instagramHandle, item.profileLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-purple-600 hover:underline truncate inline-flex items-center gap-1 mt-0.5 max-w-full"
                      >
                        <span className="truncate">{item.instagramHandle}</span> <ExternalLink size={10} className="shrink-0" />
                      </a>
                    </div>

                    {/* Category & Location */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.category}
                      </span>
                      {item.location && (
                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5 truncate">
                          <MapPin size={10} className="text-slate-400 shrink-0" /> {item.location}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {item.bio && (
                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{item.bio}"
                      </p>
                    )}

                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Followers</div>
                        <div className="text-xs font-black text-slate-800">{formatNumber(item.followersCount)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Engagement</div>
                        <div className="text-xs font-black text-emerald-600">{item.engagementRate}%</div>
                      </div>
                    </div>

                    {/* Direct Contact Actions & Rating */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={11}
                            className={star <= (item.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                          />
                        ))}
                      </div>

                      {/* Quick Contact Buttons */}
                      <div className="flex items-center gap-1">
                        {item.phone && (
                          <a
                            href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Call / WhatsApp"
                          >
                            <Phone size={13} />
                          </a>
                        )}
                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Send Email"
                          >
                            <Mail size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id!, item.name)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete from Directory"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT TABLE VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Creator</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-right">Followers</th>
                      <th className="py-3.5 px-4 text-right">Engagement</th>
                      <th className="py-3.5 px-4 text-center">Past Collabs</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {directoryItems.map((item) => (
                      <tr key={item._id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getCreatorAvatar(item.avatar, item.instagramHandle, item.name)}
                              alt=""
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const cleanHandle = (item.instagramHandle || '').replace(/^@/, '').replace(/\s+/g, '').trim();
                                if (!target.src.includes('unavatar.io') && cleanHandle) {
                                  target.src = `https://unavatar.io/instagram/${cleanHandle}`;
                                } else {
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || cleanHandle || 'Creator')}&background=7c3aed&color=fff`;
                                }
                              }}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm">{item.name}</div>
                              <a
                                href={getCleanInstagramUrl(item.instagramHandle, item.profileLink)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                              >
                                {item.instagramHandle} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{item.category}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatNumber(item.followersCount)}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600">{item.engagementRate}%</td>
                        <td className="py-3 px-4 text-center font-extrabold text-purple-700">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800">
                            {item.pastCollabsCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'Preferred' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Blacklisted' ? 'bg-rose-100 text-rose-800' :
                            item.status === 'In Discussion' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {item.phone && (
                              <a href={`https://wa.me/${item.phone}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
                                WhatsApp
                              </a>
                            )}
                            {item.email && (
                              <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                                Email
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(item)} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg cursor-pointer">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteItem(item._id!, item.name)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {directoryItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  fetchDirectory(p);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PART 2: DISCOVER INSTAGRAM INFLUENCERS (THIRD-PARTY API INTEGRATION)   */}
      {/* ========================================================================= */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Category Filter Pills Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Sparkles size={14} /> Browse Creators by Niche / Category
            </div>

            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.filter(c => c.id !== 'All').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setDiscoveryCategory(cat.id);
                    handleDiscoverSearch(cat.id);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    discoveryCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-105'
                      : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-transparent'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Advanced Search & Metrics Filter Inputs */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Keyword Query Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscoverSearch()}
                  placeholder="e.g. fashion content, luxury..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Follower Range Filter */}
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'micro') {
                    setDiscoveryMinFollowers(10000); setDiscoveryMaxFollowers(100000);
                  } else if (val === 'mid') {
                    setDiscoveryMinFollowers(100000); setDiscoveryMaxFollowers(500000);
                  } else if (val === 'macro') {
                    setDiscoveryMinFollowers(500000); setDiscoveryMaxFollowers(10000000);
                  } else {
                    setDiscoveryMinFollowers(0); setDiscoveryMaxFollowers(10000000);
                  }
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Any Followers Count</option>
                <option value="micro">Micro (10K - 100K)</option>
                <option value="mid">Mid-Tier (100K - 500K)</option>
                <option value="macro">Macro (500K+)</option>
              </select>

              {/* Min Engagement Rate */}
              <select
                onChange={(e) => setDiscoveryMinEngagement(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="0">Any Engagement Rate</option>
                <option value="3">&gt; 3.0% Engagement</option>
                <option value="5">&gt; 5.0% High Engagement</option>
              </select>

              {/* Search API Trigger Button */}
              <button
                onClick={() => handleDiscoverSearch()}
                disabled={loadingDiscovery}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
              >
                {loadingDiscovery ? (
                  <>
                    <RefreshCw className="animate-spin" size={15} /> Fetching Instagram API...
                  </>
                ) : (
                  <>
                    <Search size={15} /> Discover Creators
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Discovered Creators Grid */}
          {loadingDiscovery ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="animate-spin text-purple-600 mx-auto mb-3" size={32} />
              <h3 className="text-base font-extrabold text-slate-800">Fetching Database Creators...</h3>
              <p className="text-xs text-slate-500 mt-1">Searching creators matching "{discoveryCategory}" content</p>
            </div>
          ) : discoveredItems.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                <Sparkles size={28} className="text-purple-600" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">Instagram Creator Discovery Module</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Live creator discovery functionality is currently paused. Please use <span className="font-bold text-purple-700">"My Influencer Database"</span> to view, search, and manage your saved influencers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoveredItems.map((creator) => (
                <div
                  key={creator.instagramHandle}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative"
                >
                  {/* Card Header & Category Badge */}
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-br from-slate-50 to-purple-50/30">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const cleanHandle = (creator.instagramHandle || '').replace(/^@/, '').replace(/\s+/g, '').trim();
                            target.src = `https://unavatar.io/instagram/${cleanHandle}`;
                          }}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-200"
                        />
                        {creator.isVerified && (
                          <CheckCircle2 size={16} className="absolute -bottom-1 -right-1 text-purple-600 fill-purple-100 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                          {creator.name}
                        </h4>
                        <a
                          href={getCleanInstagramUrl(creator.instagramHandle, creator.profileLink)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          @{creator.instagramHandle.replace(/^@/, '')} <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                      {creator.category}
                    </span>
                  </div>

                  {/* Body Info & Bio */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{creator.bio}"
                      </p>
                    )}

                    {/* Key Creator Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Followers</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5">{formatNumber(creator.followersCount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Engagement</div>
                        <div className="text-xs font-black text-emerald-600 mt-0.5">{creator.engagementRate}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Likes</div>
                        <div className="text-xs font-black text-purple-900 mt-0.5">{formatNumber(creator.avgLikes)}</div>
                      </div>
                    </div>

                    {/* Est Rate per Post */}
                    {creator.estRatePerPost && (
                      <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900">
                        <span className="font-semibold text-[11px]">Est. Reel / Post Rate:</span>
                        <span className="font-extrabold text-amber-800">{creator.estRatePerPost}</span>
                      </div>
                    )}

                    {/* Recent Content Preview Thumbnails */}
                    {creator.recentPosts && creator.recentPosts.length > 0 && (
                      <div>
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Eye size={12} /> Content Preview
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {creator.recentPosts.map((post, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden group/post h-24 border border-slate-200">
                              <img src={post.image} alt="" className="w-full h-full object-cover group-hover/post:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/post:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-[10px] font-bold">
                                <span className="flex items-center gap-0.5"><Heart size={10} className="fill-white" /> {formatNumber(post.likes)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SAVE TO DATABASE BUTTON */}
                    <div className="pt-2">
                      {creator.isSavedInDb ? (
                        <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                          <CheckCircle2 size={16} className="text-emerald-600" /> Saved in Database Directory
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSaveDiscoveredToDb(creator)}
                          disabled={savingHandle === creator.instagramHandle}
                          className="w-full py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingHandle === creator.instagramHandle ? (
                            <>
                              <RefreshCw className="animate-spin" size={15} /> Saving to Database...
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Save to Database Directory
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Discovery Pagination Controls */}
          {discoveredItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <Pagination
                currentPage={discoveryPage}
                totalPages={discoveryTotalPages}
                totalItems={discoveryTotalItems}
                itemsPerPage={12}
                onPageChange={(p) => {
                  setDiscoveryPage(p);
                  handleDiscoverSearch(undefined, p);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT INFLUENCER MODAL                                              */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit Profile: ${editingItem.name}` : 'Add New Influencer to Database'}
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram Handle *</label>
                <input
                  type="text"
                  required
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                  placeholder="@fashion_creator"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Influencer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Komal Pandey"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo / Avatar Image URL</label>
              <input
                type="text"
                value={formData.avatar || ''}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="Paste direct Instagram profile picture link or custom image URL..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Leave blank to automatically load live Instagram profile picture for this handle.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Niche *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                >
                  {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Discussion">In Discussion</option>
                  <option value="Preferred">Preferred</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Followers Count</label>
                <input
                  type="number"
                  value={formData.followersCount}
                  onChange={(e) => setFormData({ ...formData, followersCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Engagement Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.engagementRate}
                  onChange={(e) => setFormData({ ...formData, engagementRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@creator.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Niche Overview</label>
              <textarea
                rows={2}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief profile summary, fashion styling specialization..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-md shadow-purple-500/20 cursor-pointer"
              >
                Save Influencer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
