import { Link } from "react-router-dom";

export default function LandingNav({ user, logout }) {
  return (
    <nav className="sticky top-0 z-50 w-full shadow-sm shadow-cyan-900/5 relative overflow-hidden backdrop-blur-xl border-b border-slate-200/50 supports-[backdrop-filter]:backdrop-saturate-150">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-100/55 via-white/88 to-indigo-100/60 animate-nav-gradient-shift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 to-cyan-50/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-40 w-[min(520px,55vw)] rounded-full bg-cyan-400/20 blur-3xl animate-nav-glow-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-16 right-1/4 h-32 w-64 rounded-full bg-indigo-400/15 blur-3xl animate-nav-glow-drift"
        style={{ animationDelay: "1.8s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/45 to-transparent"
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <img src="/logo-deepfake.png" alt="DeepCheck" className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">DeepCheck</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          <a href="#features" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            Pricing
          </a>
          <a href="#team" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            Team
          </a>
          <a href="#blog" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            Blog
          </a>
          <a href="#faq" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            FAQ
          </a>
          <a href="#contact" className="text-slate-600 hover:text-cyan-700 text-sm font-medium transition-colors">
            Contact
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition">Dashboard</Link>
              <span className="text-slate-500 text-xs sm:text-sm hidden md:block">{user.full_name || user.email}</span>
              {user.role === "admin" && (
                <Link to="/admin" className="px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-medium border border-slate-200 text-slate-700">
                  Admin
                </Link>
              )}
              <button type="button" onClick={logout} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-medium border border-slate-200 text-slate-700 transition">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium transition">
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/45"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
