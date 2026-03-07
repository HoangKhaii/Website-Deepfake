import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSession } from "../context/SessionContext";
import { detectVideo, detectImage } from "../services/api";
import { appendLog } from "../services/storage";

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout: sessionLogout } = useSession();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const logout = () => {
    appendLog({ type: "logout", email: user?.email });
    sessionLogout();
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
    if (!Number.isFinite(v)) return String(value);
    return `${v.toFixed(1)}%`;
  };

  const buildComparisonRows = (res, selectedFile) => {
    const rows = [];
    const usedKeys = new Set();

    if (selectedFile) {
      rows.push({ metric: "File", value: selectedFile.name });
      rows.push({ metric: "Type", value: selectedFile.type || "unknown" });
      rows.push({
        metric: "Size",
        value: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      });
    }

    if (res && typeof res === "object") {
      if (res.isDeepfake !== undefined) {
        rows.push({
          metric: "Verdict",
          value: res.isDeepfake ? "Deepfake" : "Real",
        });
        usedKeys.add("isDeepfake");
      }
      if (res.score !== undefined) {
        rows.push({ metric: "Confidence", value: formatPercent(res.score) });
        usedKeys.add("score");
      }

      const probs =
        res.probabilities && typeof res.probabilities === "object"
          ? res.probabilities
          : res.probs && typeof res.probs === "object"
            ? res.probs
            : res.scores && typeof res.scores === "object"
              ? res.scores
              : null;

      if (probs) {
        usedKeys.add("probabilities");
        usedKeys.add("probs");
        usedKeys.add("scores");
        for (const [k, v] of Object.entries(probs)) {
          if (typeof v === "number") {
            rows.push({ metric: `Score • ${k}`, value: formatPercent(v) });
          } else {
            rows.push({ metric: `Score • ${k}`, value: String(v) });
          }
        }
      } else {
        const maybePairs = [
          ["deepfake", "Deepfake"],
          ["fake", "Deepfake"],
          ["real", "Real"],
          ["authentic", "Real"],
        ];
        for (const [key, label] of maybePairs) {
          if (typeof res[key] === "number") {
            rows.push({ metric: `Score • ${label}`, value: formatPercent(res[key]) });
            usedKeys.add(key);
          }
        }
      }

      const extraKeys = Object.keys(res)
        .filter((k) => !usedKeys.has(k))
        .sort();

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
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = isImage(file)
        ? await detectImage(file, user?.user_id)
        : await detectVideo(file, user?.user_id);
      setResult(data);
      appendLog({
        type: "detect",
        email: user?.email,
        meta: {
          mediaType: isImage(file) ? "image" : "video",
          fileName: file.name,
          size: file.size,
          verdict:
            data && typeof data === "object" && "isDeepfake" in data
              ? Boolean(data.isDeepfake)
              : undefined,
          score: data && typeof data === "object" ? data.score : undefined,
        },
      });
    } catch (err) {
      setError(err.message || "Check failed. Please try again.");
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-lg font-bold">
            D
          </span>
          <span className="font-semibold text-lg tracking-tight">DeepCheck</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-slate-400 text-sm truncate max-w-[180px]" title={user.email}>
                {user.full_name || user.email}
              </span>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition border border-white/10 text-slate-300"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-400 hover:text-white text-sm font-medium transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <p className="text-violet-400 text-sm font-medium tracking-wider uppercase mb-4">
          Deepfake video detection tool
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Check video
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Deepfake in seconds
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Upload or scan video to analyze and get a trust score. Protect yourself from AI-manipulated content.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <a
              href="#check-video"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-lg shadow-lg shadow-violet-600/25 transition"
            >
              Check video / image
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-lg shadow-lg shadow-violet-600/25 transition"
            >
              Start checking
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Stats / trust */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 border-y border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "Fast analysis", label: "Results in seconds" },
            { value: "Advanced AI", label: "State-of-the-art detection" },
            { value: "Privacy", label: "Video not stored long-term" },
            { value: "Easy to use", label: "Upload or scan directly" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-violet-400/90 font-semibold text-sm mb-1">{item.value}</p>
              <p className="text-slate-500 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-2xl font-bold text-center mb-4">How it works</h2>
        <p className="text-slate-500 text-center max-w-xl mx-auto mb-16">
          A few simple steps to find out if a video is deepfake or not.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Upload video",
              desc: "Choose a video file from your device or use the camera to scan directly.",
              icon: "📤",
            },
            {
              step: "02",
              title: "Automatic analysis",
              desc: "AI analyzes each frame and looks for signs of manipulation.",
              icon: "🔍",
            },
            {
              step: "03",
              title: "View results",
              desc: "Get a trust report and detailed insights about the video.",
              icon: "📊",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 transition"
            >
              <span className="text-4xl mb-4 block">{item.icon}</span>
              <span className="text-violet-500/80 text-xs font-mono">{item.step}</span>
              <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Check video - when logged in */}
      {user && (
        <section id="check-video" className="relative z-10 max-w-6xl mx-auto px-6 py-12 scroll-mt-24">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-8 md:p-10">
            <h2 className="text-2xl font-bold mb-2">Check video & image</h2>
            <p className="text-slate-500 text-sm mb-6">
              Upload a video or image to analyze. Supported: MP4, WebM, JPG, PNG, etc.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <label className="flex-1 cursor-pointer">
                <span className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {file ? file.name : "Choose video or image"}
                </span>
                <input
                  id="media-upload"
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCheck}
                  disabled={loading || !file}
                  className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:pointer-events-none text-white transition shadow-lg shadow-violet-600/25"
                >
                  {loading ? "Checking…" : "Check"}
                </button>
                {(file || result) && (
                  <button
                    onClick={resetCheck}
                    disabled={loading}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {error && (
              <p className="mt-4 text-red-400 text-sm">{error}</p>
            )}
            {result && (
              <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-violet-400">Comparison</h3>
                  <span className="text-xs text-slate-500">
                    {isImage(file) ? "Image" : "Video"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    {previewUrl && isImage(file) ? (
                      <img
                        src={previewUrl}
                        alt="Uploaded preview"
                        className="w-full h-full object-contain max-h-[320px] bg-black"
                      />
                    ) : previewUrl ? (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-[320px] bg-black"
                      />
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No preview</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-white/[0.03]">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-slate-300">Metric</th>
                          <th className="text-left px-4 py-3 font-medium text-slate-300">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {buildComparisonRows(result, file).map((row) => (
                          <tr key={`${row.metric}-${row.value}`}>
                            <td className="px-4 py-3 text-slate-400">{row.metric}</td>
                            <td className="px-4 py-3 text-slate-200">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {"message" in result && result.message && (
                  <p className="mt-4 text-slate-400 text-sm">{result.message}</p>
                )}

                <details className="mt-4">
                  <summary className="text-sm text-slate-500 cursor-pointer select-none">
                    Raw response
                  </summary>
                  <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-64">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-white/10 p-10 md:p-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {user ? "You can check videos" : "Ready to check a video?"}
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            {user ? "Upload a video or image above to get the analysis result." : "Log in or sign up to use the deepfake detection tool."}
          </p>
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-900 font-semibold hover:bg-slate-100 transition"
            >
              Log in to get started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold">
              D
            </span>
            <span className="text-slate-500 text-sm">DeepCheck — Deepfake Video Check</span>
          </div>
          <p className="text-slate-600 text-sm">
            AI-powered deepfake video detection
          </p>
        </div>
      </footer>
    </div>
  );
}
