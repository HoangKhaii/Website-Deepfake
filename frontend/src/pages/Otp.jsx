import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { otpSend, otpVerify, registerOtpVerify } from "../services/api";

export default function Otp() {
  const nav = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const type = params.get("type");
  const { pendingLogin, setUser, setToken, setPendingLogin } = useSession();
  const { success, error: showError } = useNotification();
  const [time, setTime] = useState(120);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (time === 0) return;
    const t = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);

  useEffect(() => {
    if (type === "login-email" && pendingLogin?.email) {
      otpSend(pendingLogin.email).catch((err) => {
        setError(err.message);
        showError(err.message || "Failed to send OTP");
      });
    }
  }, [type, pendingLogin?.email, showError]);

  const verify = async (selectedCode) => {
    if (type === "register") {
      const regEmail = location.state?.email;
      const codeToVerify = (selectedCode ?? otpCode).trim().replace(/\s/g, "");
      if (!regEmail) {
        showError("Missing registration info. Go back to Register and complete OTP there.");
        return;
      }
      if (!codeToVerify || codeToVerify.length !== 6) {
        showError("Please enter all 6 OTP digits.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await registerOtpVerify(regEmail, codeToVerify);
        setUser(res.user);
        setToken(res.token ?? null);
        success("OTP verified. Please complete face registration.");
        const emailKey = String(regEmail).trim().toLowerCase();
        nav("/face-scan?type=register", { state: { email: emailKey } });
      } catch (err) {
        const errorMsg = err.message || "Invalid or expired OTP";
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
      return;
    }

    const codeToVerify =
      type === "login-mfa" ? selectedCode : otpCode.trim();

    if (!codeToVerify || !pendingLogin?.email) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await otpVerify(pendingLogin.email, codeToVerify);
      setUser(res.user);
      setToken(res.token);
      setPendingLogin(null);
      success("Verification successful! Welcome back.");
      nav("/");
    } catch (err) {
      const errorMsg = err.message || "Invalid OTP";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    // Chuẩn hóa độ dài chuỗi OTP thành 6 ký tự
    const newOtp = otpCode.split("");
    while (newOtp.length < 6) newOtp.push("");

    // Mỗi ô input chỉ chứa 1 ký tự, nên lấy trực tiếp value
    newOtp[index] = value || "";
    const finalOtp = newOtp.join("").trim();
    setOtpCode(finalOtp);

    // Tự động chuyển sang ô tiếp theo khi đã nhập 1 số
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = () => {
    if (time === 0 && pendingLogin?.email) {
      setTime(120);
      otpSend(pendingLogin.email).catch((err) => setError(err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.5%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-xl tracking-tight text-slate-800">DeepCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm">Verify OTP</span>
            <Link to="/login" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition border border-slate-200 text-slate-700">
              Back to login
            </Link>
          </div>
        </div>
      </nav>

      {/* Card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        <div className="w-full max-w-[440px]">
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 md:p-10 shadow-xl shadow-slate-200/50 animate-fade-in-up">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>
            
            <div className="text-center mb-8 relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-slate-800">
                {type === "login-mfa" ? "Verify Your Device" : "Verify OTP"}
              </h1>
              <p className="text-slate-600">
                {type === "login-mfa"
                  ? "Select the code that matches one of the codes in your email."
                  : "Enter the one-time password we sent to your email"}
              </p>
            </div>

            {type === "login-email" && (
              <p className="mb-6 text-center">
                <span className="text-slate-500">Sent to </span>
                <span className="text-cyan-600 font-semibold">{pendingLogin?.email || "your email"}</span>
              </p>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Timer */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-center">
              <p className="text-slate-500 text-sm mb-1">Time remaining</p>
              <p className={`text-3xl font-bold ${time < 30 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                {formatTime(time)}
              </p>
            </div>

            {type === "login-mfa" && pendingLogin?.mfa?.codes ? (
              <>
                {/* MFA lựa chọn 3 mã */}
                <div className="mb-6 space-y-3">
                  {pendingLogin.mfa.codes.map((code, idx) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => verify(code)}
                      disabled={loading}
                      className="w-full py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-green-50 text-lg font-semibold tracking-[0.3em] text-slate-800 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                        Option {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{code}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* OTP Input 6 số (flow cũ) */}
                <div className="mb-6 flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpCode[index] || ""}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setFocusedIndex(index)}
                      className={`w-12 h-14 rounded-xl text-center text-2xl font-bold transition-all ${
                        focusedIndex === index
                          ? 'bg-green-50 border-2 border-green-500 text-green-700 shadow-lg shadow-green-500/20'
                          : 'bg-slate-100 border border-slate-200 text-slate-800'
                      } focus:outline-none`}
                      placeholder="-"
                    />
                  ))}
                </div>

                <button
                  onClick={() => verify()}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white transition-all shadow-xl shadow-green-600/20 hover:shadow-green-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verify OTP
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              </>
            )}

            {time === 0 && (
              <button 
                onClick={handleResend}
                className="mt-6 w-full py-3 text-cyan-600 hover:text-cyan-700 text-sm font-medium text-center transition hover:underline"
              >
                Resend OTP
              </button>
            )}

            {time > 0 && (
              <p className="mt-6 text-center text-slate-500 text-sm">
                Didn't receive? Resend in <span className="text-cyan-600 font-medium">{formatTime(time)}</span>
              </p>
            )}

            <div className="text-center mt-8 pt-6 border-t border-slate-200/50 relative">
              <Link to="/login" className="text-slate-500 hover:text-slate-700 text-sm transition inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </Link>
            </div>
          </div>

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-6 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Verification
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
