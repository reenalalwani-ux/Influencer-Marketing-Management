import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, FileSpreadsheet, Link2, Video, User, AlertCircle, RefreshCw, Building2, Grid, List } from 'lucide-react';
import { api } from '../services/api';

interface PublicCalendarItem {
  _id: string;
  brandName: string;
  postDate: string;
  dayOfWeek?: string;
  typeOfPost: string;
  platform: string;
  referenceLink?: string;
  mediaLink?: string;
  assignedDesignerName?: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Published';
  notes?: string;
}

interface Meta {
  brandName: string;
  year: number;
  month: number;
  monthName: string;
  generatedAt: string;
}

const STATUS_CONFIG = {
  Published: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500', label: '✅ Published' },
  Approved:  { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500',    label: '✔ Approved'  },
  Pending:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500',   label: '⏳ Pending'   },
  Draft:     { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-300',   dot: 'bg-slate-400',   label: '📝 Draft'     },
};

const PLATFORM_EMOJI: Record<string, string> = {
  Instagram: '📸',
  YouTube:   '▶️',
  Facebook:  '👤',
  LinkedIn:  '💼',
  TikTok:    '🎵',
};

export const PublicCalendarShareView: React.FC<{ token: string }> = ({ token }) => {
  const [items, setItems] = useState<PublicCalendarItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await api.get(`/content-calendar/public/${token}`);
      if (json.success) {
        setItems(json.data);
        setMeta(json.meta);
        setLastRefreshed(new Date());
      } else {
        setError(json.message || 'Failed to load calendar');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const publishedCount = items.filter(i => i.status === 'Published').length;
  const approvedCount  = items.filter(i => i.status === 'Approved').length;
  const pendingCount   = items.filter(i => i.status === 'Pending').length;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl animate-pulse">
          <FileSpreadsheet size={28} className="text-white" />
        </div>
        <p className="text-slate-600 font-bold text-sm">Loading content calendar…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border border-rose-100">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Oops! Link Issue</h2>
        <p className="text-slate-500 text-sm font-medium mb-6">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Minimal Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <FileSpreadsheet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                {meta?.brandName} — Content Calendar
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                {meta?.monthName} {meta?.year} &nbsp;·&nbsp; Client Shared View
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold border border-emerald-200">
              ● Live Read-Only View
            </span>
          </div>
        </div>

        {/* No items */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs">
            <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-semibold">No content scheduled for this period.</p>
          </div>
        ) : (
          /* SPREADSHEET GRID VIEW ONLY */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {/* Row 1: Day */}
                  <tr className="bg-pink-200/90 text-slate-900 font-black text-sm">
                    <td className="p-3 bg-pink-300 border-b border-r border-pink-300 font-extrabold w-40 sticky left-0 z-10 text-slate-900">
                      Day
                    </td>
                    {items.map(item => (
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
                    {items.map(item => (
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
                    {items.map(item => (
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
                    {items.map(item => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-extrabold">
                          {PLATFORM_EMOJI[item.platform] || ''} {item.platform || 'Instagram'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {/* Row 5: Reference Link */}
                  <tr className="bg-white">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Reference Link
                    </td>
                    {items.map(item => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        {item.referenceLink ? (
                          <a href={item.referenceLink} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:underline font-medium text-[11px] break-all line-clamp-3 block bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                            {item.referenceLink}
                          </a>
                        ) : <span className="text-slate-400 font-mono text-[11px]">—</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Row 6: Video/Image Link */}
                  <tr className="bg-slate-50/50">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Video/Image Link
                    </td>
                    {items.map(item => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200">
                        {item.mediaLink ? (
                          <a href={item.mediaLink} target="_blank" rel="noreferrer"
                            className="text-purple-600 hover:underline font-bold flex items-center justify-center gap-1 bg-purple-50 p-1.5 rounded-lg">
                            <Video size={12} /> Media
                          </a>
                        ) : <span className="text-slate-400 font-mono text-[11px]">—</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Row 7: Assigned POC */}
                  <tr className="bg-white">
                    <td className="p-3 bg-pink-100/50 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10">
                      Assigned POC
                    </td>
                    {items.map(item => (
                      <td key={item._id} className="p-3 text-center border-b border-r border-slate-200 font-bold text-slate-800">
                        {item.assignedDesignerName ? (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs inline-flex items-center gap-1 border border-slate-200">
                            <User size={11} className="text-purple-600" /> {item.assignedDesignerName}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Row 8: Status */}
                  <tr className="bg-slate-100/50">
                    <td className="p-3 bg-pink-200/80 border-r border-slate-200 font-black text-slate-800 sticky left-0 z-10">
                      Status
                    </td>
                    {items.map(item => {
                      const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Draft;
                      return (
                        <td key={item._id} className="p-3 text-center border-r border-slate-200">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-extrabold border ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {item.status}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="text-center text-xs text-slate-400 font-medium pt-2">
          <span>Powered by <strong className="text-purple-600">Ad2Ship Influencer Management System</strong></span>
        </div>
      </div>
    </div>
  );
};
