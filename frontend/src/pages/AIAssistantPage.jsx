import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Trash2, Sparkles, User,
  ChevronDown, Loader2, MessageSquare, 
  Zap, Globe, Code2, ShieldCheck, HelpCircle,
  Copy, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api';
import { useToast } from '../components/Toast';

const QUICK_PROMPTS = [
  { icon: ShieldCheck, label: 'Explain authentication', message: 'Explain the authentication method for this API in detail. How do I set up the credentials?' },
  { icon: Globe, label: 'Which endpoint to use?', message: 'Which endpoint should I use for my use case? Explain why and show an example.' },
  { icon: Code2, label: 'Generate Python wrapper', message: 'Generate a clean Python wrapper class for this API using the requests library.' },
  { icon: Zap, label: 'Show sample request', message: 'Show me a sample API request with all required headers and parameters.' },
  { icon: MessageSquare, label: 'Show sample response', message: 'Show me an example API response and explain the key fields.' },
  { icon: HelpCircle, label: 'Best integration practices', message: 'What are the best practices for integrating this API into a production application?' }
];

const DEMO_QUICK_PROMPTS = [
  { icon: ShieldCheck, label: 'Explain authentication', message: 'Explain the authentication method for the OpenWeather API in detail. How do I set up the credentials?' },
  { icon: Code2, label: 'Generate Java Wrapper', message: 'Generate a clean Java wrapper client class for the OpenWeather API.' },
  { icon: Zap, label: 'Show sample request', message: 'Show me a sample API request for OpenWeather API with the required appid parameter.' },
  { icon: HelpCircle, label: 'How do I call the forecast endpoint?', message: 'How do I call the 5-day forecast endpoint using the Python wrapper?' },
  { icon: MessageSquare, label: 'What are the required parameters?', message: 'What are the required and optional query parameters for the OpenWeather API endpoints?' }
];

