import { useState, useEffect, useRef, useMemo } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, Code, Globe, Terminal, ArrowRight, Sparkles,
  ChevronDown, Cpu, Layers, CheckCircle2, Lock, BookOpen,
  Bot, FileCode2, Download, Search, Database, Cloud,
  CreditCard, Heart, Building2, Wifi, BrainCircuit, ShoppingCart,
  MapPin, Plane, Users, GraduationCap, Mail,
  Menu, X, ExternalLink, Rocket, Eye, FileText,
  MessageSquare, Copy, Archive, Sun, Moon
} from 'lucide-react';
import FloatingChatbot from './FloatingChatbot';
import { useTheme } from './ThemeContext';

// Custom inline SVG icons to support older lucide-react versions
const GithubIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const TwitterIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const LinkedinIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ─── SCROLL REVEAL WRAPPER ──────────────────────────────────────────────────
const ScrollReveal = ({ children, direction = 'up', delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const variants = {
    up: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } },
    blur: { hidden: { opacity: 0, filter: 'blur(8px)' }, visible: { opacity: 1, filter: 'blur(0px)' } },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[direction]}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};



// ─── FAQ ITEM ───────────────────────────────────────────────────────────────
const FAQItem = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <ScrollReveal delay={index * 0.06}>
      <div
        className="border-b border-slate-200 dark:border-white/[0.06] py-5 transition-colors"
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left font-semibold text-slate-800 dark:text-[#F8FAFC] hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer group"
        >
          <span className="text-[15px] pr-4">{question}</span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 shrink-0"
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-sm text-slate-650 dark:text-slate-400 leading-relaxed pr-8">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
};

