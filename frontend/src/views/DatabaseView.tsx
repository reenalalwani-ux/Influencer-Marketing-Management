import React, { useState, useEffect } from 'react';
import { Database, Server, Layers, Search, RefreshCw, Table, Code, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface CollectionInfo {
  name: string;
  modelName: string;
  collectionName: string;
  count: number;
}

interface OverviewData {
  status: string;
  dbState: string;
  databaseName: string;
  totalCollections: number;
  collections: CollectionInfo[];
}

export const DatabaseView: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activeCollection, setActiveCollection] = useState<string>('users');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    setError(null);
    try {
      const res = await api.get('/db/overview');
      if (res.status === 'success') {
        setOverview(res);
        if (res.collections && res.collections.length > 0 && !res.collections.some((c: any) => c.name === activeCollection)) {
          setActiveCollection(res.collections[0].name);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch database overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchCollectionDocs = async (collectionName: string) => {
    setLoadingDocs(true);
    try {
      const res = await api.get(`/db/collection/${collectionName}`);
      if (res.status === 'success') {
        setDocuments(res.documents || []);
      }
    } catch (err: any) {
      console.error(err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeCollection) {
      fetchCollectionDocs(activeCollection);
    }
  }, [activeCollection]);

  const filteredDocs = documents.filter((doc) => {
    if (!searchTerm) return true;
    const str = JSON.stringify(doc).toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  const totalDocCount = overview?.collections.reduce((sum, c) => sum + c.count, 0) || 0;

  // Extract table headers dynamically from first document
  const headers = documents.length > 0 ? Object.keys(documents[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Database size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              MongoDB Inspector
              <span className="text-xs px-2.5 py-0.5 rounded-full badge-verified font-bold">
                Live MongoDB
              </span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Inspect collections, Mongoose models, and real-time MongoDB database documents.
            </p>
          </div>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loadingOverview}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loadingOverview ? 'animate-spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Database Status</div>
            <div className="text-lg font-extrabold text-slate-900">{overview?.dbState || 'Connecting...'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-700">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Database Engine</div>
            <div className="text-lg font-extrabold text-slate-900">{overview?.databaseName || 'MongoMemoryServer'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-700">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Collections</div>
            <div className="text-lg font-extrabold text-slate-900">{overview?.totalCollections || 0}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <Server size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total DB Records</div>
            <div className="text-lg font-extrabold text-slate-900">{totalDocCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Collections List Sidebar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-extrabold text-purple-700 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Collections</span>
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">{overview?.collections.length || 0}</span>
          </div>

          <div className="space-y-1">
            {overview?.collections.map((col) => {
              const isActive = activeCollection === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setActiveCollection(col.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Database size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="capitalize truncate">{col.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {col.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Viewer */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-base font-extrabold text-slate-900 capitalize flex items-center gap-2">
                {activeCollection}
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  ({filteredDocs.length} of {documents.length} docs)
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" />
                <input
                  type="text"
                  placeholder="Filter collection documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Table View"
                >
                  <Table size={14} />
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    viewMode === 'json' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="JSON View"
                >
                  <Code size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Documents Content */}
          {loadingDocs ? (
            <div className="py-12 flex items-center justify-center text-slate-400 text-sm">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
              Loading collection records...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No documents found in collection <span className="font-semibold text-slate-300">'{activeCollection}'</span> matching your search.
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-extrabold">
                  <tr>
                    {headers.slice(0, 8).map((header) => (
                      <th key={header} className="p-3 font-extrabold text-slate-800 capitalize whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredDocs.map((doc, idx) => (
                    <tr key={doc._id || idx} className="hover:bg-purple-50/50 transition font-mono">
                      {headers.slice(0, 8).map((header) => {
                        const val = doc[header];
                        let renderedVal = '';
                        if (val === null || val === undefined) {
                          renderedVal = 'null';
                        } else if (typeof val === 'object') {
                          renderedVal = JSON.stringify(val);
                        } else {
                          renderedVal = String(val);
                        }

                        return (
                          <td key={header} className="p-3 max-w-[200px] truncate title-attr text-[11px]" title={renderedVal}>
                            {header === '_id' ? (
                              <span className="text-purple-700 font-bold">{renderedVal}</span>
                            ) : typeof val === 'boolean' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${val ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {renderedVal}
                              </span>
                            ) : (
                              renderedVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto shadow-inner">
              <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(filteredDocs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
