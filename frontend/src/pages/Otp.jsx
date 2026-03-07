import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { otpSend, otpVerify } from "../services/api";

export default function Otp() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const type = params.get("type");
  const { pendingLogin, setUser, setToken, setPendingLogin } = useSession();
  const [time, setTime] = useState(120);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (time === 0) return;
    const t = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);

  useEffect(() => {
    if (type === "login-email" && pendingLogin?.email) {
      otpSend(pendingLogin.email).catch((err) => setError(err.message));
    }
  }, [type, pendingLogin?.email]);

  const verify = async () => {
    if (type === "register") {
      nav("/face-scan?type=register");
      return;
    }
    if (type === "login-email" && pendingLogin?.email && otpCode.trim()) {
      setError("");
      setLoading(true);
      try {
        const res = await otpVerify(pendingLogin.email, otpCode.trim());
        setUser(res.user);
        setToken(res.token);
        setPendingLogin(null);
        nav("/");
      } catch (err) {
        setError(err.message || "Invalid OTP");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Background gradient mesh - same as other auth pages */}
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
          <span className="text-slate-400 text-sm font-medium">Verify OTP</span>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
          >
            Back to login
          </Link>
        </div>
      </nav>

      {/* Card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        <div className="w-full max-w-[420px] rounded-2xl p-8 bg-white/[0.03] border border-white/10 shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-center">Verify OTP</h2>
          <p className="text-slate-500 text-sm mb-4 text-center">
            Enter the one-time password we sent to your email to complete sign in.
          </p>

          {type === "login-email" && (
            <p className="mb-2 text-sm text-center text-slate-300">
              Sent to{" "}
              <span className="font-semibold text-white">
                {pendingLogin?.email || "your email"}
              </span>
            </p>
          )}

          {error && <p className="mb-2 text-sm text-center text-red-400">{error}</p>}

          <p className="mb-4 text-xs text-center text-slate-500">
            Time left: <span className="font-semibold text-slate-200">{time}s</span>
          </p>

          <input
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 tracking-[0.3em] text-center"
            placeholder="••••••"
            maxLength={6}
          />

          <button
            onClick={verify}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-600/25 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>

          {time === 0 && (
            <button className="mt-4 text-sm text-violet-400 hover:text-violet-300 w-full text-center">
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
