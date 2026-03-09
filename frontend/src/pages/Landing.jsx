import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { detectVideo, detectImage } from "../services/api";
import { appendLog } from "../services/storage";
import TechCorpLogo from "../Images/TechCorp.png";
import SecureNetLogo from "../Images/SecureNet.png";
import DataFlowLogo from "../Images/DataFlow.png";




export default function Landing() {
  const navigate = useNavigate();
  const { user, logout: sessionLogout } = useSession();
  const { success, error: showError } = useNotification();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const logout = () => {
    appendLog({ type: "logout", email: user?.email });
    sessionLogout();
    success("Logged out successfully! See you next time.");
    navigate("/");
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setResult(null);
      setError(null);
    }
  };

  const isImage = (f) => f?.type?.startsWith("image/");

  const formatPercent = (value) => {
    if (typeof value !== "number") return String(value);
    const v = value <= 1 ? value * 100 : value;
    return Number.isFinite(v) ? `${v.toFixed(1)}%` : String(value);
  };

  const buildComparisonRows = (res, selectedFile) => {
    const rows = [];
    const usedKeys = new Set();
    if (selectedFile) {
      rows.push({ metric: "File", value: selectedFile.name });
      rows.push({ metric: "Type", value: selectedFile.type || "unknown" });
      rows.push({ metric: "Size", value: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` });
    }
    if (res && typeof res === "object") {
      if (res.isDeepfake !== undefined) {
        rows.push({ metric: "Verdict", value: res.isDeepfake ? "Deepfake" : "Real" });
        usedKeys.add("isDeepfake");
      }
      if (res.score !== undefined) {
        rows.push({ metric: "Confidence", value: formatPercent(res.score) });
        usedKeys.add("score");
      }
      const probs = res.probabilities || res.probs || res.scores || null;
      if (probs && typeof probs === "object") {
        for (const [k, v] of Object.entries(probs)) {
          if (typeof v === "number") rows.push({ metric: `Score • ${k}`, value: formatPercent(v) });
        }
      }
      const extraKeys = Object.keys(res).filter((k) => !usedKeys.has(k)).sort();
      for (const k of extraKeys) {
        const v = res[k];
        if (v === null || v === undefined) continue;
        if (typeof v === "object") continue;
        rows.push({ metric: k, value: String(v) });
      }
    }
    return rows;
  };

  const handleCheck = async () => {
    if (!file) { 
      setError("Please select a video or image file."); 
      showError("Please select a video or image file.");
      return; 
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = isImage(file) ? await detectImage(file, user?.user_id) : await detectVideo(file, user?.user_id);
      setResult(data);
      appendLog({ type: "detect", email: user?.email, meta: { mediaType: isImage(file) ? "image" : "video", fileName: file.name, size: file.size, verdict: data?.isDeepfake, score: data?.score } });
      
      if (data?.isDeepfake) {
        success(`Analysis complete: Deepfake detected with ${((data?.score || 0) * 100).toFixed(1)}% confidence`);
      } else {
        success(`Analysis complete: Content is authentic with ${((data?.score || 0) * 100).toFixed(1)}% confidence`);
      }
    } catch (err) {
      const errorMsg = err.message || "Check failed. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetCheck = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    const el = document.getElementById("media-upload");
    if (el) el.value = "";
  };

  const features = [
    { title: "Real-Time Detection", desc: "Lightning-fast analysis delivers results in seconds, not minutes.", icon: "⚡", color: "from-amber-500 to-orange-500" },
    { title: "High Accuracy", desc: "99% detection accuracy powered by advanced machine learning models.", icon: "🎯", color: "from-emerald-500 to-teal-500" },
    { title: "Multi-Format Support", desc: "Analyze videos and images in MP4, WebM, MOV, JPG, PNG formats.", icon: "📁", color: "from-blue-500 to-cyan-500" },
    { title: "Privacy First", desc: "Your files are processed securely and automatically deleted after analysis.", icon: "🔒", color: "from-purple-500 to-pink-500" },
    { title: "Batch Processing", desc: "Analyze multiple files at once to save time and increase productivity.", icon: "📊", color: "from-rose-500 to-red-500" },
    { title: "Detailed Reports", desc: "Get comprehensive analysis reports with confidence scores and insights.", icon: "📋", color: "from-indigo-500 to-violet-500" },
  ];

  const steps = [
    { num: "01", title: "Upload Media", desc: "Drag and drop your video or image file, or click to browse from your device." },
    { num: "02", title: "AI Analysis", desc: "Our advanced AI model analyzes every frame, detecting signs of manipulation." },
    { num: "03", title: "Get Results", desc: "Receive an instant report with detailed findings and confidence scores." },
  ];

  const stats = [
    { value: "2.5M+", label: "Videos Analyzed", icon: "🎬" },
    { value: "99.2%", label: "Accuracy Rate", icon: "🎯" },
    { value: "150+", label: "Countries", icon: "🌍" },
    { value: "10K+", label: "Daily Users", icon: "👥" },
  ];

  const testimonials = [
    { name: "Sarah Johnson", role: "Content Creator", quote: "DeepCheck has completely transformed how I verify content authenticity. The accuracy is incredible!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face", color: "from-pink-500 to-rose-500" },
    { name: "Michael Chen", role: "Investigative Journalist", quote: "An indispensable tool for my work. It helps me quickly identify manipulated media.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", color: "from-blue-500 to-cyan-500" },
    { name: "Emily Rodriguez", role: "Social Media Manager", quote: "Essential for protecting our brand reputation. Fast, accurate, and reliable.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", color: "from-emerald-500 to-teal-500" },
  ];

  const faqs = [
    { q: "How accurate is the deepfake detection?", a: "Our AI-powered detection engine achieves 99%+ accuracy on most common deepfake techniques." },
    { q: "How long does analysis take?", a: "Most videos are analyzed within seconds to a few minutes, depending on length and quality." },
    { q: "Is my data secure?", a: "Yes! All uploaded files are processed securely and automatically deleted after analysis." },
    { q: "What formats do you support?", a: "We support video formats (MP4, WebM, MOV, AVI) and image formats (JPG, PNG, WebP)." },
  ];

  const pricingPlans = [
    { name: "Free", price: "$0", period: "/month", desc: "Perfect for getting started", features: ["5 analyses per month", "Basic detection", "Standard support", "Results in 5 minutes"], popular: false, color: "from-slate-500 to-slate-600" },
    { name: "Pro", price: "$29", period: "/month", desc: "For professionals", features: ["Unlimited analyses", "Advanced detection", "Priority support", "Results in 1 minute", "API access", "Custom reports"], popular: true, color: "from-[#238636] to-[#2ea043]" },
    { name: "Enterprise", price: "Custom", period: "", desc: "For large organizations", features: ["Everything in Pro", "Dedicated server", "Custom integration", "24/7 phone support", "SLA guarantee", "Team training"], popular: false, color: "from-purple-500 to-indigo-600" },
  ];

  const teamMembers = [
    { name: "Dr. Sarah Chen", role: "CEO & Founder", bio: "Former AI researcher at MIT with 15+ years in deep learning.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
    { name: "James Wilson", role: "CTO", bio: "Ex-Google AI engineer specializing in computer vision.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
    { name: "Dr. Maria Garcia", role: "Head of Research", bio: "PhD in Machine Learning from Stanford, published 50+ papers.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
    { name: "David Kim", role: "VP of Engineering", bio: "20 years building scalable AI systems at top tech companies.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face", linkedin: "#" },
  ];

  const partners = [
    { name: "TechCorp", logo: TechCorpLogo },
    { name: "SecureNet", logo: SecureNetLogo },
    { name: "DataFlow", logo: DataFlowLogo },
    { name: "Ai-Labs", logo: "https://tse4.mm.bing.net/th/id/OIP.GSC64n5vdqIZwJF2QIL7jAHaCV?pid=Api&P=0&h=180" },
    { name: "CloudTech", logo: "https://biz.prlog.org/cloudtech/logo.jpg" },
    { name: "CyberShield", logo: "https://tse1.mm.bing.net/th/id/OIP.oKzvab5-4SC75d_BO94HjQHaCC?pid=Api&P=0&h=180" },
  ];

  const blogPosts = [
    { 
      title: "Machines Spot Deepfake Pictures Better Than Humans", 
      date: "Feb 28, 2026", 
      category: "Research", 
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop", 
      readTime: "4 min read",
      link: "https://news.ufl.edu/2026/02/deepfake-detection/"
    },
    { 
      title: "UK Government Partners with Microsoft on Deepfake Detection", 
      date: "Feb 15, 2026", 
      category: "News", 
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop", 
      readTime: "3 min read",
      link: "https://www.computing.co.uk/news/2026/government/uk-picks-microsoft-to-help-develop-deepfake-detection-system"
    },
    { 
      title: "DeepQShield: Quantum-Resistant Deepfake Detection Framework", 
      date: "Feb 10, 2026", 
      category: "Technology", 
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop", 
      readTime: "6 min read",
      link: "https://www.nature.com/articles/s41598-026-38924-7"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 overflow-x-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.5%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>

        {/* Animated Blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-green-400/30 to-transparent rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-gradient-to-br from-amber-400/15 to-transparent rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-gradient-to-br from-cyan-400/15 to-transparent rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-green-500/40 animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-blue-500/40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 left-1/4 w-2 h-2 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-80 right-1/3 w-2 h-2 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-32 left-1/2 w-3 h-3 rounded-full bg-cyan-500/40 animate-bounce" style={{ animationDuration: '3s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-green-500/40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.8s' }}></div>
        <div className="absolute bottom-60 right-40 w-3 h-3 rounded-full bg-blue-500/40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '2.5s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '3s' }}></div>

        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-[10%] w-16 h-16 border-2 border-green-500/20 rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-1/3 right-[15%] w-12 h-12 border-2 border-blue-500/20 rotate-12 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
        <div className="absolute top-2/3 left-[20%] w-8 h-8 border border-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#238636] to-[#3fb950] flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg shadow-green-600/30 group-hover:scale-105 transition-transform">
              D
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">DeepCheck</span>
          </Link>
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Features</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">How It Works</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Pricing</a>
            <a href="#team" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Team</a>
            <a href="#blog" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Blog</a>
            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Reviews</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">FAQ</a>
            <a href="#contact" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Contact</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition">Dashboard</Link>
                <span className="text-slate-500 text-xs sm:text-sm hidden md:block">{user.full_name || user.email}</span>
                {user.role === "admin" && <Link to="/admin" className="px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-medium border border-slate-200 text-slate-700">Admin</Link>}
                <button onClick={logout} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-medium border border-slate-200 text-slate-700 transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition">Login</Link>
                <Link to="/register" className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-xs sm:text-sm font-semibold transition shadow-lg shadow-green-600/25 hover:shadow-green-600/40">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-28 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left px-0 lg:px-0">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              AI-Powered Deepfake Detection
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.05] text-slate-800 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Detect
              <span className="block bg-gradient-to-r from-[#238636] via-[#2ea043] to-[#3fb950] bg-clip-text text-transparent">
                Deepfake
              </span>
              Instantly
            </h1>
            <p className="text-slate-600 text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Protect yourself from AI-manipulated videos with our cutting-edge detection technology. Upload any video or image and get results in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <a href="#detect" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white font-semibold text-sm sm:text-lg shadow-xl shadow-green-600/20 transition transform hover:scale-105 hover:shadow-green-600/40">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Start Detection
                </a>
              ) : (
                <Link to="/register" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white font-semibold text-sm sm:text-lg shadow-xl shadow-green-600/20 transition transform hover:scale-105 hover:shadow-green-600/40">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  Get Started Free
                </Link>
              )}
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium text-sm sm:text-lg transition hover:border-white/20">
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                See How It Works
              </a>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="relative mt-10 lg:mt-0 px-4 sm:px-0">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-green-600/20 border border-white/20 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-blue-600/10"></div>
              <div className="relative p-4 sm:p-6 lg:p-8 aspect-square max-w-sm sm:max-w-md mx-auto">
                <div className="absolute inset-2 sm:inset-4 rounded-xl sm:rounded-2xl border border-slate-200/30 bg-white/60 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#238636] to-[#2ea043] flex items-center justify-center shadow-2xl shadow-green-600/50 animate-pulse">
                      <svg className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-800 text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">AI Analysis Engine</p>
                    <p className="text-slate-500 text-xs sm:text-sm">Advanced Deep Learning</p>
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/30 border border-green-500/40">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-green-700 text-xs sm:text-sm font-medium">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements - hidden on small screens */}
                <div className="hidden sm:block absolute top-4 sm:top-6 right-4 sm:right-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-green-500 text-white text-xs sm:text-sm font-semibold shadow-lg animate-bounce">99% Accurate</div>
                <div className="hidden sm:block absolute bottom-20 sm:bottom-24 left-4 sm:left-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium">Real-time Detection</div>
                <div className="hidden sm:block absolute bottom-20 sm:bottom-24 right-4 sm:right-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg">Fast Results</div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#238636] via-[#2ea043] to-[#3fb950]"></div>
            </div>
            <div className="absolute -top-8 sm:-top-10 -right-8 sm:-right-10 w-32 sm:w-40 h-32 sm:h-40 bg-green-500/20 rounded-full blur-2xl sm:blur-3xl"></div>
            <div className="absolute -bottom-8 sm:-bottom-10 -left-8 sm:-left-10 w-32 sm:w-40 h-32 sm:h-40 bg-blue-500/20 rounded-full blur-2xl sm:blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Powerful Features</h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Everything you need to detect deepfakes with confidence</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <div key={i} className="group p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-800">{feature.title}</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-20 lg:py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">How It Works</h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Three simple steps to verify any video</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-green-500/50 to-transparent"></div>
                )}
                <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 hover:border-green-500/30 transition-all duration-300 shadow-sm">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-[#238636] to-[#2ea043] flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg z-10 text-white">
                    {step.num}
                  </div>
                  <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                      <svg className="w-8 sm:w-10 h-8 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />}
                        {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />}
                        {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-800">{step.title}</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detection Section */}
      {user && (
        <section id="detect" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 scroll-mt-20">
          <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#238636] via-[#2ea043] to-[#3fb950]"></div>
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-slate-800">Start Detection</h2>
              <p className="text-slate-600 text-sm sm:text-base">Upload your video or image to analyze</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start max-w-2xl mx-auto mb-4 sm:mb-6">
              <label className="flex-1 cursor-pointer w-full">
                <span className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 hover:border-green-500/50 hover:bg-green-50 transition-all">
                  <svg className="w-6 sm:w-8 h-6 sm:h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="flex-1 truncate text-left text-sm sm:text-base text-slate-700">{file ? file.name : "Drop video or image here"}</span>
                  <span className="text-xs text-slate-500 hidden sm:inline">MP4, WebM, JPG, PNG</span>
                </span>
                <input id="media-upload" type="file" accept="video/*,image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button onClick={handleCheck} disabled={loading || !file} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-semibold bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] disabled:opacity-50 disabled:cursor-not-allowed text-white transition shadow-xl shadow-green-600/20 text-sm sm:text-base">
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analyzing...
                    </span>
                  ) : "Detect"}
                </button>
                {(file || result) && (
                  <button onClick={resetCheck} disabled={loading} className="px-4 sm:px-6 py-3 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition disabled:opacity-50 text-sm sm:text-base">Clear</button>
                )}
              </div>
            </div>
            {error && <p className="mt-3 sm:mt-4 text-red-600 text-center text-sm sm:text-lg">{error}</p>}
            {result && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-green-700">Analysis Complete</h3>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-medium">{isImage(file) ? "Image" : "Video"} Analysis</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    {previewUrl && isImage(file) ? <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-[200px] sm:max-h-[300px]" /> : previewUrl ? <video src={previewUrl} controls className="w-full max-h-[200px] sm:max-h-[300px]" /> : <div className="p-6 sm:p-8 text-slate-500">No preview</div>}
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm sm:text-base">
                      <thead className="bg-slate-100"><tr><th className="text-left px-3 sm:px-5 py-3 sm:py-4 font-semibold text-slate-700">Metric</th><th className="text-left px-3 sm:px-5 py-3 sm:py-4 font-semibold text-slate-700">Value</th></tr></thead>
                      <tbody className="divide-y divide-slate-200">
                        {buildComparisonRows(result, file).map((row, i) => (<tr key={i}><td className="px-3 sm:px-5 py-3 sm:py-4 text-slate-600">{row.metric}</td><td className="px-3 sm:px-5 py-3 sm:py-4 text-slate-800 font-medium">{row.value}</td></tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Trusted by Millions</h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">See what our users have to say</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="group p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:-translate-y-2 shadow-sm hover:shadow-md">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-lg"
                />
                <div>
                  <p className="font-bold text-base sm:text-lg text-slate-800">{testimonial.name}</p>
                  <p className="text-slate-500 text-xs sm:text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 bg-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-800">Frequently Asked Questions</h2>
            <p className="text-slate-600">Got questions? We've got answers</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-green-500/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center text-green-600 flex-shrink-0">?</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-800">{faq.q}</h3>
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Simple, Transparent Pricing</h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Choose the plan that fits your needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pricingPlans.map((plan, i) => (
            <div key={i} className={`relative p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'border-green-500 bg-white shadow-xl shadow-green-600/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              {plan.popular && <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-r from-[#238636] to-[#2ea043] text-white text-xs sm:text-sm font-semibold">Most Popular</div>}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 shadow-lg`}>
                {i === 0 && '🚀'}
                {i === 1 && '⚡'}
                {i === 2 && '🏢'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-800">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-slate-800">{plan.price}</span>
                <span className="text-slate-500 text-sm sm:text-base">{plan.period}</span>
              </div>
              <p className="text-slate-500 mb-4 sm:mb-6 text-sm sm:text-base">{plan.desc}</p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 sm:gap-3 text-slate-600 text-sm sm:text-base">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs sm:text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-xl font-semibold transition transform hover:scale-105 ${plan.popular ? 'bg-gradient-to-r from-[#238636] to-[#2ea043] text-white shadow-lg text-sm sm:text-base' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm sm:text-base'}`}>
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="relative z-10 py-16 sm:py-20 lg:py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Meet Our Team</h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">The experts behind DeepCheck</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member, i) => (
              <div key={i} className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 hover:border-green-500/30 transition-all duration-300 hover:-translate-y-2">
                <div className="relative mb-4 sm:mb-6">
                  <img src={member.avatar} alt={member.name} className="w-24 sm:w-28 lg:w-32 h-24 sm:h-28 lg:h-32 mx-auto rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <a href={member.linkedin} className="absolute bottom-0 right-1/2 translate-x-6 sm:translate-x-8 translate-y-1 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-green-600 font-medium mb-2 sm:mb-3 text-sm sm:text-base">{member.role}</p>
                  <p className="text-slate-500 text-xs sm:text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Trusted Partners</h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Industry leaders who trust DeepCheck</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
          {partners.map((partner, i) => (
            <div key={i} className="group p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-green-500/30 transition-all duration-300 flex items-center justify-center hover:-translate-y-1">
              <img src={partner.logo} alt={partner.name} className="h-8 sm:h-10 opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="relative z-10 py-16 sm:py-20 lg:py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Latest Updates</h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Stay informed about deepfake technology</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {blogPosts.map((post, i) => (
              <div key={i} className="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-green-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="relative h-36 sm:h-40 lg:h-48 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2 sm:px-3 py-1 rounded-full bg-white/90 backdrop-blur text-slate-700 text-xs sm:text-sm font-medium">{post.category}</div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 text-slate-500 text-xs sm:text-sm mb-2 sm:mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 sm:mb-3 group-hover:text-green-600 transition-colors">{post.title}</h3>
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 sm:gap-2 text-green-600 font-medium hover:gap-2 sm:hover:gap-3 transition-all text-sm">
                    Read More <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-800">Get In Touch</h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">Have questions? We'd love to hear from you</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <form className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div>
                <label className="block text-slate-700 font-medium mb-2 text-sm sm:text-base">First Name</label>
                <input type="text" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition text-sm sm:text-base" placeholder="John" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-2 text-sm sm:text-base">Last Name</label>
                <input type="text" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition text-sm sm:text-base" placeholder="Doe" />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-slate-700 font-medium mb-2 text-sm sm:text-base">Email</label>
              <input type="email" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition text-sm sm:text-base" placeholder="john@example.com" />
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-slate-700 font-medium mb-2 text-sm sm:text-base">Message</label>
              <textarea className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition resize-none h-24 sm:h-32 text-sm sm:text-base" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="w-full py-3 sm:py-4 rounded-xl sm:rounded-xl bg-gradient-to-r from-[#238636] to-[#2ea043] text-white font-semibold hover:from-[#2ea043] hover:to-[#3fb950] transition transform hover:scale-[1.02] shadow-lg shadow-green-600/25 text-sm sm:text-base">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#238636]/20 via-[#2ea043]/15 to-[#3fb950]/20 border border-slate-200 p-8 sm:p-12 lg:p-16 xl:p-20 text-center overflow-hidden shadow-xl">
          <div className="absolute top-0 left-1/4 w-48 sm:w-56 lg:w-72 h-48 sm:h-56 lg:h-72 bg-green-400/20 rounded-full blur-2xl sm:blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 sm:w-56 lg:w-72 h-48 sm:h-56 lg:h-72 bg-blue-400/20 rounded-full blur-2xl sm:blur-3xl"></div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 text-slate-800">{user ? "Ready to Get Started?" : "Start Protecting Today"}</h2>
            <p className="text-slate-600 text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 lg:mb-10 max-w-xl mx-auto">
              {user ? "Upload your first video and experience the power of AI detection." : "Join thousands of users who trust DeepCheck for accurate deepfake detection."}
            </p>
            {user ? (
              <a href="#detect" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#238636] to-[#2ea043] text-white font-bold text-sm sm:text-lg hover:from-[#2ea043] hover:to-[#3fb950] transition transform hover:scale-105 shadow-xl">
                Start Detection Now
              </a>
            ) : (
              <Link to="/register" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#238636] to-[#2ea043] text-white font-bold text-sm sm:text-lg hover:from-[#2ea043] hover:to-[#3fb950] transition transform hover:scale-105 shadow-xl">
                Create Free Account
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-[#238636] to-[#3fb950] flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg text-white">D</div>
              <div>
                <span className="font-bold text-lg sm:text-xl block text-slate-800">DeepCheck</span>
                <span className="text-slate-500 text-xs sm:text-sm">AI-Powered Detection</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-slate-600 text-sm">
              <a href="#" className="hover:text-slate-900 transition">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition">Terms</a>
              <a href="#" className="hover:text-slate-900 transition">Contact</a>
              <a href="#" className="hover:text-slate-900 transition">Support</a>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">© 2026 DeepCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