// ─── BACKGROUND PARTICLES ───────────────────────────────────────────────────
const Particles = () => {
  const { theme } = useTheme();
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: Math.random() * 15 + 15,
      opacity: Math.random() * 0.3 + 0.05,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            background: p.id % 2 === 0
              ? (theme === 'dark' ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.25)')
              : (theme === 'dark' ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.25)'),
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── MAIN LANDING PAGE ──────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cursor glow tracker
  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // ─── DATA ─────────────────────────────────────────────────────────────────
  const features = [
    { icon: BrainCircuit, title: 'AI Documentation Analysis', desc: 'Deep-crawl any API doc page and extract structured data using Groq Llama 3.1.' },
    { icon: Search, title: 'Endpoint Detection', desc: 'Automatically discover all REST endpoints with methods, paths, and parameters.' },
    { icon: Shield, title: 'Authentication Detection', desc: 'Identify API key, Bearer token, OAuth, and Basic auth patterns instantly.' },
    { icon: Code, title: 'Wrapper Generation', desc: 'Generate production-ready client libraries in Python, Java, JS, TS, Go, C#.' },
    { icon: Download, title: 'Code Export', desc: 'Download generated wrapper code as files or copy to clipboard with one click.' },
    { icon: FileText, title: 'PDF Report', desc: 'Export comprehensive analysis reports as formatted PDF documents.' },
    { icon: Bot, title: 'Groq AI Assistant', desc: 'Chat with a context-aware AI that understands your analyzed API data.' },
    { icon: Archive, title: 'History Tracking', desc: 'All analyses are saved with full context for comparison and re-use.' },
    { icon: Copy, title: 'Copy Code', desc: 'One-click copy for any generated code snippet, request sample, or endpoint.' },
    { icon: Terminal, title: 'Multi-Language CLI', desc: 'Switch between 6+ programming languages and get native-style wrappers.' },
  ];

  const timelineSteps = [
    { step: '01', title: 'Paste Documentation URL', desc: 'Drop any API documentation link — Swagger, Readme, custom portals, or HTML pages.', icon: Globe },
    { step: '02', title: 'Describe Your Use Case', desc: 'Tell the AI what you want to build — "create customers", "process payments", etc.', icon: MessageSquare },
    { step: '03', title: 'Choose Language', desc: 'Select your target language: Python, JavaScript, TypeScript, Java, C#, or Go.', icon: Code },
    { step: '04', title: 'AI Analysis', desc: 'Groq Llama 3.1 scrapes the docs, evaluates auth, maps endpoints, and scores relevance.', icon: BrainCircuit },
    { step: '05', title: 'Generate Wrapper', desc: 'Receive a clean, production-ready wrapper client class tailored to your use case.', icon: FileCode2 },
    { step: '06', title: 'Download & Deploy', desc: 'Download your code, export a PDF report, and integrate into your project.', icon: Rocket },
  ];

  const useCases = [
    { icon: Cloud, title: 'Weather APIs', desc: 'OpenWeatherMap, AccuWeather' },
    { icon: CreditCard, title: 'Payment APIs', desc: 'Stripe, PayPal, Razorpay' },
    { icon: Heart, title: 'Healthcare APIs', desc: 'FHIR, Epic, Cerner' },
    { icon: Building2, title: 'Banking APIs', desc: 'Plaid, Yodlee, Open Banking' },
    { icon: Shield, title: 'Government APIs', desc: 'Data.gov, USPS, Tax APIs' },
    { icon: Wifi, title: 'IoT APIs', desc: 'AWS IoT, Azure IoT Hub' },
    { icon: BrainCircuit, title: 'Machine Learning', desc: 'OpenAI, Hugging Face' },
    { icon: ShoppingCart, title: 'E-commerce APIs', desc: 'Shopify, WooCommerce' },
    { icon: MapPin, title: 'Maps APIs', desc: 'Google Maps, Mapbox' },
    { icon: Plane, title: 'Travel APIs', desc: 'Amadeus, Skyscanner' },
    { icon: Users, title: 'CRM APIs', desc: 'Salesforce, HubSpot' },
    { icon: Database, title: 'ERP APIs', desc: 'SAP, Oracle, NetSuite' },
    { icon: GraduationCap, title: 'Education APIs', desc: 'Canvas, Moodle, Coursera' },
  ];



  const faqItems = [
    { q: 'What is Smart DevTool?', a: 'Smart DevTool is an AI-powered platform that reads API documentation, extracts endpoints, detects authentication patterns, and generates production-ready wrapper clients in multiple programming languages.' },
    { q: 'How accurate is endpoint detection?', a: 'Our AI achieves 98%+ accuracy on standard REST API documentation. It can parse Swagger/OpenAPI specs, HTML docs, and even unstructured documentation pages.' },
    { q: 'Does it support Swagger/OpenAPI?', a: 'Yes! Smart DevTool fully supports Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1 specifications, in addition to raw HTML documentation pages.' },
    { q: 'Does it support Postman collections?', a: 'You can analyze API documentation that Postman generates. Direct Postman collection import is on our roadmap for a future release.' },
    { q: 'Can I generate Java wrappers?', a: 'Absolutely. We support Java, Python, JavaScript, TypeScript, C#, and Go. Each wrapper is generated with native patterns and idioms for the target language.' },
    { q: 'Can I generate Python wrappers?', a: 'Yes! Python wrappers use the requests library with proper session management, error handling, and type hints for modern Python development.' },
    { q: 'Can I download PDF reports?', a: 'Yes. Every analysis can be exported as a formatted PDF report that includes API summaries, endpoint details, auth information, and generated code.' },
    { q: 'Can I ask AI questions about my API?', a: 'Yes! The built-in Groq AI Assistant has full context of your analyzed API and can answer questions, generate additional code, and provide integration guidance.' },
    { q: 'Can I analyze private/internal APIs?', a: 'Yes, as long as the documentation is accessible via a URL. Smart DevTool scrapes the page content — it does not require API keys or credentials to read documentation.' },
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="landing-page min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-[#F8FAFC] relative overflow-hidden transition-colors duration-300">
      {/* Cursor Glow */}
      <div
        className="cursor-glow hidden md:block"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/[0.04] blur-3xl" />
        <div className="blob-2 absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-3xl" />
        <div className="blob-3 absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-cyan-500/[0.03] blur-3xl" />
      </div>

      {/* Particles */}
      <Particles />

      {/* ═══════════ NAVIGATION ═══════════ */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: theme === 'dark' ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
              Smart DevTool
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#use-cases" className="hover:text-slate-900 dark:hover:text-white transition-colors">Use Cases</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer mr-2"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                }}
              >
                Get Started
              </button>
            </SignUpButton>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-450 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
              style={{
                background: theme === 'dark' ? 'rgba(15,23,42,0.97)' : 'rgba(248,250,252,0.97)',
                borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="px-6 py-4 space-y-3">
                <a href="#features" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#use-cases" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>Use Cases</a>
                <a href="#faq" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <div className="pt-3 flex gap-3" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <SignInButton mode="modal">
                    <button className="flex-1 py-2.5 text-sm font-semibold text-slate-300 rounded-xl cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Login</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl cursor-pointer" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>Get Started</button>
                  </SignUpButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 md:pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#60A5FA',
              }}
            >
              <Sparkles size={13} />
              AI-Powered Developer Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
            >
              Build{' '}
              <span className="animated-gradient-text">AI-Powered</span>
              <br />
              API Integrations
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed"
            >
              Analyze any API documentation instantly. Auto-detect authentication,
              map endpoints, and generate production-ready wrapper clients in seconds.
            </motion.p>

            {/* Feature bullets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="grid grid-cols-2 gap-2.5"
            >
              {[
                'AI Documentation Analysis',
                'Endpoint Extraction',
                'Wrapper Generation',
                'Groq AI Assistant',
                'PDF Export',
                'History Tracking',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-750 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <SignUpButton mode="modal">
                <button
                  className="group flex items-center justify-center gap-2.5 font-semibold px-8 py-4 rounded-xl text-white transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    boxShadow: '0 8px 30px rgba(59,130,246,0.3)',
                  }}
                >
                  Get Started Free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button
                  className="flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-xl text-slate-755 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <Eye size={16} />
                  Watch Demo
                </button>
              </SignInButton>
            </motion.div>
          </div>

          {/* Right — Animated Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div
              className="rounded-2xl overflow-hidden animate-float-slow"
              style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 60px rgba(59,130,246,0.08), 0 25px 50px rgba(0,0,0,0.4)',
              }}
            >
              {/* Terminal Header */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-slate-500 ml-2 font-mono">smart-devtool — analysis</span>
              </div>
              {/* Terminal Body */}
              <div className="p-5 font-mono text-[12px] leading-relaxed space-y-2">
                <div className="text-slate-500">
                  <span className="text-emerald-400">$</span> analyze https://api.stripe.com/docs
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">→</span> Scraping documentation...
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">→</span> Detecting auth patterns...
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">→</span> Mapping endpoints...
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">→</span> Generating Python wrapper...
                  <span className="text-emerald-400">✓</span>
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-purple-400 mb-1">class StripeApiClient:</div>
                  <div className="text-slate-500 pl-4">
                    <span className="text-blue-400">def</span>{' '}
                    <span className="text-yellow-300">__init__</span>
                    <span className="text-slate-400">(self, api_key):</span>
                  </div>
                  <div className="text-slate-500 pl-8">
                    self.base_url = <span className="text-emerald-300">"https://api.stripe.com/v1"</span>
                  </div>
                  <div className="text-slate-500 pl-8">
                    self.headers = {'{'}<span className="text-emerald-300">"Authorization"</span>: <span className="text-emerald-300">f"Bearer {'{'}api_key{'}'}"</span>{'}'}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span className="text-xs">Analysis complete — 23 endpoints found, Bearer auth detected</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mx-auto" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                <Layers size={12} />
                Platform Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Everything You Need to <span className="animated-gradient-text">Integrate APIs</span>
              </h2>
              <p className="text-slate-650 dark:text-slate-400 max-w-xl mx-auto">
                A complete toolkit for analyzing, understanding, and integrating third-party APIs with AI assistance.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.05} direction="scale">
                <div
                  className="landing-glass group p-5 hover:-translate-y-1 transition-all duration-300 cursor-default glow-border h-full"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    <f.icon size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS TIMELINE ═══════════ */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center space-y-4 mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mx-auto" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22D3EE' }}>
                <Rocket size={12} />
                Simple Workflow
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                From Docs to Code in <span className="animated-gradient-text">6 Steps</span>
              </h2>
              <p className="text-slate-650 dark:text-slate-400 max-w-lg mx-auto">
                Paste a URL, describe your goal, and let AI do the rest.
              </p>
            </div>
          </ScrollReveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px hidden md:block" style={{ background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.3), rgba(139,92,246,0.3), transparent)' }} />

            <div className="space-y-12 md:space-y-16">
              {timelineSteps.map((step, i) => (
                <ScrollReveal key={i} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 0.1}>
                  <div className={`flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div
                        className="landing-glass p-6 inline-block text-left glow-border"
                        style={{ maxWidth: '400px' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                            <step.icon size={16} className="text-blue-500 dark:text-blue-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">{step.step}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-850 dark:text-white mb-2">{step.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {/* Center dot */}
                    <div className="hidden md:flex w-4 h-4 rounded-full shrink-0 pulse-glow" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }} />

                    <div className="flex-1 hidden md:block" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ USE CASES ═══════════ */}
      <section id="use-cases" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mx-auto" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}>
                <Globe size={12} />
                Use Cases
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Works With <span className="animated-gradient-text">Any API</span>
              </h2>
              <p className="text-slate-650 dark:text-slate-400 max-w-lg mx-auto">
                From weather to payments, healthcare to e-commerce — analyze and integrate any API.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {useCases.map((uc, i) => (
              <ScrollReveal key={i} delay={i * 0.04} direction="scale">
                <div
                  className="landing-glass p-4 text-center group hover:-translate-y-1 transition-all duration-300 cursor-default glow-border"
                >
                  <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: 'rgba(59,130,246,0.08)' }}
                  >
                    <uc.icon size={18} className="text-blue-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white mb-1">{uc.title}</h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-550">{uc.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>



      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="relative z-10 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mx-auto" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA' }}>
                <BookOpen size={12} />
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Frequently Asked <span className="animated-gradient-text">Questions</span>
              </h2>
            </div>
          </ScrollReveal>

          <div
            className="landing-glass-strong p-6 md:p-8"
          >
            {faqItems.map((item, i) => (
              <FAQItem
                key={i}
                question={item.q}
                answer={item.a}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <ScrollReveal direction="scale">
            <div
              className="text-center py-16 px-8 rounded-3xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                Ready to supercharge your API workflow?
              </h2>
              <p className="text-slate-650 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of developers who save hours every week with AI-powered API analysis.
              </p>
              <SignUpButton mode="modal">
                <button
                  className="group inline-flex items-center gap-2.5 font-semibold px-8 py-4 rounded-xl text-white transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    boxShadow: '0 8px 30px rgba(59,130,246,0.3)',
                  }}
                >
                  Start Analyzing Free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer
        className="relative z-10 pt-16 pb-8"
        style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">Smart DevTool</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                AI-powered API analysis and integration platform for modern developers.
              </p>
              {/* Social icons */}
              <div className="flex gap-2">
                {[GithubIcon, TwitterIcon, LinkedinIcon, Mail].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'Features', 'Pricing', 'Changelog'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>



          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-600">
              © 2026 Smart DevTool. All rights reserved. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════ FLOATING CHATBOT ═══════════ */}
      <FloatingChatbot />
    </div>
  );
};

export default LandingPage;
