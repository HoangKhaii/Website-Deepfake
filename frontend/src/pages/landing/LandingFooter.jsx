export default function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-cyan-200/60 bg-gradient-to-b from-cyan-50/90 via-slate-50 to-slate-100/95 py-6 sm:py-7">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-cyan-200/70 bg-white/95 shadow-sm shadow-slate-200/80 px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-5">
            <div className="flex items-center gap-3">
              <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-100 shadow-md" />
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block">DeepCheck</span>
                <span className="text-slate-600 text-xs">AI-Powered Detection</span>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm font-medium">
              <a href="#" className="px-3 py-1.5 rounded-lg text-slate-800 hover:text-cyan-700 hover:bg-cyan-50 transition">
                Privacy
              </a>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <a href="#" className="px-3 py-1.5 rounded-lg text-slate-800 hover:text-cyan-700 hover:bg-cyan-50 transition">
                Terms
              </a>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <a href="#" className="px-3 py-1.5 rounded-lg text-slate-800 hover:text-cyan-700 hover:bg-cyan-50 transition">
                Contact
              </a>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <a href="#" className="px-3 py-1.5 rounded-lg text-slate-800 hover:text-cyan-700 hover:bg-cyan-50 transition">
                Support
              </a>
            </nav>

            <p className="text-slate-600 text-xs font-medium">© 2026 DeepCheck. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
