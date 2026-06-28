import { useState } from 'react';
import { analyzeApiDoc } from '../api';
import { Loader2, Link as LinkIcon, FileText, Code2 } from 'lucide-react';

const Dashboard = ({ setResults, setLoading, setError, loading }) => {
  const [url, setUrl] = useState('');
  const [useCase, setUseCase] = useState('');
  const [language, setLanguage] = useState('Java');

  const languages = ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Go'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !useCase) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await analyzeApiDoc(url, useCase, language);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Code2 size={20} />
        </div>
        Integration Setup
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <LinkIcon size={16} className="text-slate-500" />
            Documentation URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/docs"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            Use Case Description
          </label>
          <textarea
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="e.g., Fetch customer data and update profiles..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 resize-none h-28"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Target Language</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {languages.map(lang => (
              <button
                type="button"
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  language === lang 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 group"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing Magic...
            </>
          ) : (
            <>
              Generate Integration
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;
