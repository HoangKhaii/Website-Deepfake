import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { register as apiRegister } from "../services/api";

export default function Register() {
  const nav = useNavigate();
  const { setUser, setToken, setPendingRegister } = useSession();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dodate, setDodate] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    // Email must be Gmail
    if (!email.endsWith("@gmail.com")) {
      return "Email must be @gmail.com";
    }

    // Password conditions: min 8 chars, uppercase, lowercase, number, special char
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

    // Confirm password
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    // Phone: exactly 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return "Phone must be exactly 10 digits";
    }

    // Date of birth
    if (!dodate) {
      return "Please select date of birth";
    }

    return "";
  };

  const submit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRegister({
        username: email,
        email,
        password,
        phone_number: phone || null,
        full_name: name || null,
      });
      setUser(res.user);
      setToken(res.token);
      setPendingRegister({ name, email, password, phone, dodate });
      nav("/face-scan?type=register");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
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
          <Link
            to="/login"
            className="text-slate-400 hover:text-white text-sm font-medium transition"
          >
            Log in
          </Link>
          <span className="px-4 py-2 rounded-lg bg-white/10 text-sm font-medium border border-white/10">
            Sign up
          </span>
        </div>
      </nav>

      {/* Form card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        <div className="w-full max-w-[420px] rounded-2xl p-8 bg-white/[0.03] border border-white/10 shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Sign up</h1>

          {error && (
            <p className="mb-4 text-sm text-red-400 text-center">{error}</p>
          )}

          <input
            className="w-full p-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Email (@gmail.com)"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 mb-1 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-slate-500 mb-3">
            Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
          </p>
          <input
            type="password"
            className="w-full p-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <input
            className="w-full p-3 mb-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Phone Number (10 digits)"
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="date"
            className="w-full p-3 mb-6 rounded-xl bg-white/5 border border-white/10 text-white text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 [color-scheme:dark]"
            onChange={(e) => setDodate(e.target.value)}
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-600/25 disabled:opacity-50"
          >
            {loading ? "Registering…" : "Continue"}
          </button>

          <div className="text-center mt-6 space-y-2">
            <Link to="/login" className="block text-sm text-violet-400 hover:text-violet-300">
              Already have an account? Log in
            </Link>
            <Link to="/" className="block text-sm text-slate-500 hover:text-slate-400">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