const MessageBubble = ({ msg }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3.5 ${isAssistant ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
        ${isAssistant
          ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
          : 'bg-gradient-to-br from-blue-500 to-cyan-600'
        }`}
      >
        {isAssistant ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
      </div>

      {/* Bubble text */}
      <div className={`max-w-[78%] group relative ${isAssistant ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-2xs border
          ${isAssistant
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
            : 'bg-blue-600 border-blue-600 text-white rounded-tr-none'
          }`}
        >
          {isAssistant ? (
            <div className="markdown-content prose prose-slate dark:prose-invert prose-sm max-w-none text-xs">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}

          {isAssistant && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 cursor-pointer"
            >
              {copied ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Copy size={11} />}
            </button>
          )}
        </div>
        
        {msg.time && (
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1 px-1">
            {msg.time}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const AIAssistantPage = () => {
  const { user } = useUser();
  const { state } = useLocation();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [context, setContext] = useState(state?.context || null);

  const isDemo = context?.id === 'demo-openweather' || context?.api_name === 'OpenWeather API';
  const activePrompts = isDemo ? DEMO_QUICK_PROMPTS : QUICK_PROMPTS;
  
  // Chat sidebar list (ChatGPT Style)
  const [chatSessions, setChatSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      try {
        const hist = await getChatHistory(user?.id);
        if (hist && hist.length > 0) {
          const formatted = hist.map(m => ({
            ...m,
            time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formatted);
          setShowQuickPrompts(false);

          // Build a mock list of chat topics in sidebar
          const userMsgs = hist.filter(m => m.role === 'user');
          const topics = userMsgs.slice(-5).map(m => ({
            id: m.id,
            title: m.content.slice(0, 24) + (m.content.length > 24 ? '...' : '')
          })).reverse();
          setChatSessions(topics);
        }
      } catch {
        // fail silently
      } finally {
        setSessionsLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const buildContext = () => {
    if (!context) return null;
    return {
      api_name: context.api_summary?.api_name,
      category: context.api_summary?.category,
      auth_type: context.auth_card?.auth_type,
      auth_description: context.auth_card?.description,
      use_case: context.download_metadata?.language ? `${context.api_summary?.recommended_method} — ${context.download_metadata?.language}` : '',
      endpoints: context.endpoints?.filter(e => e.is_relevant).slice(0, 10).map(e => ({
        method: e.method,
        path: e.path,
        description: e.description
      })),
      language: context.download_metadata?.language,
      recommendation: context.integration_recommendation?.recommendation_summary,
    };
  };

  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || thinking) return;
    setInput('');
    setShowQuickPrompts(false);

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: text, time: now };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      let reply;
      if (isDemo) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('explain authentication') || lowerText.includes('auth')) {
          reply = `The **OpenWeather API** uses an **API Key** authentication scheme (referred to as \`appid\`).

### Key details:
1. **Parameter Name:** \`appid\`
2. **Location:** Query parameter (e.g., \`https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY\`)
3. **Setup:** 
   - Sign up at [openweathermap.org](https://openweathermap.org/) to obtain your API key.
   - Use environment variables to store this key securely (e.g., \`OPENWEATHER_API_KEY\`).
   - In our generated Python wrapper, the key is passed to the constructor and automatically appended to every outgoing request.`;
        } else if (lowerText.includes('java wrapper') || lowerText.includes('java')) {
          reply = `Here is a production-ready Java wrapper client for the **OpenWeather API** using the standard \`java.net.http.HttpClient\`:

\`\`\`java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class OpenWeatherClient {
    private final String apiKey;
    private final String baseUrl = "https://api.openweathermap.org/data/2.5";
    private final HttpClient httpClient;

    public OpenWeatherClient(String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getCurrentWeather(String city) throws Exception {
        String url = String.format("%s/weather?q=%s&appid=%s", baseUrl, city, apiKey);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("API error: Code " + response.statusCode());
        }
        return response.body();
    }

    public String getFiveDayForecast(String city) throws Exception {
        String url = String.format("%s/forecast?q=%s&appid=%s", baseUrl, city, apiKey);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
\`\`\``;
        } else if (lowerText.includes('sample request') || lowerText.includes('sample')) {
          reply = `Here is a sample cURL request to fetch the current weather in London using the OpenWeather API:

\`\`\`bash
curl -X GET "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY&units=metric" \\
  -H "Content-Type: application/json"
\`\`\`

### Parameters used:
* \`q\`: City name (\`London\`)
* \`appid\`: Your unique API Key
* \`units\`: \`metric\` (to return temperature in Celsius rather than Kelvin)`;
        } else if (lowerText.includes('forecast') || lowerText.includes('call the forecast')) {
          reply = `To call the 5-day forecast endpoint using the generated Python wrapper:

\`\`\`python
from ApiClient import ApiClient

# Initialize the client with your key
client = ApiClient(api_key="your_api_key_here")

# Fetch 5-day forecast for London
forecast_data = client.get_forecast(city="London")
print(forecast_data)
\`\`\`

Under the hood, the client sends a GET request to \`/data/2.5/forecast\` appending \`q=London\` and the \`appid\` query parameter.`;
        } else if (lowerText.includes('parameters') || lowerText.includes('required')) {
          reply = `Here are the key parameters for the most common OpenWeather API endpoints:

1. **Current Weather (\`/weather\`):**
   - \`appid\` (Required, String): Your unique API key.
   - \`q\` (Optional, String): City name (e.g., \`London\`).
   - \`lat\`, \`lon\` (Optional, Float): Geographic coordinates (highly recommended for precision).
   - \`units\` (Optional, String): Temperature units (\`metric\`, \`imperial\`, or default \`standard\`).

2. **5-Day Forecast (\`/forecast\`):**
   - Inherits the exact same parameters as the Current Weather endpoint (\`appid\`, \`q\`, \`lat\`, \`lon\`, \`units\`).`;
        } else {
          reply = `I am currently running in **Demo Mode** for the **OpenWeather API**.
Here is what you can ask me:
- **Explain authentication**: See details about query parameter auth.
- **Generate Java Wrapper**: View a sample Java implementation.
- **Show sample request**: See a cURL example.
- **How do I call the forecast endpoint?**: Code example using the wrapper.
- **What are the required parameters?**: Parameter breakdown.`;
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        const conversationHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        const res = await sendChatMessage(text, user?.id, buildContext(), conversationHistory);
        reply = res.reply;
      }
      const botMsg = { role: 'assistant', content: reply, time: now };
      setMessages(prev => [...prev, botMsg]);

      // Add to sidebar sessions list if new topic
      if (chatSessions.length === 0 || !chatSessions.some(s => s.title.includes(text.slice(0, 10)))) {
        setChatSessions(prev => [
          { id: Date.now(), title: text.slice(0, 24) + (text.length > 24 ? '...' : '') },
          ...prev.slice(0, 6)
        ]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error compiling response. Please check your Groq API key.',
        time: now
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClear = async () => {
    try {
      await clearChatHistory(user?.id);
      setMessages([]);
      setChatSessions([]);
      setShowQuickPrompts(true);
      setContext(null);
      toast.success('Chat conversations cleared.');
    } catch {
      toast.error('Failed to clear conversations.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-enter flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* ChatGPT Style Sessions Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chat Logs</span>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-rose-500 font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {sessionsLoading ? (
            <div className="space-y-2 p-2">
              <div className="skeleton h-7 w-full rounded-lg" />
              <div className="skeleton h-7 w-5/6 rounded-lg" />
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="p-4 text-center text-slate-450 dark:text-slate-500 text-[11px] leading-relaxed">
              No recent prompts. Click a prompt below to launch.
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-xs font-semibold truncate hover:text-blue-500"
              >
                <MessageSquare size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat interface panel */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-slate-950">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-250 dark:border-slate-800/80 bg-white dark:bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-950 dark:text-white">AI Assistant Console</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">Groq · Llama 3.1 8B</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {context && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <Globe size={11} className="text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] text-purple-650 dark:text-purple-400 font-bold truncate max-w-[120px]">
                  Context: {context.api_name}
                </span>
                <button onClick={() => setContext(null)} className="text-purple-450 dark:text-purple-500 hover:text-rose-500 ml-1 shrink-0 cursor-pointer">
                  <X size={11} />
                </button>
              </div>
            )}
            <button
              onClick={handleClear}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
              title="Clear Chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Message logs view */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
          
          {/* Welcome Screen & Suggested questions */}
          {showQuickPrompts && messages.length === 0 && (
            <div className="max-w-2xl mx-auto space-y-8 py-8 text-center">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">API Integration Assistant</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Ask details about code endpoints, authentication requirements, rate-limiting variables, or query structures.
                </p>
              </div>

              {/* Context active alert */}
              {context && (
                <div className="bg-purple-500/5 border border-purple-500/15 max-w-md mx-auto p-3.5 rounded-2xl text-left flex gap-3 items-start">
                  <Globe size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Active API Context Loaded</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Queries automatically inherit details from **{context.api_name}**.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                {activePrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.message)}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left hover:border-purple-500/30 dark:hover:border-purple-500/20 hover:bg-purple-50/20 dark:hover:bg-purple-500/5 transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20">
                      <qp.icon size={14} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actual messages bubbles */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {/* Assistant loading state */}
          {thinking && (
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center">
                <Loader2 className="animate-spin text-purple-600 dark:text-purple-450" size={16} />
              </div>
            </div>
          )}
        </div>

        {/* Input box bottom bar */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 backdrop-blur-md shrink-0">
          
          {!showQuickPrompts && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {activePrompts.slice(0, 3).map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.message)}
                  disabled={thinking}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <qp.icon size={11} />
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text Input area */}
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this API client... (Enter to send)"
              rows={1}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none max-h-32 custom-scrollbar"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || thinking}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-md shadow-purple-550/20 shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
          
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2.5">
            Verification recommended. Review generated code configurations prior to production compile.
          </p>
        </div>

      </div>

    </div>
  );
};

export default AIAssistantPage;
