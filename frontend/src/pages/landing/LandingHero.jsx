import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_SLIDESHOW_GUEST, stats } from "./landingData";
import { buildComparisonRows, buildScoreExplainRows, isImage, IMPACT } from "./analysisUtils";

export default function LandingHero({
  user,
  file,
  previewUrl,
  loading,
  result,
  error,
  visualSignals,
  expandedScoreDetails,
  setExpandedScoreDetails,
  handleFileChange,
  handleCheck,
  resetCheck,
}) {
  const loggedIn = Boolean(user);
  const slides = HERO_SLIDESHOW_GUEST;
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    setSlideIndex(0);
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn || slides.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [slides.length, loggedIn]);

  return (
    <section
      className={
        loggedIn
          ? "relative z-10 overflow-hidden min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-10 sm:py-14"
          : "relative z-10 overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-20 sm:pb-28 lg:pb-32"
      }
    >
      <style>{`
          @keyframes heroProgressShift {
            0% { transform: translateX(-140%); }
            100% { transform: translateX(240%); }
          }
          @keyframes heroCardFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-7px); }
          }
          @keyframes heroLinePulse {
            0%, 100% { opacity: 0.45; transform: scaleX(0.92); }
            50% { opacity: 0.9; transform: scaleX(1); }
          }
          @keyframes heroOrbPulse {
            0%, 100% { opacity: 0.35; transform: scale(0.92); }
            50% { opacity: 0.7; transform: scale(1.08); }
          }
          @keyframes showcaseSlideIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      {!loggedIn && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0">
            {slides.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover object-center select-none transition-opacity duration-1000 ease-out blur-[3px] sm:blur-[4px] scale-[1.06] ${
                  i === slideIndex ? "opacity-100 z-[1]" : "opacity-0 z-0"
                }`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
            ))}
          </div>
          <div className="absolute inset-0 z-[2] bg-gradient-to-br from-white/58 via-slate-50/40 to-cyan-50/35" />
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-white/75 via-white/25 to-transparent sm:from-white/65" />
          <div className="absolute inset-0 z-[2] bg-slate-950/10" />
          <div className="absolute inset-0 z-[2] opacity-[0.055] sm:opacity-[0.065] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%231e293b%22%20fill-opacity%3D%220.35%22%3E%3Cpath%20d%3D%22M48%2045v-5h-3v5h-5v3h5v5h3v-5h5v-3h-5zm0-40V0h-3v5h-5v3h5v5h3V8h5V5h-5zM8%2045v-5H5v5H0v3h5v5h3v-5h5v-3H8zM8%205V0H5v5H0v3h5v5h3V8h5V5H8z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div
          className={
            loggedIn
              ? "flex justify-center items-center w-full"
              : "grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          }
        >
          {!loggedIn && (
          <div className="text-center lg:text-left px-0 lg:px-0">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 border border-cyan-600/25 text-slate-800 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 animate-fade-in-up shadow-sm shadow-slate-900/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600" />
              </span>
              Deepfake checks, without the hype
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <span className="text-[#0c1e3a]">Detect</span>
              <span className="block bg-gradient-to-r from-[#0e7490] via-[#0891b2] to-[#06b6d4] bg-clip-text text-transparent">Deepfake</span>
              <span className="text-[#0c1e3a]">Instantly</span>
            </h1>
            <p className="text-slate-700 font-medium text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Fake clips are everywhere now. Upload something you&apos;re unsure about—we&apos;ll run it through the detector and show you scores, not just a yes or no.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              {user ? (
                <a href="#detect" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white font-semibold text-sm sm:text-lg shadow-xl shadow-cyan-600/20 transition transform hover:scale-105 hover:shadow-cyan-600/40">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Go to upload
                </a>
              ) : (
                <Link to="/register" className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white font-semibold text-sm sm:text-lg shadow-xl shadow-cyan-600/20 transition transform hover:scale-105 hover:shadow-cyan-600/40">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Try it free
                </Link>
              )}
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white border-2 border-slate-300/90 hover:border-cyan-500 text-slate-800 hover:text-slate-900 font-semibold text-sm sm:text-lg shadow-md shadow-slate-900/10 transition transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/15"
              >
                <svg className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </a>
            </div>
            <div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-5 lg:gap-x-10 xl:gap-x-12 max-w-2xl lg:max-w-none mx-auto lg:mx-0 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center min-w-[5rem] sm:min-w-0 px-2 sm:px-3 py-1">
                  <p className="text-xl sm:text-2xl font-bold text-[#0c1e3a] tabular-nums">{stat.value}</p>
                  <p className="text-slate-600 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] font-semibold mt-1.5 max-w-[9rem] sm:max-w-none mx-auto leading-snug">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          )}

          <div
            className={
              loggedIn
                ? "relative w-full max-w-lg mx-auto px-0 sm:px-0"
                : "relative mt-10 lg:mt-0 px-4 sm:px-0"
            }
          >
            <div className={loggedIn ? "relative w-full" : "relative max-w-sm sm:max-w-md lg:max-w-lg mx-auto"}>
              {user ? (
                <div id="detect" className="scroll-mt-24 relative">
                  <div className="pt-0 pb-0">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-500/30 shrink-0">
                        <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Run a check</p>
                        <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug">Video or image—whatever you need verified</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-4">
                      <label className="cursor-pointer w-full">
                        <span className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-slate-500 hover:border-cyan-600 focus-within:border-cyan-600 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-7 h-7 text-cyan-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="flex-1 truncate text-left text-sm text-slate-900 font-semibold">{file ? file.name : "Drop video or image here"}</span>
                          </div>
                          <span className="text-[11px] sm:text-xs text-slate-800 font-medium sm:ml-auto sm:text-right">MP4, WebM, JPG, PNG</span>
                        </span>
                        <input id="media-upload" type="file" accept="video/*,image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={handleCheck}
                          disabled={loading || !file}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] disabled:opacity-45 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-600/25 text-sm transition"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Hang tight…
                            </span>
                          ) : (
                            "Detect"
                          )}
                        </button>
                        {(file || result) && (
                          <button
                            type="button"
                            onClick={resetCheck}
                            disabled={loading}
                            className="px-5 py-3.5 rounded-xl border-2 border-slate-600 hover:bg-slate-100 text-slate-900 text-sm font-semibold transition disabled:opacity-45"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {error && <p className="mt-4 text-red-700 text-sm text-center font-semibold">{error}</p>}

                    {result && (
                      <div className="mt-6 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">Analysis Complete</h3>
                          <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 text-xs font-bold border border-cyan-300">{isImage(file) ? "Image" : "Video"} Analysis</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="rounded-xl overflow-hidden border-2 border-slate-400">
                            {previewUrl && isImage(file) ? (
                              <img src={previewUrl} alt="Preview" className="w-full object-contain max-h-[180px] sm:max-h-[220px]" />
                            ) : previewUrl ? (
                              <video src={previewUrl} controls className="w-full max-h-[180px] sm:max-h-[220px]" />
                            ) : (
                              <div className="p-6 text-slate-800 font-medium text-sm">No preview</div>
                            )}
                          </div>
                          <div className="rounded-xl border-2 border-slate-400 overflow-hidden">
                            <table className="w-full text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b-2 border-slate-300">
                                  <th className="text-left px-3 py-2.5 font-bold text-slate-900">Metric</th>
                                  <th className="text-left px-3 py-2.5 font-bold text-slate-900">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {buildComparisonRows(result, file).map((row, i) => {
                                  const isExplainableScore = row.kind === "score" && (row.scoreKey === "real" || row.scoreKey === "fake");
                                  const isExpanded = Boolean(expandedScoreDetails[row.scoreKey]);
                                  const detailRows = isExplainableScore ? buildScoreExplainRows(visualSignals, row.scorePercent, row.scoreKey) : [];

                                  return (
                                    <Fragment key={`score-row-${i}`}>
                                      <tr>
                                        <td className="px-3 py-2.5 text-slate-800 font-medium">{row.metric}</td>
                                        <td className="px-3 py-2.5 text-slate-900 font-semibold">
                                          <div className="flex items-center justify-between gap-2">
                                            <span>{row.value}</span>
                                            {isExplainableScore && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedScoreDetails((prev) => ({
                                                    ...prev,
                                                    [row.scoreKey]: !prev[row.scoreKey],
                                                  }))
                                                }
                                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 transition"
                                                title={isExpanded ? `Hide details (${row.scoreKey})` : `Show details (${row.scoreKey})`}
                                              >
                                                {isExpanded ? "−" : "+"}
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                      {isExplainableScore && isExpanded && (
                                        <tr>
                                          <td colSpan={2} className="px-3 py-3 bg-slate-50/90">
                                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                              <p className="text-xs text-slate-600 mb-2">
                                                Signal breakdown for{" "}
                                                <span className="font-semibold text-slate-900">{row.scoreKey}</span> (from your uploaded media):
                                              </p>
                                              <table className="w-full text-xs sm:text-sm">
                                                <thead>
                                                  <tr className="text-slate-600">
                                                    <th className="text-left py-1 font-semibold">Signal</th>
                                                    <th className="text-left py-1 font-semibold">Impact</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {detailRows.map((item, idx) => (
                                                    <tr key={`${row.scoreKey}-${idx}`} className="border-t border-slate-100">
                                                      <td className="py-1.5 text-slate-800">
                                                        <div className="font-medium">{item.feature}</div>
                                                        <div className="text-slate-600 text-[11px]">{item.note}</div>
                                                      </td>
                                                      <td className="py-1.5">
                                                        <span
                                                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                            item.level === IMPACT.strong
                                                              ? "bg-emerald-100 text-emerald-800"
                                                              : item.level === IMPACT.medium
                                                                ? "bg-amber-100 text-amber-800"
                                                                : "bg-slate-100 text-slate-700"
                                                          }`}
                                                        >
                                                          {item.level}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 p-3 sm:p-4">
                          <h4 className="text-sm sm:text-base font-bold text-cyan-900 mb-2">How to read this</h4>
                          <ul className="space-y-1 text-xs sm:text-sm text-slate-800">
                            <li>
                              <span className="font-semibold">Verdict</span>: The model&apos;s final call (Real or Deepfake).
                            </li>
                            <li>
                              <span className="font-semibold">Confidence</span>: How sure the model is about that verdict (e.g. 92.4%).
                            </li>
                            <li>
                              <span className="font-semibold">Score • real / Score • fake</span>: Per-class probabilities; they usually add up to roughly 100%.
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="relative p-[1px] rounded-[34px] bg-gradient-to-br from-cyan-200/90 via-white to-sky-100/80 shadow-[0_28px_74px_-24px_rgba(14,116,144,0.38)]"
                  style={{ animation: "heroCardFloat 6.5s ease-in-out infinite" }}
                >
                  <div className="relative p-6 sm:p-8 rounded-[33px] border border-slate-200/80 bg-white/92 backdrop-blur-md overflow-hidden shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-cyan-400/12 blur-3xl" style={{ animation: "heroOrbPulse 5.2s ease-in-out infinite" }} />
                      <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-sky-400/12 blur-3xl" style={{ animation: "heroOrbPulse 6s ease-in-out infinite 0.6s" }} />
                    </div>

                    <div className="relative flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center shadow-md shadow-cyan-900/25 ring-1 ring-cyan-800/20 shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-semibold text-sm tracking-tight">Scanner (preview)</p>
                        <p className="text-slate-600 text-[11px] tracking-[0.12em] uppercase font-semibold">What you&apos;ll see after upload</p>
                      </div>
                    </div>

                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-6 rounded-3xl border border-slate-200/90 bg-slate-50/80 flex items-center justify-center shadow-inner shadow-slate-200/60">
                      <div className="w-24 sm:w-28 h-24 sm:h-28 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <svg className="w-10 sm:w-12 h-10 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-x-3 top-1/2 h-[2px] bg-cyan-200/70 shadow-[0_0_22px_2px_rgba(34,211,238,0.55)]" style={{ animation: "heroLinePulse 2.2s ease-in-out infinite" }} />
                    </div>

                    <div className="relative flex items-center justify-center gap-2 mb-6">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-70" />
                          <span className="relative h-2 w-2 rounded-full bg-cyan-600" />
                        </span>
                        <span className="text-slate-800 text-xs font-semibold tracking-wide">Working on it…</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5">
                      <div className="inline-flex w-full items-center gap-2 rounded-lg bg-white p-1 ring-1 ring-slate-200/80">
                        <span className="flex-1 text-center px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-800 text-[10px] sm:text-xs font-semibold">Real-time</span>
                        <span className="flex-1 text-center px-2.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-[10px] sm:text-xs font-bold shadow-sm">
                          Fast Results
                        </span>
                      </div>
                      <div className="relative mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500" />
                        <div className="absolute inset-y-0 left-[76%] w-14 bg-cyan-200/40 blur-md" />
                        <div className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ animation: "heroProgressShift 3.4s ease-in-out infinite" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
