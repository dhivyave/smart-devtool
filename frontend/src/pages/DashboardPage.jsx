import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon, FileText, Code2, Loader2, 
  TrendingUp, Database, Globe, Clock, ArrowRight, 
  ChevronRight, Sparkles, Download, MessageSquare, BookOpen, Play, Rocket
} from 'lucide-react';
import { analyzeApiDoc, getHistory, getChatHistory } from '../api';
import { sampleAnalysis } from '../sampleAnalysis';
import { useToast } from '../components/Toast';
import { SkeletonStat } from '../components/SkeletonLoader';

const languages = ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Go'];

const langColors = {
  Java: 'text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  Python: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  JavaScript: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  TypeScript: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'C#': 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  Go: 'text-teal-500 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
};

const chartColors = {
  Java: '#f97316',
  Python: '#3b82f6',
  JavaScript: '#eab308',
  TypeScript: '#06b6d4',
  'C#': '#a855f7',
  Go: '#14b8a6',
  Default: '#64748b'
};

const DashboardPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const toast = useToast();

  const [url, setUrl] = useState('');
  const [useCase, setUseCase] = useState('');
  const [language, setLanguage] = useState('Python');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [chats, setChats] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [histData, chatData] = await Promise.all([
          getHistory(user?.id),
          getChatHistory(user?.id)
        ]);
        const demoHistory = localStorage.getItem('demo_history');
        const parsedDemoHistory = demoHistory ? JSON.parse(demoHistory) : [];
        setHistory([...parsedDemoHistory, ...(histData || [])]);
        setChats(chatData || []);
      } catch (err) {
        // Silently fail
      } finally {
        setHistoryLoading(false);
      }
    };
    if (user) fetchDashboardData();
  }, [user]);


  const handleTrySample = () => {
    setUrl(sampleAnalysis.url);
    setUseCase(sampleAnalysis.useCase);
    setLanguage(sampleAnalysis.language);

    toast.success(
      <div className="text-left">
        <p className="font-bold">✅ Sample data loaded successfully.</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Click 'Launch Analysis' to begin.</p>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !useCase) return;

    // Check if the inputs match the sample weather API details
    if (url === sampleAnalysis.url && useCase === sampleAnalysis.useCase) {
      setLoading(true);
      toast.info('Analyzing API documentation…');

      const demoItem = {
        id: sampleAnalysis.data.id,
        api_name: sampleAnalysis.data.api_summary.api_name,
        doc_url: sampleAnalysis.data.doc_url,
        auth_type: sampleAnalysis.data.auth_card.auth_type,
        use_case: sampleAnalysis.data.use_case,
        category: sampleAnalysis.data.api_summary.category,
        language: sampleAnalysis.data.download_metadata.language,
        date_analyzed: new Date().toISOString(),
        user_id: user?.id || 'demo-user'
      };

      const existing = localStorage.getItem('demo_history');
      let currentDemoList = existing ? JSON.parse(existing) : [];
      currentDemoList = currentDemoList.filter(item => item.id !== demoItem.id);
      currentDemoList.unshift(demoItem);
      localStorage.setItem('demo_history', JSON.stringify(currentDemoList));

      setTimeout(() => {
        setLoading(false);
        navigate(`/analysis/${sampleAnalysis.data.id}`, { state: { runLoadingSequence: true } });
      }, 1000);
      return;
    }

    setLoading(true);
    toast.info('Analyzing API documentation…');

    try {
      const data = await analyzeApiDoc(url, useCase, language, user?.id);
      toast.success(`Analysis complete — ${data.api_summary?.api_name}`);
      navigate(`/analysis/${data.id}`, { state: { results: data } });
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Analyses',
      value: history.length,
      icon: Database,
      color: 'text-blue-500 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'APIs Tracked',
      value: new Set(history.map(h => h.api_name)).size,
      icon: Globe,
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'AI Chat Prompts',
      value: chats.length,
      icon: MessageSquare,
      color: 'text-purple-500 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="page-enter p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-100">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            <span className="animate-wiggle">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build production wrappers, check integrations, and manage API configurations.
          </p>
        </div>
        
        {/* Quick actions box */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <MessageSquare size={13} className="text-purple-500" />
            Chat Assistant
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 dark:bg-blue-500/10 border border-purple-200 dark:border-blue-500/20 text-purple-700 dark:text-blue-400 text-xs font-semibold rounded-xl transition-all hover:bg-purple-100 dark:hover:bg-blue-500/20"
          >
            <Clock size={13} />
            History Log
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {historyLoading
          ? [1, 2, 3].map(i => <SkeletonStat key={i} />)
          : stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 8px 10px -6px rgba(124, 58, 237, 0.1)' }}
              className={`bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-blue-500/5" />
              <div className="relative z-10">
                <div className={`inline-flex p-2 rounded-xl ${stat.bg} border ${stat.border} mb-3 text-slate-700`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Main Grid: Form Left, Guide Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Side: Form Setup */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-sm font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-wider">
              <div className="p-2 bg-purple-50 dark:bg-blue-500/10 border border-purple-200 dark:border-blue-500/20 rounded-lg text-purple-600 dark:text-blue-400">
                <Sparkles size={14} />
              </div>
              Launch Integration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <LinkIcon size={12} className="text-slate-400" />
                  Documentation URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/docs"
                  className="w-full bg-purple-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-blue-500/30 focus:border-purple-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Use Case */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText size={12} className="text-slate-400" />
                  Integration Use Case
                </label>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Describe your goals (e.g. create subscription billing, fetch accounts)..."
                  className="w-full bg-purple-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-blue-500/30 focus:border-purple-500 dark:focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none h-24"
                  required
                />
              </div>

              {/* Languages */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Environment</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {languages.map(lang => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-2 py-2 rounded-xl text-2xs font-bold border transition-all duration-150 ${
                        language === lang
                          ? langColors[lang] || 'bg-blue-500/20 border-blue-500/40 text-blue-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-800 dark:hover:text-slate-250'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 dark:from-blue-600 dark:to-indigo-600 hover:from-purple-500 hover:to-purple-400 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-purple-500/25 dark:hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing Docs...
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current" />
                      Launch Analysis
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="relative group/tooltip">
                  <button
                    type="button"
                    onClick={handleTrySample}
                    disabled={loading}
                    className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 hover:border-purple-500/55 dark:hover:border-purple-500/55 text-purple-700 dark:text-slate-100 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer hover:bg-purple-50 dark:hover:bg-gradient-to-r hover:-translate-y-0.5"
                  >
                    <Rocket size={14} className="text-purple-500 dark:text-purple-400 animate-pulse" />
                    <span>🧪 Try Sample Analysis</span>
                  </button>
                  <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity text-center font-medium">
                    Load a real API example in the inputs for review.
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Quick Start Guide */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-purple-500 dark:text-blue-500" />
                Quick Start Guide
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-2xs mt-1.5">Follow these simple steps to analyze and generate your API integration client wrappers.</p>
            </div>

            <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800/80 space-y-6 py-1 flex-1 mt-4">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-500/10 dark:bg-blue-500/10 border-2 border-purple-500 dark:border-blue-500 flex items-center justify-center transition-all group-hover:scale-110">
                  <span className="w-1.5 h-1.5 bg-purple-500 dark:bg-blue-500 rounded-full" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 dark:bg-blue-500/10 text-purple-600 dark:text-blue-400 font-extrabold uppercase">Step 01</span>
                    Provide Documentation URL
                  </h4>
                  <p className="text-2xs text-slate-550 dark:text-slate-400 leading-relaxed">
                    Submit a public API portal URL, reference sheet link, or direct Swagger/OpenAPI documentation page.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center transition-all group-hover:scale-110">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold uppercase">Step 02</span>
                    Describe Your Use Case
                  </h4>
                  <p className="text-2xs text-slate-555 dark:text-slate-400 leading-relaxed">
                    Specify the features you want to integrate (e.g. "fetch weather reports", "create subscription billing"). This instructs the AI on which endpoints are relevant.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center transition-all group-hover:scale-110">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Step 03</span>
                    Generate & Export Wrapper
                  </h4>
                  <p className="text-2xs text-slate-555 dark:text-slate-400 leading-relaxed">
                    Wait for the AI assistant to parse the layouts, identify security layers, map endpoints, and output a clean, production-ready environment wrapper module.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
