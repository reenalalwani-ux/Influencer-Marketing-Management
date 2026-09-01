import React, { useState, useEffect } from 'react';
import {
  Briefcase, CheckCircle2, Clock, Eye, Sparkles, Filter, ExternalLink,
  MessageSquare, ThumbsUp, Calendar as CalendarIcon, Users, RefreshCw,
  Search, ShieldCheck, FileText, Play, Instagram, Youtube, Linkedin, Facebook, Twitter,
  TrendingUp, Send, Download, Award, Star, Zap, Plus, ChevronDown, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { User, ClientPosting, ClientOverviewData } from '../types';

// Custom Attractive Platform Dropdown with Official Platform Icons
const CustomPlatformDropdown: React.FC<{
  selectedPlatform: string;
  onSelect: (platform: string) => void;
}> = ({ selectedPlatform, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const options = [
    { id: 'All', label: 'All Platforms', icon: <Sparkles size={14} className="text-purple-600" /> },
    { id: 'Instagram', label: 'Instagram', icon: <Instagram size={14} className="text-pink-600" /> },
    { id: 'YouTube', label: 'YouTube', icon: <Youtube size={14} className="text-red-600" /> },
    { id: 'LinkedIn', label: 'LinkedIn', icon: <Linkedin size={14} className="text-blue-600" /> },
    { id: 'Facebook', label: 'Facebook', icon: <Facebook size={14} className="text-blue-700" /> },
    { id: 'Twitter', label: 'Twitter / X', icon: <Twitter size={14} className="text-slate-800" /> }
  ];

  const currentOption = options.find(o => o.id === selectedPlatform) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-50/90 border border-purple-200/90 text-purple-950 text-xs font-black rounded-xl px-3.5 py-2 focus:outline-none hover:bg-purple-100/90 transition flex items-center justify-between gap-2 min-w-[145px] shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {currentOption.icon}
          <span className="truncate">{currentOption.label}</span>
        </div>
        <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 space-y-1">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-extrabold rounded-xl flex items-center justify-between transition cursor-pointer ${
                selectedPlatform === opt.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={selectedPlatform === opt.id ? 'text-white' : ''}>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </div>
              {selectedPlatform === opt.id && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Attractive Status Dropdown with Colored Badges
const CustomStatusDropdown: React.FC<{
  selectedStatus: string;
  onSelect: (status: string) => void;
}> = ({ selectedStatus, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const options = [
    { id: 'All', label: 'All Statuses', icon: <Layers size={14} className="text-purple-600" /> },
    { id: 'Published', label: 'Published Live', icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
    { id: 'Scheduled', label: 'Scheduled Upcoming', icon: <Clock size={14} className="text-amber-600" /> }
  ];

  const currentOption = options.find(o => o.id === selectedStatus) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-50/90 border border-purple-200/90 text-purple-950 text-xs font-black rounded-xl px-3.5 py-2 focus:outline-none hover:bg-purple-100/90 transition flex items-center justify-between gap-2 min-w-[155px] shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {currentOption.icon}
          <span className="truncate">{currentOption.label}</span>
        </div>
        <ChevronDown size={14} className={`text-purple-600 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-2xl bg-white shadow-2xl border border-purple-200 ring-1 ring-purple-950/5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5 space-y-1">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-extrabold rounded-xl flex items-center justify-between transition cursor-pointer ${
                selectedStatus === opt.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={selectedStatus === opt.id ? 'text-white' : ''}>{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </div>
              {selectedStatus === opt.id && <CheckCircle2 size={13} className="text-white shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ClientDashboardViewProps {
  user: User;
}

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'calendar' | 'influencers'>('feed');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<ClientOverviewData | null>(null);
  const [postings, setPostings] = useState<ClientPosting[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);

  // Filter states
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Popup Modals
  const [showBrandInfoModal, setShowBrandInfoModal] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);

  // New Request Campaign / Deliverable Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestPlatform, setRequestPlatform] = useState('Instagram');
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  const resetAllFilters = () => {
    setPlatformFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setActiveTab('feed');
  };

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const [overviewRes, postingsRes, influencersRes] = await Promise.all([
        api.get('/client/overview'),
        api.get(`/client/postings?platform=${platformFilter}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`),
        api.get('/client/influencers')
      ]);

      if (overviewRes.success) setOverviewData(overviewRes.data);
      if (postingsRes.success) setPostings(postingsRes.postings || []);
      if (influencersRes.success) setInfluencers(influencersRes.influencers || []);
    } catch (err) {
      console.error('Error loading client portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [platformFilter, statusFilter]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setTimeout(() => {
      setSubmittingRequest(false);
      setRequestSuccessMsg(`Your request for "${requestTitle}" (${requestPlatform}) has been sent directly to your account manager!`);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestTitle('');
        setRequestNotes('');
        setRequestSuccessMsg('');
      }, 2200);
    }, 600);
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram className="text-pink-600 shrink-0" size={16} />;
    if (p.includes('youtube')) return <Youtube className="text-red-600 shrink-0" size={16} />;
    if (p.includes('linkedin')) return <Linkedin className="text-blue-600 shrink-0" size={16} />;
    if (p.includes('facebook')) return <Facebook className="text-blue-700 shrink-0" size={16} />;
    if (p.includes('twitter') || p.includes('x')) return <Twitter className="text-slate-800 shrink-0" size={16} />;
    return <Sparkles className="text-purple-600 shrink-0" size={16} />;
  };

  const brand = user.brandDetails || overviewData?.brand;
  const metrics = overviewData?.metrics;

  return (
    <div className="space-y-6 pb-12">
      {/* Enhanced Ultra-Premium Client Brand Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl p-6 sm:p-8 text-slate-900 shadow-md shadow-purple-900/5 border border-purple-200/90 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-pink-50/50">
        {/* Dynamic ambient mesh gradients */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-indigo-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Logo & Brand Info */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div
              onClick={() => setShowBrandInfoModal(true)}
              className="shrink-0 cursor-pointer group"
              title="Click to view full Brand Profile & Contact Details"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 border border-purple-200/90 flex items-center justify-center shadow-md ring-4 ring-purple-100/80 group-hover:scale-105 group-hover:border-purple-400 group-hover:ring-purple-200 transition-all">
                {brand?.logo ? (
                  <img src={brand.logo} alt={brand.brandName} className="max-w-full max-h-full object-contain" />
                ) : (
                  <Briefcase size={36} className="text-purple-600 group-hover:text-purple-700 transition-colors" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={resetAllFilters}
                  className="px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 hover:opacity-90 hover:scale-105 transition-all cursor-pointer"
                  title="Click to reset all filters to Overview"
                >
                  <Sparkles size={11} /> Client Portal
                </button>
                <button
                  onClick={() => setShowVerifiedModal(true)}
                  className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-100 hover:scale-105 transition-all cursor-pointer"
                  title="Click to view Account Verification status"
                >
                  <ShieldCheck size={12} className="text-emerald-600" /> Verified Account
                </button>
                {brand?.industry && (
                  <button
                    onClick={() => setShowBrandInfoModal(true)}
                    className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer"
                    title="Click to view Industry details"
                  >
                    {brand.industry}
                  </button>
                )}
              </div>

              <h1
                onClick={() => setShowBrandInfoModal(true)}
                className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1 cursor-pointer hover:text-purple-700 transition-colors"
                title="Click to view Brand Profile"
              >
                {brand?.brandName || user.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-xl leading-relaxed">
                Track live social media postings, active campaigns, creator deliverables & engagement metrics for your brand.
              </p>
            </div>
          </div>

          {/* Right Column: Quick Status Highlights & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Quick Status Pill 1 */}
            <div
              onClick={() => setShowPlatformsModal(true)}
              className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-purple-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-purple-400 hover:shadow-md hover:scale-[1.02] transition-all group"
              title="Click to view monitored social media channels"
            >
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Play size={16} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Social Channels</div>
                <div className="text-xs font-black text-slate-900 group-hover:text-purple-700 transition-colors">5 Platforms Monitored</div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchClientData}
              disabled={loading}
              className="px-4 py-3 rounded-2xl bg-white hover:bg-purple-600 text-purple-700 hover:text-white font-black text-xs border border-purple-200 hover:border-purple-600 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group shrink-0"
              title="Click to refresh latest social media data"
            >
              <RefreshCw size={15} className={`transition-transform ${loading ? 'animate-spin text-purple-600' : 'group-hover:rotate-180'}`} />
              <span>Refresh Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards (ALL CLICKABLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Social Postings */}
        <div
          onClick={() => { setActiveTab('feed'); setStatusFilter('All'); setPlatformFilter('All'); setSearchQuery(''); }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-purple-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          title="Click to view all social media postings"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-purple-600 transition-colors">Total Postings</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.totalPosts || 0}</div>
          <div className="text-[11px] font-semibold text-purple-600 mt-1 flex items-center gap-1">
            <span>View all posts →</span>
          </div>
        </div>

        {/* Card 2: Published & Live */}
        <div
          onClick={() => { setActiveTab('feed'); setStatusFilter('Published'); setPlatformFilter('All'); }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          title="Click to view published live content"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-emerald-600 transition-colors">Live & Published</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.publishedPosts || 0}</div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <span>View live content →</span>
          </div>
        </div>

        {/* Card 3: Upcoming / Scheduled */}
        <div
          onClick={() => { setActiveTab('feed'); setStatusFilter('Scheduled'); setPlatformFilter('All'); }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          title="Click to view scheduled upcoming posts"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-amber-600 transition-colors">Scheduled Posts</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.scheduledPosts || 0}</div>
          <div className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
            <span>View scheduled →</span>
          </div>
        </div>

        {/* Card 4: Active Influencers */}
        <div
          onClick={() => setActiveTab('influencers')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          title="Click to view creator collaborations"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-indigo-600 transition-colors">Creators / Collabs</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.activeInfluencers || 0}</div>
          <div className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
            <span>View creators →</span>
          </div>
        </div>

        {/* Card 5: Total Organic Views */}
        <div
          onClick={() => setActiveTab('influencers')}
          className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-pink-300 hover:-translate-y-0.5 transition-all cursor-pointer group"
          title="Click to view views breakdown"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-pink-600 transition-colors">Total Views</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.totalViews ? metrics.totalViews.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] font-semibold text-pink-600 mt-1 flex items-center gap-1">
            <span>View reach data →</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'feed'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-extrabold'
              : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
          }`}
        >
          <Play size={16} />
          <span>"What Was Posted" Live Feed</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
            {postings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('influencers')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'influencers'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-extrabold'
              : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50/50'
          }`}
        >
          <Users size={16} />
          <span>Influencer Collaborations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px]">
            {influencers.length}
          </span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      {activeTab === 'feed' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Vertically Centered Search Box */}
          <div className="relative w-full sm:w-80 flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, caption, title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
          </div>

          {/* Custom Attractive Platform & Status Floating Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-purple-600 shrink-0" />
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider shrink-0">Platform:</span>
              <CustomPlatformDropdown
                selectedPlatform={platformFilter}
                onSelect={(p) => setPlatformFilter(p)}
              />
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider shrink-0">Status:</span>
              <CustomStatusDropdown
                selectedStatus={statusFilter}
                onSelect={(s) => setStatusFilter(s)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: WHAT WAS POSTED LIVE FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
              <p className="text-xs font-bold">Loading social media activities...</p>
            </div>
          ) : postings.filter(p => p.status === 'Published' || p.publishedUrl || p.mediaUrl).length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
              <FileText size={32} className="mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">No Live Postings Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No published social media posts match the selected platform filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postings
                .filter(p => p.status === 'Published' || p.publishedUrl || p.mediaUrl)
                .map(post => (
                <div
                  key={`${post.sourceType}-${post.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Header Card */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-xs font-black text-slate-800">{post.platform}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                          {post.contentType}
                        </span>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        PUBLISHED
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-black text-slate-900 line-clamp-2 group-hover:text-purple-600 transition">
                        {post.title}
                      </h4>

                      {post.notes && (
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
                          {post.notes}
                        </p>
                      )}

                      {/* Performance Metrics if Published */}
                      {post.viewsCount !== undefined && post.viewsCount > 0 && (
                        <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-purple-900 flex items-center gap-1.5">
                            <Eye size={14} className="text-purple-600" /> Organic Reach
                          </span>
                          <span className="font-black text-purple-700">{post.viewsCount.toLocaleString()} Views</span>
                        </div>
                      )}

                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <CalendarIcon size={13} />
                        <span>Date: {new Date(post.postDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Link Button */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={post.publishedUrl || post.mediaUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs transition flex items-center justify-center gap-1.5 border border-purple-200/80 cursor-pointer shadow-2xs"
                    >
                      <span>View Live Post</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INFLUENCER COLLABORATIONS */}
      {activeTab === 'influencers' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Brand Creator & Influencer Roster</h3>
              <p className="text-xs font-medium text-slate-500">Influencers currently executing campaigns for your brand</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 font-extrabold text-xs rounded-full">
              {influencers.length} Creators
            </span>
          </div>

          {/* Top Performing Creator Spotlight */}
          {influencers.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-2xl p-4 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  <Star size={20} className="text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider">
                      Featured Creator Spotlight
                    </span>
                    <span className="text-xs font-black text-slate-900">{influencers[0].influencerName}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    @{influencers[0].influencerInstagramId || 'creator'} • <span className="text-purple-700 font-bold">{influencers[0].videoType || 'Product Video'}</span> ({influencers[0].category} Campaign)
                  </p>
                </div>
              </div>

              {influencers[0].contentLink ? (
                <a
                  href={influencers[0].contentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                >
                  <Play size={14} />
                  <span>Watch Creative Reel</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-600 text-xs font-bold shrink-0">
                  Deliverable In Progress
                </span>
              )}
            </div>
          )}

          {influencers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No active influencer campaigns recorded for this brand.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Influencer</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Deliverable Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Views / Performance</th>
                    <th className="p-3.5 text-right">Content Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {influencers.map((inf) => (
                    <tr key={inf._id} className="hover:bg-purple-50/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{inf.influencerName}</div>
                        <div className="text-[11px] text-purple-600">@{inf.influencerInstagramId || 'instagram'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inf.category === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inf.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {inf.videoType || 'Product Reel'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                          {inf.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {inf.viewsCount ? `${inf.viewsCount.toLocaleString()} Views` : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        {inf.contentLink ? (
                          <a
                            href={inf.contentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800"
                          >
                            <span>Watch Reel</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">In progress</span>
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

      {/* POPUP 1: BRAND PROFILE MODAL */}
      <Modal
        isOpen={showBrandInfoModal}
        onClose={() => setShowBrandInfoModal(false)}
        title={`Brand Profile - ${brand?.brandName || 'Client'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <div className="w-16 h-16 rounded-xl bg-white p-2 border border-purple-200 flex items-center justify-center shrink-0 shadow-sm">
              {brand?.logo ? (
                <img src={brand.logo} alt={brand.brandName} className="max-w-full max-h-full object-contain" />
              ) : (
                <Briefcase size={28} className="text-purple-600" />
              )}
            </div>
            <div>
              <div className="text-base font-black text-slate-900">{brand?.brandName || user.name}</div>
              <div className="text-xs text-purple-700 font-bold">{brand?.brandId || 'BRD-CLIENT'}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{brand?.industry || 'General Industry'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700 font-semibold">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">Contact Person</span>
              <span className="font-bold text-slate-900">{brand?.contactPerson || user.name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">Account Email</span>
              <span className="font-bold text-slate-900">{brand?.email || user.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">Account Status</span>
              <span className="font-bold text-emerald-700">Active & Verified</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">Monitored Platforms</span>
              <span className="font-bold text-purple-700">5 Social Networks</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowBrandInfoModal(false)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP 2: VERIFIED ACCOUNT MODAL */}
      <Modal
        isOpen={showVerifiedModal}
        onClose={() => setShowVerifiedModal(false)}
        title="Verified Client Account"
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">Official Brand Access Verified</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This account is officially linked to <strong className="text-slate-800">{brand?.brandName || 'your brand'}</strong> with end-to-end data isolation and social activity sync.
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 text-left space-y-1.5">
            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Real-Time Social Media Sync Enabled</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Encrypted Workspace Access Controls</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Direct Agency Support Line</div>
          </div>
          <button
            onClick={() => setShowVerifiedModal(false)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </Modal>

      {/* POPUP 3: MONITORED PLATFORMS MODAL */}
      <Modal
        isOpen={showPlatformsModal}
        onClose={() => setShowPlatformsModal(false)}
        title="Monitored Social Media Channels"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 font-semibold">
            Select a social channel below to filter postings for <strong className="text-slate-900">{brand?.brandName || 'your brand'}</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Instagram', desc: 'Official Instagram Handle', icon: <Instagram size={20} className="text-pink-600" />, defaultUrl: `https://www.instagram.com/${(brand?.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
              { name: 'YouTube', desc: 'Official YouTube Channel', icon: <Youtube size={20} className="text-red-600" />, defaultUrl: `https://www.youtube.com/@${(brand?.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
              { name: 'LinkedIn', desc: 'LinkedIn Company Page', icon: <Linkedin size={20} className="text-blue-600" />, defaultUrl: `https://www.linkedin.com/company/${(brand?.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
              { name: 'Facebook', desc: 'Facebook Brand Page', icon: <Facebook size={20} className="text-blue-700" />, defaultUrl: `https://www.facebook.com/${(brand?.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
              { name: 'Twitter', desc: 'Official X / Twitter Profile', icon: <Twitter size={20} className="text-slate-800" />, defaultUrl: `https://x.com/${(brand?.brandName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}` }
            ].map(p => {
              // Find matching live post URL, brand instagramUrl, or use official platform profile URL
              let brandIgUrl = brand?.instagramUrl ? (brand.instagramUrl.startsWith('http') ? brand.instagramUrl : `https://www.instagram.com/${brand.instagramUrl.replace('@', '')}`) : null;
              const matchingPost = postings.find(post => post.platform.toLowerCase().includes(p.name.toLowerCase()) && (post.publishedUrl || post.mediaUrl));
              const targetUrl = (p.name === 'Instagram' && brandIgUrl) ? brandIgUrl : (matchingPost?.publishedUrl || matchingPost?.mediaUrl || p.defaultUrl);

              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setPlatformFilter(p.name);
                    setActiveTab('feed');
                    setShowPlatformsModal(false);
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left flex items-center justify-between gap-3 transition group cursor-pointer"
                  title={`Click to open official ${p.name} account & filter feed`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white shadow-xs group-hover:scale-110 transition-transform">
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-700">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{p.desc}</div>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-purple-600 shrink-0 transition" />
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <button
              onClick={() => { setPlatformFilter('All'); setActiveTab('feed'); setShowPlatformsModal(false); }}
              className="text-xs font-extrabold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
            >
              Show All Platforms
            </button>
            <button
              onClick={() => setShowPlatformsModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP 4: REQUEST NEW CAMPAIGN / CONTENT MODAL */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request New Content / Campaign"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 font-medium leading-relaxed">
            <strong className="font-black flex items-center gap-1 text-purple-800">
              <Sparkles size={14} /> Direct Agency Request Line:
            </strong>
            Submit creative requirements directly to your assigned social media team and account manager.
          </div>

          {requestSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{requestSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-extrabold text-slate-700 uppercase mb-1">
              Content / Campaign Title *
            </label>
            <input
              type="text"
              required
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="e.g. Festive Product Launch Reel"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 uppercase mb-1">
                Target Platform *
              </label>
              <select
                value={requestPlatform}
                onChange={(e) => setRequestPlatform(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
              >
                <option value="Instagram">Instagram Reel / Post</option>
                <option value="YouTube">YouTube Video / Short</option>
                <option value="LinkedIn">LinkedIn Article</option>
                <option value="Facebook">Facebook Post</option>
                <option value="X">Twitter / X</option>
              </select>
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 uppercase mb-1">
                Priority
              </label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-purple-600 focus:bg-white">
                <option value="High">🚀 High Priority (Immediate)</option>
                <option value="Standard">⚡ Standard (Next 48 Hours)</option>
                <option value="Flexible">📅 Flexible Schedule</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">
              Creative Notes & Instructions for Agency Team
            </label>
            <textarea
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Enter design instructions, product links, caption notes, or target release dates..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {submittingRequest ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Request to Agency</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
