import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Search, Trash2, Eye, FileText,
  Download, RefreshCw, Filter, ChevronLeft,
  ChevronRight, Globe, Calendar, Code2, X,
  Copy, CheckSquare, Square, Columns, Star, ArrowUpDown
} from 'lucide-react';
import { getHistory, deleteAnalysis, exportText, downloadTextFile, analyzeApiDoc } from '../api';
import { useToast } from '../components/Toast';
import { SkeletonHistoryRow } from '../components/SkeletonLoader';

const ITEMS_PER_PAGE = 10;

const langColors = {
  Java: 'text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  Python: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  JavaScript: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  TypeScript: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'C#': 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  Go: 'text-teal-500 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
  Unknown: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700/60',
};

const HistoryPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const toast = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced features state
  const [sortField, setSortField] = useState('date'); // 'date' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorite_apis');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(user?.id);
      const demoHistory = localStorage.getItem('demo_history');
      const parsedDemoHistory = demoHistory ? JSON.parse(demoHistory) : [];
      setHistory([...parsedDemoHistory, ...(data || [])]);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const languages = useMemo(() => {
    const langs = [...new Set(history.map(h => h.language))].filter(Boolean);
    return ['All', ...langs];
  }, [history]);

  // Favorite toggle
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(fid => fid !== id);
      toast.info('Removed from favorites.');
    } else {
      updated = [...favorites, id];
      toast.success('Added to favorites!');
    }
    setFavorites(updated);
    localStorage.setItem('favorite_apis', JSON.stringify(updated));
  };

  // Compare selection toggle
  const toggleComparisonSelect = (item, e) => {
    e.stopPropagation();
    if (selectedForComparison.some(s => s.id === item.id)) {
      setSelectedForComparison(prev => prev.filter(s => s.id !== item.id));
    } else {
      if (selectedForComparison.length >= 2) {
        toast.warning('You can compare a maximum of 2 APIs at once.');
        return;
      }
      setSelectedForComparison(prev => [...prev, item]);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const now = Date.now();
    let result = history.filter(item => {
      const matchSearch = !searchQuery ||
        item.api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.doc_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.use_case || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchLang = langFilter === 'All' || item.language === langFilter;
      
      const itemDate = new Date(item.date_analyzed).getTime();
      const matchDate =
        dateFilter === 'all' ? true :
        dateFilter === '7d' ? now - itemDate <= 7 * 86400000 :
        dateFilter === '30d' ? now - itemDate <= 30 * 86400000 :
        dateFilter === 'favorites' ? favorites.includes(item.id) : true;
      
      return matchSearch && matchLang && matchDate;
    });

    // Sort
    result.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.api_name.toLowerCase();
        const nameB = b.api_name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        const dateA = new Date(a.date_analyzed).getTime();
        const dateB = new Date(b.date_analyzed).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    return result;
  }, [history, searchQuery, langFilter, dateFilter, sortField, sortOrder, favorites]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginated = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [searchQuery, langFilter, dateFilter, sortField, sortOrder]);

  // Gmail-style soft delete with Undo option
  const handleDelete = async (id, apiName) => {
    setDeleting(id);
    const targetItem = history.find(h => h.id === id);
    
    if (id === 'demo-openweather') {
      localStorage.removeItem('demo_history');
      setHistory(prev => prev.filter(h => h.id !== id));
      setSelectedForComparison(prev => prev.filter(s => s.id !== id));
      toast.info(`Deleted demo "${apiName}"`);
      setDeleting(null);
      return;
    }
    
    try {
      await deleteAnalysis(id);
      
      // Store in recentlyDeleted cache for possible undo
      setRecentlyDeleted(targetItem);
      setHistory(prev => prev.filter(h => h.id !== id));
      setSelectedForComparison(prev => prev.filter(s => s.id !== id));

      toast.custom((t) => (
        <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-lg">
          <span className="text-xs text-white">Deleted "{apiName}"</span>
          <button
            onClick={() => handleRestoreDeleted(targetItem)}
            className="text-xs font-bold text-purple-400 dark:text-blue-400 hover:text-purple-300 dark:hover:text-blue-300 uppercase tracking-wider cursor-pointer"
          >
            Undo
          </button>
        </div>
      ), { duration: 5000 });

    } catch {
      toast.error('Failed to delete analysis.');
    } finally {
      setDeleting(null);
    }
  };

  const handleRestoreDeleted = async (item) => {
    if (!item) return;
    toast.info(`Restoring ${item.api_name}...`);
    try {
      // Re-submit scrape backend analyze parameters to restore it!
      const data = await analyzeApiDoc(item.doc_url, item.use_case || 'Restored Analysis', item.language, user?.id);
      setHistory(prev => [data, ...prev]);
      setRecentlyDeleted(null);
      toast.success(`Restored "${item.api_name}"!`);
    } catch {
      toast.error('Could not restore analysis.');
    }
  };

  const handleDownloadTXT = async (id, e) => {
    e.stopPropagation();
    if (id === 'demo-openweather') {
      import('../sampleAnalysis').then(({ sampleAnalysis }) => {
        const results = sampleAnalysis.data;
        const content = `Smart DevTool — API Analysis Report
Generated: ${results.download_metadata.generated_time}
----------------------------------------
API Name: ${results.api_summary.api_name}
Category: ${results.api_summary.category}
Total Endpoints: ${results.api_summary.total_endpoints}
Relevant Endpoints: ${results.api_summary.relevant_endpoints_count}
Recommended Language: Python
Confidence: 96%

Authentication:
Type: ${results.auth_card.auth_type}
Location: ${results.auth_card.location}
Required Params: ${results.auth_card.required_params}
Example: ${results.auth_card.example}
Description: ${results.auth_card.description}

Relevant Endpoints:
${results.endpoints.filter(ep => ep.is_relevant).map(ep => `- ${ep.method} ${ep.path}: ${ep.description}`).join('\n')}

Generated Python Wrapper Client Code:
${results.generated_code}
`;
        downloadTextFile(content, 'openweather_api_report.txt');
        toast.success('Text report downloaded!');
      });
      return;
    }
    setExporting(id);
    try {
      const data = await exportText(id);
      downloadTextFile(data.content, data.filename);
      toast.success('Text report downloaded!');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(null);
    }
  };

  const handleRegenerate = async (item, e) => {
    e.stopPropagation();
    if (item.id === 'demo-openweather') {
      toast.info('Demo analysis cannot be duplicated.');
      return;
    }
    setRegenerating(item.id);
    toast.info(`Re-analyzing ${item.api_name}…`);
    try {
      const data = await analyzeApiDoc(item.doc_url, item.use_case || 'General integration', item.language, user?.id);
      toast.success('Re-analysis complete!');
      setHistory(prev => prev.map(h => h.id === item.id ? data : h));
      navigate(`/analysis/${data.id}`, { state: { results: data } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Re-analysis failed.');
    } finally {
      setRegenerating(null);
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="page-enter p-6 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History size={22} className="text-slate-400" />
            Analysis History Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {filteredAndSorted.length} matching of {history.length} total analyses.
          </p>
        </div>
        
        {/* Bulk action buttons */}
        <div className="flex items-center gap-2">
          {selectedForComparison.length === 2 && (
            <button
              onClick={() => setShowComparisonModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 dark:from-blue-600 dark:to-indigo-600 hover:from-purple-500 hover:to-purple-400 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer animate-pulse"
            >
              <Columns size={13} />
              Compare ({selectedForComparison.length})
            </button>
          )}
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl transition-all"
          >
            <RefreshCw size={13} />
            Sync
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search API name, url parameter, or use cases..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-blue-500/20 focus:border-purple-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-450"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-650 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-blue-500/20"
          >
            <option value="All">All Environments</option>
            {languages.filter(l => l !== 'All').map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-650 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-blue-500/20"
          >
            <option value="all">All Dates</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="favorites">Starred Only</option>
          </select>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        
        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-450 dark:text-slate-600 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/20">
          <div className="col-span-1 flex items-center gap-2">
            <span className="w-4 shrink-0" />
            <span>Star</span>
          </div>
          <div className="col-span-4 cursor-pointer flex items-center gap-1 hover:text-slate-700 dark:hover:text-white" onClick={() => toggleSort('name')}>
            <span>API Resource</span>
            <ArrowUpDown size={11} className="text-slate-400" />
          </div>
          <div className="col-span-3 hidden md:block">Documentation Link</div>
          <div className="col-span-2 hidden sm:block">Environment</div>
          <div className="col-span-1 cursor-pointer hidden lg:flex items-center gap-1 hover:text-slate-700 dark:hover:text-white" onClick={() => toggleSort('date')}>
            <span>Date Mapped</span>
            <ArrowUpDown size={11} className="text-slate-400" />
          </div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {[1, 2, 3, 4, 5].map(i => <SkeletonHistoryRow key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-16 text-center">
            <History size={32} className="mx-auto text-slate-350 dark:text-slate-700 mb-3" />
            <p className="text-xs font-medium text-slate-500">
              No matching analyses found in records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paginated.map(item => {
              const isFav = favorites.includes(item.id);
              const isSelected = selectedForComparison.some(s => s.id === item.id);
              
              return (
                <div 
                  key={item.id} 
                  className={`grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all items-center ${
                    isSelected ? 'bg-purple-50/30 dark:bg-blue-950/10 border-l-[3px] border-l-purple-500 dark:border-l-transparent' : 'border-l-[3px] border-l-transparent'
                  }`}
                >
                  
                  {/* Star & Comparison Selection */}
                  <div className="col-span-1 flex items-center gap-2">
                    <button 
                      onClick={(e) => toggleComparisonSelect(item, e)}
                      className="text-slate-450 hover:text-blue-500 cursor-pointer shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare size={14} className="text-purple-600 dark:text-blue-400" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                    <button 
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={`cursor-pointer shrink-0 ${isFav ? 'text-amber-500' : 'text-slate-350 hover:text-amber-500'}`}
                    >
                      <Star size={14} className={isFav ? 'fill-current' : ''} />
                    </button>
                  </div>

                  {/* API details */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-blue-500/10 border border-purple-200 dark:border-blue-500/30 flex items-center justify-center shrink-0">
                        <Globe size={13} className="text-purple-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{item.api_name}</p>
                        <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{item.category}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doc link */}
                  <div className="col-span-3 hidden md:block min-w-0">
                    <a
                      href={item.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-600/80 dark:text-blue-400/70 hover:underline truncate block"
                    >
                      {item.doc_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>

                  {/* Target language */}
                  <div className="col-span-2 hidden sm:block">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${langColors[item.language] || langColors.Unknown}`}>
                      {item.language}
                    </span>
                  </div>

                  {/* Mapped Date */}
                  <div className="col-span-1 hidden lg:block">
                    <p className="text-[11px] text-slate-550 dark:text-slate-450 font-medium">{formatDate(item.date_analyzed)}</p>
                  </div>

                  {/* Actions buttons */}
                  <div className="col-span-1 flex items-center justify-end gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/analysis/${item.id}`)}
                      title="View Client"
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-purple-600 dark:hover:text-blue-400 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDownloadTXT(item.id, e)}
                      disabled={exporting === item.id}
                      title="Download TXT"
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-450 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      <FileText size={12} />
                    </button>
                    <button
                      onClick={(e) => handleRegenerate(item, e)}
                      disabled={regenerating === item.id}
                      title="Duplicate Analysis"
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-500 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      <RefreshCw size={12} className={regenerating === item.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.api_name)}
                      disabled={deleting === item.id}
                      title="Delete Record"
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <p>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length} logs
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── SIDE-BY-SIDE COMPARISON MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showComparisonModal && selectedForComparison.length === 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComparisonModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col relative z-50 text-xs"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Columns size={16} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Side-by-Side Comparison</h3>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1 rounded-lg text-slate-450 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid content columns */}
              <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/80 custom-scrollbar">
                
                {/* Column 1 */}
                <div className="space-y-4 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 dark:bg-blue-500 shrink-0 animate-pulse" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{selectedForComparison[0].api_name}</h4>
                  </div>
                  <div className="space-y-2 leading-relaxed text-slate-650 dark:text-slate-400">
                    <p><strong>Url:</strong> <a href={selectedForComparison[0].doc_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">{selectedForComparison[0].doc_url}</a></p>
                    <p><strong>Category:</strong> {selectedForComparison[0].category}</p>
                    <p><strong>Authentication:</strong> {selectedForComparison[0].auth_type}</p>
                    <p><strong>Environment Language:</strong> {selectedForComparison[0].language}</p>
                    <p><strong>Use Case Context:</strong> {selectedForComparison[0].use_case}</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4 pt-4 md:pt-0 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{selectedForComparison[1].api_name}</h4>
                  </div>
                  <div className="space-y-2 leading-relaxed text-slate-650 dark:text-slate-400">
                    <p><strong>Url:</strong> <a href={selectedForComparison[1].doc_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">{selectedForComparison[1].doc_url}</a></p>
                    <p><strong>Category:</strong> {selectedForComparison[1].category}</p>
                    <p><strong>Authentication:</strong> {selectedForComparison[1].auth_type}</p>
                    <p><strong>Environment Language:</strong> {selectedForComparison[1].language}</p>
                    <p><strong>Use Case Context:</strong> {selectedForComparison[1].use_case}</p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 flex justify-end">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-805 hover:bg-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HistoryPage;
