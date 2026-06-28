import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ShieldCheck, 
  Server, 
  Download, 
  Copy, 
  CheckCircle2, 
  ChevronRight, 
  LayoutTemplate,
  Sliders,
  Cpu,
  Info,
  Clock,
  Compass,
  FileCode2,
  ChevronDown,
  Terminal,
  BookOpen,
  Code,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { analyzeApiDoc } from '../api';
import { useToast } from '../components/Toast';

const Results = ({ results, loading: initialLoading, error, hideExportButtons = false, onResultsUpdate }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('relevant'); // 'relevant' | 'additional'
  const [openEndpointIndex, setOpenEndpointIndex] = useState(null);
  const [endpointSubTab, setEndpointSubTab] = useState('request'); // 'request' | 'response' | 'params'
  
  // Monaco editor language selection
  const [selectedLang, setSelectedLang] = useState(results?.download_metadata?.language || 'Python');
  const [editorLoading, setEditorLoading] = useState(false);

  if (initialLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 shadow-md flex flex-col items-center justify-center min-h-[400px] text-center transition-all duration-300">
        <div className="w-12 h-12 relative mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 dark:border-blue-500 animate-spin"></div>
          <div className="absolute inset-2.5 rounded-full border-r-2 border-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider">Analyzing Documentation</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-xs leading-relaxed">Our AI is parsing payload schemas, evaluating authentication parameters, and compiling code wrappers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[250px] text-center transition-all duration-300">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3 text-rose-500 border border-rose-500/20">
          <ShieldAlert size={20} />
        </div>
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-1.5 uppercase tracking-wider">Analysis Failed</h3>
        <p className="text-rose-500/80 text-xs max-w-md">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white dark:bg-slate-900/20 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px] text-center transition-all">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 dark:text-slate-650 mb-4 shadow-sm">
          <LayoutTemplate className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-300 mb-1 uppercase tracking-wider">Awaiting Analysis</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed">Provide a documentation URL and specify your use-case context on the left to start compiling integrations.</p>
      </div>
    );
  }

  const {
    api_summary,
    auth_card,
    integration_recommendation,
    endpoints,
    generated_code,
    confidence_scores,
    download_metadata
  } = results;

  const relevantEndpoints = endpoints.filter(ep => ep.is_relevant).sort((a, b) => b.relevance_score - a.relevance_score);
  const additionalEndpoints = endpoints.filter(ep => !ep.is_relevant);

  // Supported languages for code generation tabs
  const languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'Go'];

  const handleCopy = () => {
    navigator.clipboard.writeText(generated_code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap = { Java: 'java', Python: 'py', JavaScript: 'js', TypeScript: 'ts', 'C#': 'cs', Go: 'go' };
    const extension = extMap[download_metadata.language] || 'txt';
    const blob = new Blob([generated_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ApiClient.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Integration client file downloaded!');
  };

  // Dynamic language regenerator for tab clicks
  const handleLanguageTabClick = async (lang) => {
    if (lang === selectedLang || editorLoading) return;
    setSelectedLang(lang);
    setEditorLoading(true);
    toast.info(`Regenerating wrapper client in ${lang}...`);
    try {
      // Re-run analyzeApiDoc with the new target language in background
      const docUrl = results.doc_url || '';
      const useCase = results.use_case || 'General integration client';
      const userId = results.user_id || null;
      
      const newResults = await analyzeApiDoc(docUrl, useCase, lang, userId);
      // Trigger update of state in parent component if callback provided
      if (onResultsUpdate) {
        onResultsUpdate(newResults);
      } else {
        // Fallback local update if no callback
        results.generated_code = newResults.generated_code;
        results.download_metadata = newResults.download_metadata;
      }
      toast.success(`${lang} wrapper compiled successfully!`);
    } catch (err) {
      toast.error(`Could not generate ${lang} wrapper.`);
    } finally {
      setEditorLoading(false);
    }
  };

  const getMethodColor = (method) => {
    switch(method.toUpperCase()) {
      case 'GET': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'POST': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25';
      case 'PUT': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'DELETE': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25';
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/25';
    }
  };

  // Collapsible Endpoint Mock content generator
  const getMockRequest = (ep) => {
    const cleanPath = ep.path || '/';
    return `curl -X ${ep.method || 'GET'} "https://api.example.com/v1${cleanPath}" \\\n  -H "Authorization: Bearer <token>" \\\n  -H "Content-Type: application/json"`;
  };

  const getMockResponse = (ep) => {
    return JSON.stringify({
      status: "success",
      endpoint: ep.path,
      method: ep.method,
      timestamp: new Date().toISOString(),
      data: {
        id: Math.floor(Math.random() * 900000) + 100000,
        type: ep.is_relevant ? "relevant_resource" : "metadata_resource",
        details: ep.description || "API payload parameters match correctly"
      }
    }, null, 2);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Metrics Row: API Summary & Confidence */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* API Summary Card */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <h3 className="text-xs font-bold text-purple-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass size={14} /> API Summary
          </h3>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{api_summary.api_name}</h2>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-700/60">
                Category: {api_summary.category}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Endpoints</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-200">{api_summary.total_endpoints}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Relevance Match</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-450">{api_summary.relevant_endpoints_count} Matches</span>
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recommended Integration</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{api_summary.recommended_method}</p>
            </div>
          </div>
        </div>

        {/* Confidence Scores Card */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sliders size={14} /> Confidence Metrics
          </h3>
          <div className="space-y-3.5">
            
            {[
              { label: 'Authentication Detection', val: confidence_scores.auth, color: 'from-blue-500 to-indigo-500' },
              { label: 'Endpoint Extraction', val: confidence_scores.endpoints, color: 'from-indigo-500 to-purple-500' },
              { label: 'Relevance Matching', val: confidence_scores.relevance, color: 'from-purple-500 to-pink-500' },
              { label: 'Wrapper Compiler Accuracy', val: confidence_scores.wrapper, color: 'from-emerald-500 to-teal-500' }
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span>{m.label}</span>
                  <span>{m.val}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${m.color} rounded-full`} 
                    style={{ width: `${m.val}%` }} 
                  />
                </div>
              </div>
            ))}
            
          </div>
        </div>

      </div>

      {/* Credentials & Insights Row */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Authentication Card */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} /> Authentication
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auth Scheme</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{auth_card.auth_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{auth_card.location || 'N/A'}</span>
            </div>
          </div>
          
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Required Params</span>
            <code className="text-[10px] font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-mono mt-1 inline-block">
              {auth_card.required_params || 'None'}
            </code>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Header Configuration Example</span>
            <code className="text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg font-mono block border border-slate-200 dark:border-slate-850 overflow-x-auto whitespace-nowrap">
              {auth_card.example || 'None'}
            </code>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/50 dark:border-slate-850 leading-relaxed">
            {auth_card.description || 'No authentication is required.'}
          </div>
        </div>

        {/* Integration Recommendation Card */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Server size={16} /> Technical Recommendation
          </h3>
          
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">HTTP Integration Library</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded uppercase">
                {integration_recommendation.best_library}
              </span>
              <span className="text-[10px] text-slate-400">recommended standard</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Official SDK Status</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              {integration_recommendation.sdk_exists}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Rationalization Context</span>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              {integration_recommendation.why_rest}
            </p>
          </div>
        </div>

      </div>

      {/* Endpoint Explorer & Accordions */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Accordion tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 px-4">
          <button 
            onClick={() => { setActiveTab('relevant'); setOpenEndpointIndex(null); }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'relevant' 
                ? 'text-purple-600 dark:text-blue-400 border-b-2 border-purple-500 dark:border-blue-500' 
                : 'text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Relevant Endpoints
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/10 dark:bg-blue-500/10 border border-purple-500/20 dark:border-blue-500/20 font-bold">
              {relevantEndpoints.length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('additional'); setOpenEndpointIndex(null); }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'additional' 
                ? 'text-slate-800 dark:text-slate-200 border-b-2 border-slate-400 dark:border-slate-650' 
                : 'text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Additional Endpoints
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-bold">
              {additionalEndpoints.length}
            </span>
          </button>
        </div>

        {/* Accordion Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          
          {(activeTab === 'relevant' ? relevantEndpoints : additionalEndpoints).length > 0 ? (
            (activeTab === 'relevant' ? relevantEndpoints : additionalEndpoints).map((ep, idx) => {
              const isOpened = openEndpointIndex === idx;
              return (
                <div key={idx} className="transition-colors duration-150">
                  
                  {/* Header row */}
                  <button
                    onClick={() => setOpenEndpointIndex(isOpened ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase shrink-0 ${getMethodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                      <div className="min-w-0">
                        <code className="text-xs font-bold text-slate-850 dark:text-slate-200 font-mono break-all block">{ep.path}</code>
                        {ep.description && <p className="text-[11px] text-slate-500 truncate mt-0.5">{ep.description}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {ep.is_relevant && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450">
                          {ep.relevance_score}% Match
                        </span>
                      )}
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${isOpened ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Collapsible content details */}
                  {isOpened && (
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 p-4 space-y-4 animate-in fade-in duration-200">
                      
                      {/* Inner subtabs bar */}
                      <div className="flex gap-2 border-b border-slate-200/60 dark:border-slate-850 pb-2">
                        {['request', 'response', 'params'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setEndpointSubTab(tab)}
                            className={`text-2xs font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors cursor-pointer ${
                              endpointSubTab === tab 
                                ? 'bg-purple-500/15 dark:bg-blue-500/15 border border-purple-500/20 dark:border-blue-500/20 text-purple-600 dark:text-blue-400' 
                                : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                            }`}
                          >
                            {tab === 'request' ? 'Sample Request' : tab === 'response' ? 'Sample Response' : 'Parameters'}
                          </button>
                        ))}
                      </div>

                      {/* Subtab content views */}
                      {endpointSubTab === 'request' && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Raw Curl Execution</span>
                          <pre className="font-mono bg-slate-900 dark:bg-slate-950 text-slate-300 p-3 rounded-lg text-[10px] overflow-x-auto border border-slate-200 dark:border-slate-850">
                            <code>{getMockRequest(ep)}</code>
                          </pre>
                        </div>
                      )}

                      {endpointSubTab === 'response' && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mock JSON Payload (200 OK)</span>
                          <pre className="font-mono bg-slate-900 dark:bg-slate-950 text-slate-300 p-3 rounded-lg text-[10px] overflow-x-auto border border-slate-200 dark:border-slate-850">
                            <code>{getMockResponse(ep)}</code>
                          </pre>
                        </div>
                      )}

                      {endpointSubTab === 'params' && (
                        <div className="text-2xs text-slate-500 dark:text-slate-400 space-y-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Parsed Parameters</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 block font-semibold">
                              {ep.parameters || 'No query or body parameters parsed.'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rate Limits</span>
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Standard 60 requests/min</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Required Headers</span>
                              <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">Content-Type: application/json</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No endpoints listed under this query tag.
            </div>
          )}

        </div>
      </div>

      {/* Code Editor Workspace */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl relative">
        
        {/* Editor Tabbed Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-2 gap-2">
          
          {/* Monaco-style language tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <div className="flex gap-1 shrink-0 mr-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageTabClick(lang)}
                disabled={editorLoading}
                className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedLang === lang 
                    ? 'bg-slate-900 border border-slate-800 text-blue-400 shadow-inner' 
                    : 'text-slate-500 hover:text-slate-350 border border-transparent'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!hideExportButtons && (
              <>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors text-2xs font-semibold cursor-pointer"
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/20 dark:bg-blue-600/20 hover:bg-purple-600/30 dark:hover:bg-blue-600/30 text-purple-400 dark:text-blue-400 border border-purple-500/20 dark:border-blue-500/20 hover:border-purple-500/30 dark:hover:border-blue-500/30 transition-colors text-2xs font-semibold cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Wrapper</span>
                </button>
              </>
            )}
          </div>

        </div>
        
        {/* Editor Body */}
        <div className="relative">
          {editorLoading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-center z-15">
              <Loader2 className="animate-spin text-purple-500 dark:text-blue-500 mb-2" size={24} />
              <p className="text-xs text-slate-400 font-semibold">Generating code client in {selectedLang}...</p>
            </div>
          )}
          
          <div className="p-4 text-xs font-mono overflow-auto max-h-[500px] custom-scrollbar bg-slate-950/50">
            <SyntaxHighlighter 
              language={selectedLang.toLowerCase()} 
              style={atomDark}
              customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
              wrapLines={true}
            >
              {generated_code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Editor Metadata Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-slate-900/60 border-t border-slate-900/80 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>Run: {download_metadata.generated_time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu size={11} />
              <span>Version: {download_metadata.wrapper_version}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-450">
            <Info size={11} className="text-purple-500 dark:text-blue-500" />
            <span>Target matching: {relevantEndpoints.length} active methods mapped</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Results;
