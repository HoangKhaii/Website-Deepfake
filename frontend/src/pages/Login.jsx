import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { login as apiLogin, API_BASE } from "../services/api";

const ERROR_MESSAGES = {
  google_not_configured: "Google đăng nhập chưa được cấu hình. Vui lòng cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET thật trong file .env của server.",
  google_auth_failed: "Đăng nhập Google thất bại. Bạn có thể thử lại hoặc dùng đăng nhập bằng email.",
};

export default function Login() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken, setPendingLogin } = useSession();
  const { success, error: showError } = useNotification();
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && ERROR_MESSAGES[err]) {
      setError(ERROR_MESSAGES[err]);
      showError(ERROR_MESSAGES[err]);
    }
  }, [searchParams]);

  const loginEmail = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      showError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(email, password);

      // Nếu cần xác thực 2 bước (thiết bị mới) → sang trang nhập mã OTP 6 số
      if (res.requiresVerification) {
        setPendingLogin({ email });
        nav("/otp?type=login-email");
        return;
      }
      
      // Đăng nhập bình thường
      if (res.token) {
        setToken(res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
      success("Login successful! Welcome back.");
      if (res.user?.role === "admin") nav("/admin");
      else nav("/");
    } catch (err) {
      const errorMsg = err.message || "Login failed";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginFace = () => {
    if (!email || !email.trim()) {
      setError("Please enter your email to sign in with Face ID");
      showError("Please enter your email to sign in with Face ID");
      return;
    }
    nav(`/face-scan?type=login-face&email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.5%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-cyan-500/40 animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-blue-500/40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-xl tracking-tight text-slate-800">DeepCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm">Log in</span>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-sm font-semibold transition shadow-lg shadow-cyan-600/25">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-[440px]">
          {/* Form card */}
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 md:p-10 shadow-xl shadow-slate-200/50 animate-fade-in-up">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>
            
            <div className="text-center mb-8 relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-slate-800">Welcome Back</h1>
              <p className="text-slate-600">Sign in to continue to DeepCheck</p>
            </div>

            {/* Switch buttons */}
            <div className="flex gap-3 mb-6 p-1.5 rounded-2xl bg-slate-100/80 backdrop-blur">
              <button
                onClick={() => { setMode("email"); setError(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === "email" || mode === null
                    ? "bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white shadow-lg shadow-cyan-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-16 6h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                  </svg>
                  Email
                </span>
              </button>
              <button
                onClick={() => { setMode("face"); setError(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === "face"
                    ? "bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white shadow-lg shadow-cyan-600/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h2l1-2h8l1 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                    <circle cx="12" cy="14" r="3" strokeWidth={2} />
                  </svg>
                  Face ID
                </span>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center flex items-center justify-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {(mode === "email" || mode === null) && (
              <>
                <div className="space-y-5 mb-6">
                  <div className="relative">
                    <label className="block text-slate-600 text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-slate-600 text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-14 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        placeholder="Enter your password"
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
                  </div>
                </div>
                <button
                  onClick={loginEmail}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>

                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium transition hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {mode === "face" && (
              <div className="space-y-5">
                <p className="text-slate-600 text-sm">Enter your email, then we'll verify your face.</p>
                <div className="relative">
                  <label className="block text-slate-600 text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-100/80 backdrop-blur border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="your.email@gmail.com"
                    />
                  </div>
                </div>
                <button
                  onClick={loginFace}
                  className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Start Face Scan
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                </button>
              </div>
            )}

            {/* Google Login Button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <a
                href={`${API_BASE}/auth/google`}
                className="mt-4 w-full py-3.5 rounded-2xl font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>
            </div>

            <div className="text-center mt-8 pt-6 border-t border-slate-200/50 relative">
              <p className="text-slate-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-cyan-600 hover:text-cyan-700 font-semibold transition hover:underline">
                  Sign up
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

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Login
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
