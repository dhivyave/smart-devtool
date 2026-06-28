import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, User, Minus } from 'lucide-react';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to Smart DevTool! I'm your AI assistant. I can help you understand APIs, generate wrapper code, and answer developer questions. Try one of the prompts below!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const prompts = [
    { label: 'Explain API', text: 'Explain the details of this Stripe-like billing API.' },
    { label: 'Python Wrapper', text: 'Show a sample Python requests wrapper for the endpoints.' },
    { label: 'Auth Help', text: 'What authentication header is required for this API?' },
    { label: 'cURL Request', text: 'Show a raw curl POST request for creating a customer.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const simulateStream = (text, callback) => {
    let index = 0;
    setStreamingText('');
    const interval = setInterval(() => {
      if (index < text.length) {
        setStreamingText((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        setStreamingText('');
        callback(text);
      }
    }, 12);
  };

  const getReply = (text) => {
    if (text.toLowerCase().includes('explain')) {
      return "This API follows a RESTful architecture with resource-based endpoints. It exposes `/customers`, `/invoices`, and `/subscriptions` resources with standard CRUD operations. Authentication uses Bearer tokens in the Authorization header. Rate limiting is set at 1000 req/min.";
    } else if (text.toLowerCase().includes('python')) {
      return '```python\nimport requests\n\nclass ApiClient:\n    def __init__(self, api_key):\n        self.base = "https://api.example.com/v1"\n        self.s = requests.Session()\n        self.s.headers["Authorization"] = f"Bearer {api_key}"\n\n    def get_customers(self):\n        return self.s.get(f"{self.base}/customers").json()\n\n    def create_customer(self, data):\n        return self.s.post(f"{self.base}/customers", json=data).json()\n```';
    } else if (text.toLowerCase().includes('auth')) {
      return "This API uses **Bearer Token** authentication. Include your secret key in every request:\n\n`Authorization: Bearer sk_live_your_key_here`\n\nTokens can be generated from the developer dashboard. They never expire but can be revoked.";
    } else {
      return '```bash\ncurl -X POST https://api.example.com/v1/customers \\\n  -H "Authorization: Bearer sk_test_51..." \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email": "john@example.com", "name": "John Doe"}\'\n```';
    }
  };

  const handleSend = (text) => {
    const msg = text || inputValue.trim();
    if (!msg || typing) return;

    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInputValue('');
    setTyping(true);

    setTimeout(() => {
      const reply = getReply(msg);
      simulateStream(reply, (fullText) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
        setTyping(false);
      });
    }, 800);
  };

  const renderMessage = (content) => {
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '');
          return (
            <pre
              key={i}
              className="bg-[#0a0f1a] text-[#93c5fd] rounded-lg p-3 overflow-x-auto text-[11px] font-mono mt-2 border border-[rgba(255,255,255,0.05)]"
            >
              <code>{code}</code>
            </pre>
          );
        }
        return part ? (
          <span key={i} className="whitespace-pre-wrap">
            {part.split('**').map((segment, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-blue-400 font-semibold">
                  {segment}
                </strong>
              ) : (
                segment
              )
            )}
          </span>
        ) : null;
      });
    }
    return (
      <span className="whitespace-pre-wrap">
        {content.split('**').map((segment, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="text-blue-400 font-semibold">
              {segment}
            </strong>
          ) : (
            segment
          )
        )}
      </span>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[380px] max-w-[calc(100vw-3rem)] h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
            style={{
              boxShadow:
                '0 0 40px rgba(124,58,237,0.15), 0 0 80px rgba(139,92,246,0.08), 0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0 bg-purple-50/80 dark:bg-slate-900/50 border-b border-purple-100 dark:border-white/5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-blue-500 dark:to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">AI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i === messages.length - 1 ? 0.1 : 0 }}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 dark:from-blue-500 dark:to-purple-600'
                        : 'bg-slate-100 dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700 text-purple-600 dark:text-white'
                    }`}
                  >
                    {m.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                  </div>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl max-w-[82%] text-[12.5px] leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-tr-sm text-white bg-gradient-to-br from-purple-500 to-purple-600 dark:from-blue-500 dark:to-purple-600'
                        : 'rounded-tl-sm text-slate-800 dark:text-[#F8FAFC] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5'
                    }`}
                  >
                    {renderMessage(m.content)}
                  </div>
                </motion.div>
              ))}

              {/* Streaming text */}
              {typing && streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-purple-600 dark:text-white shrink-0">
                    <Bot size={11} />
                  </div>
                  <div
                    className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm max-w-[82%] text-[12.5px] leading-relaxed text-slate-800 dark:text-[#F8FAFC] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5"
                  >
                    {renderMessage(streamingText)}
                    <span className="inline-block w-0.5 h-3.5 bg-purple-400 dark:bg-blue-400 ml-0.5 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* Typing indicator */}
              {typing && !streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-purple-600 dark:text-white shrink-0">
                    <Bot size={11} />
                  </div>
                  <div
                    className="px-3.5 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-blue-400 typing-dot"
                      style={{ animationDelay: '0s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-purple-400 typing-dot"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-blue-400 typing-dot"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.text)}
                    disabled={typing}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white transition-all disabled:opacity-40 cursor-pointer bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="p-3 shrink-0 border-t border-slate-100 dark:border-white/10"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about APIs..."
                  disabled={typing}
                  className="flex-1 text-[13px] px-3.5 py-2.5 rounded-xl outline-none text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || typing}
                  className="p-2.5 rounded-xl text-white transition-all disabled:opacity-30 cursor-pointer shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-blue-500 dark:to-purple-600"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer relative chatbot-button-glow bg-gradient-to-br from-purple-500 to-purple-600 dark:from-blue-500 dark:to-purple-600 shadow-xl"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification dot when closed */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0F172A] animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};

export default FloatingChatbot;
