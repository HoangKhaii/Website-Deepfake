import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../components/Notification";
import { forgotPasswordEmail, forgotPasswordVerify } from "../services/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const { success, error: showError } = useNotification();
  
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP, 3: nhập mật khẩu mới
  const [identifier, setIdentifier] = useState(""); // email
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const otpInputRef = useRef(null);
  const [error, setError] = useState("");

  // Timer cho countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  // Auto-focus OTP input when shown
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*...)";
    }
    return "";
  };

  const sendOtp = async () => {
    setError("");
    if (!identifier) {
      setError("Please enter your email");
      showError("Please enter your email");
      return;
    }
    if (!identifier.endsWith("@gmail.com")) {
      setError("Email must be @gmail.com");
      showError("Email must be @gmail.com");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordEmail(identifier);
      setStep(2);
      setCountdown(60);
      setResendDisabled(true);
      success("OTP sent to your email!");
    } catch (err) {
      const errorMsg = err.message || "Failed to send OTP";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && otpCode.length === 6) {
      verifyOtp();
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter 6-digit OTP code");
      showError("Please enter 6-digit OTP code");
      return;
    }

    // Gọi API xác thực OTP trước khi chuyển bước
    setLoading(true);
    try {
      await forgotPasswordVerify(identifier, otpCode, "", "email");
      // Nếu xác thực thành công thì mới chuyển sang bước nhập mật khẩu mới
      setStep(3);
    } catch (err) {
      const errorMsg = err.message || "Invalid or expired OTP";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendDisabled) return;
    await sendOtp();
  };

  const resetPassword = async () => {
    const msg = validatePassword(newPassword);
    if (msg) {
      setError(msg);
      showError(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      showError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordVerify(identifier, otpCode, newPassword, "email");
      success("Password reset successfully! Please login with your new password.");
      nav("/login");
    } catch (err) {
      const errorMsg = err.message || "Failed to reset password";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpCode("");
      setCountdown(0);
      setResendDisabled(false);
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Step 2: OTP Form
  if (step === 2) {
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
          </div>
        </nav>

        {/* OTP Form */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="w-full max-w-[420px]">
            <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 md:p-10 shadow-xl shadow-slate-200/50 animate-fade-in-up">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>

              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>

              <div className="text-center mb-8 relative">
                <button
                  onClick={goBack}
                  className="absolute left-0 top-0 p-2 text-slate-500 hover:text-slate-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-800">Verify Your Identity</h1>
                <p className="text-slate-600 text-sm">
                  We've sent a 6-digit code to<br />
                  <span className="font-semibold text-cyan-600">{identifier}</span>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-slate-600 text-sm font-medium mb-2 text-center">Enter OTP Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={handleOtpChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="------"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otpCode.length !== 6}
                className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>

              <div className="text-center mt-6">
                <p className="text-slate-600 text-sm">
                  Didn't receive the code?{" "}
                  {resendDisabled ? (
                    <span className="text-slate-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={resendOtp}
                      disabled={loading}
                      className="text-cyan-600 hover:text-cyan-700 font-semibold transition hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: New Password Form
  if (step === 3) {
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
          </div>
        </nav>

        {/* New Password Form */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="w-full max-w-[420px]">
            <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 md:p-10 shadow-xl shadow-slate-200/50 animate-fade-in-up">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>

              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>

              <div className="text-center mb-8 relative">
                <button
                  onClick={goBack}
                  className="absolute left-0 top-0 p-2 text-slate-500 hover:text-slate-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743l-1.227 1.227m0 0l2.827-2.827m-2.827 0L9 13m5 5l4-4m-4 4v7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-800">Create New Password</h1>
                <p className="text-slate-600 text-sm">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-5 mb-6">
                <div className="relative">
                  <label className="block text-slate-600 text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="Create a new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char</p>
                </div>

                <div className="relative">
                  <label className="block text-slate-600 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={resetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Reset Password
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Enter email
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 md:p-10 shadow-xl shadow-slate-200/50 animate-fade-in-up">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>

            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>

            <div className="text-center mb-8 relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743l-1.227 1.227m0 0l2.827-2.827m-2.827 0L9 13m5 5l4-4m-4 4v7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-slate-800">Forgot Password</h1>
              <p className="text-slate-600">Enter your email to receive OTP</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-5 mb-6">
              <div className="relative">
                <label className="block text-slate-600 text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="your.email@gmail.com"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Send OTP
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            <div className="text-center mt-8 pt-6 border-t border-slate-200/50 relative">
              <p className="text-slate-600">
                Remember your password?{" "}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold transition hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="text-center mt-4">
              <Link to="/" className="text-slate-500 hover:text-slate-700 text-sm transition inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
