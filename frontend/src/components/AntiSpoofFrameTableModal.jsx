import { useMemo } from "react";

/**
 * Modal bảng kết quả Silent-Face từng frame (đăng nhập mặt).
 * @param {{ open: boolean, loading?: boolean, onClose: () => void, frames: array, fusion: object | null, title?: string, subtitle?: string, outcome?: 'loading' | 'success' | 'liveness_fail' | 'match_fail' }} props
 */
export default function AntiSpoofFrameTableModal({
  open,
  loading = false,
  onClose,
  frames = [],
  fusion = null,
  title = "Silent-Face verification results",
  subtitle = "",
  outcome = "success",
}) {
  const summary = useMemo(() => {
    if (loading) return null;
    if (!fusion || typeof fusion !== "object") return null;
    return {
      nReal: fusion.nReal,
      nFake: fusion.nFake,
      nUnknown: fusion.nUnknown,
      minMajority: fusion.minMajority ?? fusion.votingMin,
    };
  }, [fusion, loading]);

  if (!open) return null;

  const verdictLabel = (v) => {
    if (v === "real") return { text: "REAL", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" };
    if (v === "fake") return { text: "FAKE", className: "bg-rose-100 text-rose-800 ring-rose-200" };
    return { text: "—", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  };

  const outcomeBar =
    loading || outcome === "loading"
      ? "border-cyan-400 bg-cyan-50/90"
      : outcome === "success"
      ? "border-emerald-400 bg-emerald-50/90"
      : outcome === "liveness_fail"
      ? "border-amber-400 bg-amber-50/90"
      : "border-rose-400 bg-rose-50/90";

  const footerLabel =
    loading || outcome === "loading"
      ? "Processing..."
      : outcome === "success"
      ? "Close and continue"
      : outcome === "force_email"
      ? "Close and log in with email"
      : "Close";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="anti-spoof-modal-title"
        aria-busy={loading}
        className="flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20"
      >
        <div className={`shrink-0 border-b-2 px-4 py-3 sm:px-5 ${outcomeBar}`}>
          <h2 id="anti-spoof-modal-title" className="text-base font-bold text-slate-900 sm:text-lg">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-700 sm:text-sm">{subtitle}</p> : null}
          {summary && summary.minMajority != null ? (
            <p className="mt-2 text-xs text-slate-800 sm:text-sm">
              <span className="font-semibold">Summary:</span>{" "}
              <span className="text-emerald-700">{summary.nReal ?? 0} real</span>
              {" · "}
              <span className="text-rose-700">{summary.nFake ?? 0} fake</span>
              {summary.nUnknown > 0 ? (
                <>
                  {" · "}
                  <span className="text-slate-600">{summary.nUnknown} API errors</span>
                </>
              ) : null}
              {" · "}
              <span className="font-medium">need &gt;= {summary.minMajority} real frames to pass</span>
            </p>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-12">
              <svg
                className="h-12 w-12 animate-spin text-cyan-600"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm font-medium text-slate-600">Silent-Face is analyzing frames...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 backdrop-blur">
                <tr>
                  <th className="px-2 py-2 font-semibold text-slate-700 sm:px-3">#</th>
                  <th className="px-2 py-2 font-semibold text-slate-700 sm:px-3">Result</th>
                  <th className="hidden px-2 py-2 font-semibold text-slate-700 sm:table-cell sm:px-3">P(real)</th>
                  <th className="hidden px-2 py-2 font-semibold text-slate-700 md:table-cell md:px-3">Label</th>
                  <th className="hidden px-2 py-2 font-semibold text-slate-700 lg:table-cell lg:px-3">Class</th>
                  <th className="px-2 py-2 font-semibold text-slate-700 sm:px-3">Blur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frames.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No detailed rows returned by server (check antilogin-gateway / Silent-Face).
                    </td>
                  </tr>
                ) : (
                  frames.map((row, i) => {
                    const v = verdictLabel(row.verdict);
                    const p1 = row.probabilities?.class_1;
                    const probDisplay =
                      row.probReal != null
                        ? row.probReal
                        : typeof p1 === "number"
                        ? Math.round(p1 * 10000) / 10000
                        : "—";
                    return (
                      <tr key={row.index ?? i} className="bg-white hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-2 py-1.5 text-slate-600 sm:px-3 sm:py-2">
                          {(row.index ?? i) + 1}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 sm:text-xs ${v.className}`}
                          >
                            {v.text}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-2 py-1.5 text-slate-700 sm:table-cell sm:px-3 sm:py-2">
                          {probDisplay === "—" ? "—" : Number(probDisplay).toFixed(4)}
                        </td>
                        <td className="hidden whitespace-nowrap px-2 py-1.5 text-slate-600 md:table-cell md:px-3 md:py-2">
                          {row.label != null ? String(row.label) : "—"}
                        </td>
                        <td className="hidden px-2 py-1.5 text-slate-600 lg:table-cell lg:px-3 lg:py-2">
                          {row.class != null ? row.class : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600 sm:px-3 sm:py-2">
                          {row.isBlur ? "Yes" : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (!loading) onClose();
            }}
            className="w-full rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-[#06b6d4] hover:to-[#22d3ee] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
          >
            {footerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
