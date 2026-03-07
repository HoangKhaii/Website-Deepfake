import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { login as apiLogin } from "../services/api";

export default function Login() {
  const nav = useNavigate();
  const { setUser, setToken } = useSession();
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginEmail = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setUser(res.user);
      setToken(res.token);
      if (res.user?.role === "admin") nav("/admin");
      else nav("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginFace = () => {
    nav("/face-scan?type=login-face");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Background gradient mesh - same as Landing */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Nav - same as Landing */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-lg font-bold">
            D
          </span>
          <span className="font-semibold text-lg tracking-tight">DeepCheck</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm font-medium">Log in</span>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Form card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-[420px] rounded-2xl p-8 bg-white/[0.03] border border-white/10 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-6">
            Log in
          </h1>

          {/* Switch buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode("email");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                mode === "email"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => {
                setMode("face");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                mode === "face"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              Face
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          {mode === "email" && (
            <>
              <input
                className="w-full mb-3 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                className="w-full mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={loginEmail}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-600/25 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Continue"}
              </button>
            </>
          )}

          {mode === "face" && (
            <button
              onClick={loginFace}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-600/25"
            >
              Start Face Scan
            </button>
          )}

          <div className="text-center mt-6 space-y-2">
            <button
              onClick={() => nav("/register")}
              className="block w-full text-sm text-violet-400 hover:text-violet-300"
            >
              Don't have an account? Sign up
            </button>
            <Link to="/" className="block text-sm text-slate-500 hover:text-slate-400">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
