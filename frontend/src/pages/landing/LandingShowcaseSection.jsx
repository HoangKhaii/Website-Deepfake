import { features, showcaseTabs, steps, testimonials } from "./landingData";

export default function LandingShowcaseSection({
  activeShowcase,
  setActiveShowcase,
  activeShowcaseIdx,
  goShowcase,
}) {
  return (
    <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
      <div id="how-it-works" className="scroll-mt-24" />
      <div id="testimonials" className="scroll-mt-24" />

      <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-600 text-xs sm:text-sm font-medium mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" />
          What you get
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-slate-900 tracking-tight">The stuff that actually matters</h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          We&apos;re not trying to sound like a keynote—here&apos;s what the product does when you&apos;re tired and in a hurry.
        </p>
      </div>

      <div className="rounded-3xl border border-cyan-100/70 bg-white/75 backdrop-blur-md shadow-[0_20px_60px_-30px_rgba(6,182,212,0.28)] p-4 sm:p-6 ring-1 ring-violet-500/5">
        <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Showcase sections">
          {showcaseTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeShowcase === tab.key}
              onClick={() => setActiveShowcase(tab.key)}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 ${
                activeShowcase === tab.key
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
              aria-label="Previous section"
              onClick={() => goShowcase(-1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-violet-600 hover:border-violet-300 transition"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next section"
              onClick={() => goShowcase(1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-violet-600 hover:border-violet-300 transition"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1 border-b border-slate-100 pb-4">
          <p className="text-sm text-slate-600">{showcaseTabs[activeShowcaseIdx]?.short}</p>
          <span className="text-xs text-slate-400 tabular-nums shrink-0">
            {activeShowcaseIdx + 1} / {showcaseTabs.length}
          </span>
        </div>

        <div key={activeShowcase} style={{ animation: "showcaseSlideIn 320ms ease-out" }}>
          {activeShowcase === "features" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-white/90 border border-slate-200/70 hover:border-transparent hover:ring-2 hover:ring-cyan-500/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.imageAlt}
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${feature.accent} opacity-30 mix-blend-multiply`} aria-hidden />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent" />
                  </div>
                  <div className="p-5 pt-4">
                    <h3 className="text-lg font-bold mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeShowcase === "workflow" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {steps.map((step, i) => (
                <div key={i} className="relative rounded-2xl bg-white/90 border border-slate-200/70 p-6 pt-10 text-center hover:border-cyan-400/40 transition">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/25">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeShowcase === "reviews" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {testimonials.map((testimonial, i) => (
                  <div key={i} className="rounded-2xl bg-white/90 border border-slate-200/70 p-6 hover:border-cyan-300 transition">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                      <div>
                        <p className="font-bold text-slate-900">{testimonial.name}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, starIdx) => (
                        <svg key={starIdx} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-xs text-slate-500 max-w-xl mx-auto">
                Sample feedback—your mileage will vary. We like reviews that mention both the good and the rough edges.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
