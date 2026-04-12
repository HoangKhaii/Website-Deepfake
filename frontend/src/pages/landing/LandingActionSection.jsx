import { Link } from "react-router-dom";
import { actionTabs, pricingPlans } from "./landingData";

export default function LandingActionSection({
  user,
  activeActionTab,
  setActiveActionTab,
  activeActionIdx,
  contactSending,
  handleContactSubmit,
}) {
  return (
    <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div id="contact" className="scroll-mt-24" />
      <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-slate-600 text-xs sm:text-sm font-medium mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600" />
          Plans & contact
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-slate-900 tracking-tight">Money and messages</h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Pick a tier that matches how often you check clips. Need something custom? Flip to the contact tab—we read those.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-cyan-100/70 bg-white/75 backdrop-blur-md shadow-[0_24px_70px_-30px_rgba(6,182,212,0.28)] p-4 sm:p-6 ring-1 ring-violet-500/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-violet-300/15 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Pricing or contact">
          {actionTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeActionTab === tab.key}
              onClick={() => setActiveActionTab(tab.key)}
              className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 ${
                activeActionTab === tab.key
                  ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/25"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-cyan-400/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1 border-b border-slate-100 pb-4">
          <p className="text-sm text-slate-600">{actionTabs[activeActionIdx]?.short}</p>
          <span className="text-xs text-slate-400 tabular-nums">
            {activeActionIdx + 1} / {actionTabs.length}
          </span>
        </div>

        <div key={activeActionTab} className="relative" style={{ animation: "showcaseSlideIn 320ms ease-out" }}>
          {activeActionTab === "pricing" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {pricingPlans.map((plan, i) => (
                  <div
                    key={i}
                    className={`relative flex flex-col h-full p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
                      plan.popular
                        ? "border-cyan-400/80 bg-white shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/10"
                        : "border-slate-200/80 bg-white/90 hover:border-cyan-400/40"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 text-white text-xs font-semibold shadow-md">
                        Most people land here
                      </div>
                    )}
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                      {plan.popular && <p className="text-xs text-violet-600 font-semibold">Best if you check weekly</p>}
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500 text-sm pb-1">{plan.period}</span>
                    </div>
                    <p className="text-slate-500 mb-4 text-sm">{plan.desc}</p>
                    <ul className="space-y-2 mb-5 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-slate-600 text-sm">
                          <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.price === "Custom" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveActionTab("contact");
                          document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="w-full py-3 rounded-xl font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition text-center"
                      >
                        Talk to us
                      </button>
                    ) : (
                      <Link
                        to="/register"
                        className={`w-full py-3 rounded-xl font-semibold transition text-center block ${
                          plan.popular
                            ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/25 hover:brightness-105"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                      >
                        {plan.price === "$0" ? "Sign up free" : "Upgrade to Pro"}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-slate-500 max-w-2xl mx-auto">
                <span className="font-medium text-slate-700">Pro vs Free, in plain English:</span> Free is capped at five checks a month and a slower queue. Pro removes the cap, speeds things up, and gets you the API if you need it.
              </p>
            </div>
          )}

          {activeActionTab === "contact" && (
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleContactSubmit} className="p-5 sm:p-6 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Say hi</h3>
                  <p className="text-sm text-slate-500">No chatbot—just a form. We try to answer within a day, often faster.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input
                    name="firstName"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition text-sm"
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  <input
                    name="lastName"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition text-sm"
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
                <div className="mb-4">
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition text-sm"
                    placeholder="Email address"
                    autoComplete="email"
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    name="message"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition resize-none h-28 text-sm"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold transition shadow-md shadow-cyan-500/20 text-sm hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {contactSending ? "Sending…" : "Send message"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-violet-50/90 p-5 sm:p-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">{user ? "Still here?" : "Enough reading—try a file"}</h3>
          <p className="text-slate-600 text-sm sm:text-base mb-4 max-w-2xl mx-auto">
            {user
              ? "Jump back to the uploader whenever you've got a new clip."
              : "You don't need a credit card for the free tier. Upload something weird and see what happens."}
          </p>
          {user ? (
            <a
              href="#detect"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-sm transition shadow-md shadow-cyan-500/20 hover:brightness-105"
            >
              Back to upload
            </a>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-sm transition shadow-md shadow-cyan-500/20 hover:brightness-105"
            >
              Create an account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
