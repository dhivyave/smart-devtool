import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  Download, FileText, Copy, CheckCircle2, 
  ArrowLeft, FileCode, RefreshCw, Share2,
  Sparkles, ChevronDown, ChevronUp, Bot
} from 'lucide-react';
import { getAnalysis, exportText, downloadTextFile } from '../api';
import { useToast } from '../components/Toast';
import { SkeletonAnalysis } from '../components/SkeletonLoader';
import Results from '../components/Results';
import jsPDF from 'jspdf';

const AnalysisPage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const toast = useToast();

  const [results, setResults] = useState(state?.results || null);
  const [loading, setLoading] = useState(!state?.results);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [demoLoadingStep, setDemoLoadingStep] = useState(0);

  const isDemo = id === 'demo-openweather';
  const loadingSteps = [
    "Reading Documentation...",
    "Detecting Authentication...",
    "Extracting Endpoints...",
    "Generating Wrapper...",
    "Building Report...",
    "Preparing AI Insights..."
  ];

  useEffect(() => {
    if (isDemo) {
      if (state?.runLoadingSequence) {
        setLoading(true);
        setDemoLoadingStep(0);
        
        const interval = setInterval(() => {
          setDemoLoadingStep(prev => {
            if (prev >= loadingSteps.length - 1) {
              clearInterval(interval);
              import('../sampleAnalysis').then(({ sampleAnalysis }) => {
                setResults(sampleAnalysis.data);
                setLoading(false);
                toast.success(
                  <div className="text-left">
                    <p className="font-bold">🎉 Demo Analysis Completed Successfully!</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Explore the generated wrapper, export the report, or ask the AI Assistant questions.</p>
                  </div>
                );
              });
              return prev;
            }
            return prev + 1;
          });
        }, 900);
        
        return () => clearInterval(interval);
      } else {
        import('../sampleAnalysis').then(({ sampleAnalysis }) => {
          setResults(sampleAnalysis.data);
          setLoading(false);
        });
      }
    } else if (!results && id) {
      setLoading(true);
      getAnalysis(id)
        .then(data => setResults(data))
        .catch(err => setError(err.response?.data?.detail || 'Failed to load analysis'))
        .finally(() => setLoading(false));
    }
  }, [id, state?.runLoadingSequence]);

  const handleDownloadPDF = () => {
    if (!results) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { api_summary, auth_card, integration_recommendation, endpoints, generated_code, download_metadata } = results;

    const relevant = endpoints?.filter(ep => ep.is_relevant) || [];
    let y = 20;
    const pageH = doc.internal.pageSize.height;
    const margin = 20;
    const maxW = 170;

    const checkNewPage = (needed = 10) => {
      if (y + needed > pageH - 15) {
        doc.addPage();
        y = 20;
      }
    };

    const addSection = (title, color = [59, 130, 246]) => {
      checkNewPage(14);
      doc.setFillColor(...color);
      doc.rect(margin, y, maxW, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 3, y + 5);
      doc.setTextColor(30, 30, 30);
      y += 11;
    };

    const addText = (label, value, bold = false) => {
      checkNewPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(20, 20, 20);
      const lines = doc.splitTextToSize(String(value || 'N/A'), maxW - 40);
      doc.text(lines, margin + 45, y);
      y += Math.max(6, lines.length * 5);
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart DevTool — API Analysis Report', margin, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${download_metadata?.generated_time || new Date().toUTCString()}`, margin, 22);
    y = 40;

    // API Summary
    addSection('API SUMMARY', [59, 130, 246]);
    addText('API Name', api_summary?.api_name, true);
    addText('Category', api_summary?.category);
    addText('Total Endpoints', api_summary?.total_endpoints);
    addText('Relevant Endpoints', api_summary?.relevant_endpoints_count);
    addText('Recommendation', api_summary?.recommended_method);
    y += 4;

    // Authentication
    addSection('AUTHENTICATION', [16, 185, 129]);
    addText('Auth Type', auth_card?.auth_type, true);
    addText('Location', auth_card?.location);
    addText('Required Params', auth_card?.required_params);
    addText('Example', auth_card?.example);
    addText('Description', auth_card?.description);
    y += 4;

    // Integration
    addSection('INTEGRATION RECOMMENDATION', [99, 102, 241]);
    addText('Best Library', integration_recommendation?.best_library, true);
    addText('SDK Status', integration_recommendation?.sdk_exists);
    addText('Why REST', integration_recommendation?.why_rest);
    y += 4;

    // Endpoints
    addSection('RELEVANT ENDPOINTS', [245, 158, 11]);
    relevant.forEach(ep => {
      checkNewPage(8);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(`${ep.method}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      const pathLines = doc.splitTextToSize(ep.path, maxW - 20);
      doc.text(pathLines, margin + 15, y);
      y += Math.max(6, pathLines.length * 5);
      if (ep.description) {
        doc.setTextColor(80, 80, 80);
        const descLines = doc.splitTextToSize(ep.description, maxW - 5);
        doc.text(descLines, margin + 5, y);
        y += Math.max(5, descLines.length * 4.5);
      }
    });

    // Wrapper Code
    if (generated_code) {
      addSection(`GENERATED WRAPPER (${download_metadata?.language})`, [139, 92, 246]);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);
      const codeLines = generated_code.split('\n').slice(0, 60);
      codeLines.forEach(line => {
        checkNewPage(5);
        const wrapped = doc.splitTextToSize(line || ' ', maxW);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 4;
      });
      if (generated_code.split('\n').length > 60) {
        checkNewPage(5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text('... (truncated in PDF — download the wrapper file for full code)', margin, y);
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Smart DevTool | Page ${i} of ${pageCount}`, margin, pageH - 8);
    }

    doc.save(`${api_summary?.api_name?.replace(/\s+/g, '_') || 'analysis'}_report.pdf`);
    toast.success('PDF downloaded!');
  };

  const handleDownloadTXT = async () => {
    if (!id) return;
    if (isDemo) {
      const content = `Smart DevTool — API Analysis Report
Generated: ${results?.download_metadata?.generated_time || new Date().toUTCString()}
----------------------------------------
API Name: ${results?.api_summary?.api_name}
Category: ${results?.api_summary?.category}
Total Endpoints: ${results?.api_summary?.total_endpoints}
Relevant Endpoints: ${results?.api_summary?.relevant_endpoints_count}
Recommended Language: Python
Confidence: 96%

Authentication:
Type: ${results?.auth_card?.auth_type}
Location: ${results?.auth_card?.location}
Required Params: ${results?.auth_card?.required_params}
Example: ${results?.auth_card?.example}
Description: ${results?.auth_card?.description}

Relevant Endpoints:
${results?.endpoints?.filter(ep => ep.is_relevant).map(ep => `- ${ep.method} ${ep.path}: ${ep.description}`).join('\n')}

Generated Python Wrapper Client Code:
${results?.generated_code}
`;
      downloadTextFile(content, 'openweather_api_report.txt');
      toast.success('Text report downloaded!');
      return;
    }
    setExporting(true);
    try {
      const data = await exportText(parseInt(id));
      downloadTextFile(data.content, data.filename);
      toast.success('Text report downloaded!');
    } catch {
      toast.error('Failed to export text report.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyWrapper = () => {
    if (!results?.generated_code) return;
    navigator.clipboard.writeText(results.generated_code);
    setCopied(true);
    toast.success('Wrapper code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWrapper = () => {
    if (!results?.generated_code) return;
    const extMap = { Java: 'java', Python: 'py', JavaScript: 'js', TypeScript: 'ts', 'C#': 'cs', Go: 'go' };
    const lang = results.download_metadata?.language;
    const ext = extMap[lang] || 'txt';
    const blob = new Blob([results.generated_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ApiClient.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Wrapper downloaded!');
  };

  return (
    <div className="page-enter p-6 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading ? 'Loading Analysis…' : results?.api_summary?.api_name || 'Analysis'}
            </h1>
            {results && (
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {results.download_metadata?.language} · {results.download_metadata?.generated_time}
              </p>
            )}
          </div>
        </div>

        {/* Export Toolbar */}
        {results && !loading && (
          <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            <button
              onClick={handleCopyWrapper}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            >
              {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Wrapper'}</span>
            </button>
            <button
              onClick={handleDownloadWrapper}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            >
              <FileCode size={13} />
              <span>Download Wrapper</span>
            </button>
            <button
              onClick={handleDownloadTXT}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
            >
              <FileText size={13} />
              <span>Download TXT</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-blue-500/10 border border-purple-200 dark:border-blue-500/25 text-purple-700 dark:text-blue-400 hover:bg-purple-100 dark:hover:bg-blue-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Results */}
      {loading ? (
        isDemo && state?.runLoadingSequence ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg mx-auto shadow-xl flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 relative mb-6">
              <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 dark:border-blue-500 animate-spin"></div>
              <div className="absolute inset-2.5 rounded-full border-r-2 border-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
            </div>
            
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Analyzing Sample Documentation</h3>
            
            <div className="w-full space-y-4 max-w-xs">
              {loadingSteps.map((step, idx) => {
                const isCompleted = demoLoadingStep > idx;
                const isCurrent = demoLoadingStep === idx;
                
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        <span className="w-2.5 h-2.5 bg-purple-500 dark:bg-blue-500 rounded-full animate-ping" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-700 shrink-0" />
                    )}
                    
                    <span className={`font-semibold ${
                      isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' :
                      isCurrent ? 'text-purple-600 dark:text-blue-450 font-bold' :
                      'text-slate-400 dark:text-slate-600'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <SkeletonAnalysis />
        )
      ) : error ? (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-10 text-center">
          <p className="text-rose-600 dark:text-rose-400 font-bold">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 underline uppercase tracking-wider cursor-pointer">
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          <Results 
            results={results} 
            loading={false} 
            error={null} 
            hideExportButtons 
            onResultsUpdate={(newData) => setResults(newData)} 
          />
          
          {/* AI Suggestions CTA */}
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">Consult AI Integration Assistant</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore query structures, security audits, and deployment guides with preloaded context.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/assistant', { state: { context: results } })}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer"
            >
              <Sparkles size={13} />
              Open Chat
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage;
