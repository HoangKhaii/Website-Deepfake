import { faqs, infoHubTabs, teamMembers, partners, blogPosts } from "./landingData";

export default function LandingInfoHubSection({
  activeInfoHub,
  setActiveInfoHub,
  activeInfoHubIdx,
  goInfoHub,
  openFaqIndex,
  setOpenFaqIndex,
}) {
  return (
    <section id="faq" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
      <div id="team" className="scroll-mt-24" />
      <div id="partners" className="scroll-mt-24" />
      <div id="blog" className="scroll-mt-24" />

      <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-600 text-xs sm:text-sm font-medium mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" />
          Questions & people
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-slate-900 tracking-tight">Answers, team, and a bit of reading</h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Same page, three tabs—so you&apos;re not hunting through the footer for a contact link.
        </p>
      </div>

      <div className="rounded-3xl border border-cyan-100/70 bg-white/75 backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(6,182,212,0.28)] p-4 sm:p-6 ring-1 ring-violet-500/5">
        <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Info hub sections">
          {infoHubTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeInfoHub === tab.key}
              onClick={() => setActiveInfoHub(tab.key)}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 ${
                activeInfoHub === tab.key
                  ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/25"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-cyan-400/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous info section"
              onClick={() => goInfoHub(-1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-violet-600 hover:border-violet-300 transition"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next info section"
              onClick={() => goInfoHub(1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-violet-600 hover:border-violet-300 transition"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1 border-b border-slate-100 pb-4">
          <p className="text-sm text-slate-600">{infoHubTabs[activeInfoHubIdx]?.short}</p>
          <span className="text-xs text-slate-400 tabular-nums">
            {activeInfoHubIdx + 1} / {infoHubTabs.length}
          </span>
        </div>

        <div key={activeInfoHub} style={{ animation: "showcaseSlideIn 320ms ease-out" }}>
          {activeInfoHub === "faq" && (
            <div className="space-y-3 max-w-4xl mx-auto">
              {faqs.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 ease-out ${
                      isOpen
                        ? "border border-cyan-200/70 bg-white shadow-[0_12px_40px_-12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/10"
                        : "border border-slate-200/70 bg-white/90 hover:border-cyan-300/50 hover:bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      id={`faq-trigger-${i}`}
                      onClick={() => setOpenFaqIndex((prev) => (prev === i ? -1 : i))}
                      className="group flex w-full items-start gap-3 p-4 text-left sm:gap-4 sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:ring-offset-2"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-xl px-1.5 text-[11px] font-bold uppercase tracking-tight text-white shadow-sm ring-2 transition-transform duration-300 ${
                          isOpen
                            ? "bg-gradient-to-br from-cyan-500 to-violet-600 ring-white/50 scale-105"
                            : "bg-gradient-to-br from-cyan-600 to-violet-600 ring-white/40 group-hover:scale-[1.02]"
                        }`}
                        aria-hidden
                      >
                        Q{i + 1}
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-snug text-slate-800 sm:text-lg">{faq.q}</span>
                      <span
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-500 transition-all duration-300 ${
                          isOpen ? "border-cyan-200 bg-cyan-50/80 text-cyan-700 rotate-180" : "group-hover:border-slate-300"
                        }`}
                        aria-hidden
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${i}`}
                        className="animate-faq-answer border-t border-slate-100/90 bg-gradient-to-b from-slate-50/90 to-white/80 px-4 pb-5 pt-1 sm:px-6"
                      >
                        <p className="border-l-2 border-cyan-400/60 pl-4 text-sm leading-relaxed text-slate-600 sm:text-base">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeInfoHub === "people" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Who&apos;s building this</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
                  {teamMembers.map((member, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/90 border border-slate-200/70 hover:border-cyan-300 transition text-center">
                      <img src={member.avatar} alt={member.name} className="w-20 h-20 mx-auto rounded-full object-cover shadow-md mb-3" />
                      <h4 className="font-bold text-slate-900">{member.name}</h4>
                      <p className="text-cyan-600 text-sm font-medium">{member.role}</p>
                      <p className="text-xs text-slate-500 mt-2">{member.bio}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Partners we work with</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {partners.map((partner, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/90 border border-slate-200/70 hover:border-cyan-300 transition flex items-center justify-center">
                      <img src={partner.logo} alt={partner.name} className="h-8 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeInfoHub === "updates" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {blogPosts.map((post, i) => (
                <div key={i} className="group rounded-2xl bg-white/90 border border-slate-200/70 overflow-hidden hover:border-cyan-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-40 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-slate-700 text-xs font-medium border border-slate-200">{post.category}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-2">{post.title}</h3>
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-600 text-sm font-medium hover:gap-2 transition-all">
                      Read More
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
