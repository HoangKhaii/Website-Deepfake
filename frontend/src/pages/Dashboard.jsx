import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { appendLog, getLogs } from "../services/storage";
import LandingDecorBackground from "./landing/LandingDecorBackground";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout: sessionLogout } = useSession();
  const { success, error: showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    setLogs(getLogs().filter((l) => l?.email === user?.email));
  }, [user, navigate]);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const myLogs = useMemo(() => {
    return logs.filter((l) => l?.email === user?.email);
  }, [logs, user]);

  const stats = useMemo(() => {
    const totalDetects = myLogs.filter((l) => l?.type === "detect").length;
    const deepfakesFound = myLogs.filter((l) => l?.type === "detect" && l?.meta?.verdict === true).length;
    const realContent = myLogs.filter((l) => l?.type === "detect" && l?.meta?.verdict === false).length;
    const lastActivity = myLogs[0]?.ts || null;
    return { totalDetects, deepfakesFound, realContent, lastActivity };
  }, [myLogs]);

  const logout = () => {
    appendLog({ type: "logout", email: user?.email });
    sessionLogout();
    success("Logged out successfully! See you next time.");
    navigate("/");
  };

  const handleProfileSave = () => {
    setEditingProfile(false);
    appendLog({ type: "profile_update", email: user?.email, meta: profileForm });
    success("Profile updated successfully!");
  };

  const donutPercents = useMemo(() => {
    const t = stats.totalDetects;
    if (t <= 0) return { realPct: 0, dfPct: 0 };
    return {
      realPct: (stats.realContent / t) * 100,
      dfPct: (stats.deepfakesFound / t) * 100,
    };
  }, [stats.totalDetects, stats.realContent, stats.deepfakesFound]);

  const statCards = [
    { label: "Total Analyses", value: stats.totalDetects, icon: "🔍", color: "from-blue-500 to-cyan-500", desc: "Files analyzed" },
    { label: "Deepfakes Found", value: stats.deepfakesFound, icon: "⚠️", color: "from-red-500 to-rose-500", desc: "Suspicious content" },
    { label: "Real Content", value: stats.realContent, icon: "✅", color: "from-cyan-500 to-cyan-400", desc: "Verified authentic" },
    { label: "Account Age", value: user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + " days" : "N/A", icon: "📅", color: "from-purple-500 to-violet-500", desc: "Since registration" },
  ];

  const recentActivity = myLogs.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 overflow-x-hidden font-sans">
      <LandingDecorBackground />
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm animate-dashboard-nav-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img src="/logo-deepfake.png" alt="DeepCheck" className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">DeepCheck</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium transition border border-slate-200 text-slate-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 animate-dashboard-main-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-8 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-cyan-600/30">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user?.full_name || "User"}</h1>
              <p className="text-slate-600 text-sm mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user?.hasFace ? (
                  <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-medium flex items-center gap-1 border border-cyan-200/80">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 4 0 0 4 018 0z" clipRule="evenodd"/></svg>
                    Face ID Active
                  </span>
                ) : (
                  <Link
                    to="/face-scan"
                    className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-medium hover:bg-amber-200/80 transition border border-amber-200/80"
                  >
                    Setup Face ID
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white font-semibold shadow-lg shadow-cyan-600/25 hover:shadow-cyan-600/40 transition transform hover:scale-105"
            >
              Start New Analysis
            </Link>
            <button
              onClick={logout}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "history", label: "History", icon: "📋" },
            { id: "statistics", label: "Statistics", icon: "📈" },
            { id: "profile", label: "Profile", icon: "👤" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold border transition whitespace-nowrap ${
                tab === t.id
                  ? "bg-gradient-to-r from-[#0891b2] to-[#06b6d4] border-transparent shadow-lg shadow-cyan-600/25 text-white"
                  : "bg-slate-100/90 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, i) => (
                <div key={i} className="group p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:border-cyan-300/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">{card.label}</p>
                      <p className="text-3xl font-bold mt-2 text-slate-900">{card.value}</p>
                      <p className="text-slate-600 text-xs mt-1">{card.desc}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-900">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/" className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 transition border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">🔍</div>
                    <div>
                      <p className="font-medium">New Analysis</p>
                      <p className="text-slate-600 text-sm">Check video or image</p>
                    </div>
                  </Link>
                  <Link to="/face-scan" className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 transition border border-slate-200/80">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">📸</div>
                    <div>
                      <p className="font-medium">{user?.hasFace ? "Update Face ID" : "Setup Face ID"}</p>
                      <p className="text-slate-600 text-sm">{user?.hasFace ? "Re-register your face" : "Enable face login"}</p>
                    </div>
                  </Link>
                  <button onClick={() => setTab("statistics")} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 transition border border-slate-200/80 w-full">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">📊</div>
                    <div>
                      <p className="font-medium">View Statistics</p>
                      <p className="text-slate-600 text-sm">Analysis trends</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                  <button
                    onClick={() => setTab("history")}
                    className="text-cyan-700 text-sm hover:text-cyan-800 font-medium transition"
                  >
                    View All
                  </button>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <div className="text-4xl mb-3">📭</div>
                    <p>No activity yet</p>
                    <Link to="/" className="text-cyan-700 hover:underline mt-2 inline-block font-medium">
                      Start your first analysis
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((log, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50/90 border border-slate-200/80"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              log?.type === "detect"
                                ? log?.meta?.verdict
                                  ? "bg-red-100 text-red-700"
                                  : "bg-cyan-100 text-cyan-800"
                                : log?.type?.includes("login")
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {log?.type === "detect" ? "🔍" : log?.type?.includes("login") ? "🔐" : "📝"}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{log?.type?.replace(/_/g, " ")}</p>
                            <p className="text-slate-600 text-xs">{log?.meta?.fileName || log?.meta?.mediaType || formatDateTime(log?.ts)}</p>
                          </div>
                        </div>
                        <span className="text-slate-600 text-sm">{formatDateTime(log?.ts)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200/80">
              <h2 className="text-xl font-bold text-slate-900">Analysis History</h2>
              <p className="text-slate-600 text-sm mt-1">All your deepfake detection analyses</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-sm">
                <thead className="bg-slate-50/90">
                  <tr>
                    {["Date", "Type", "File", "Result", "Confidence", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {myLogs.filter(l => l?.type === "detect").length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-slate-600 text-center" colSpan={6}>
                        No detection history yet.
                      </td>
                    </tr>
                  ) : (
                    myLogs.filter(l => l?.type === "detect").map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 text-slate-600">{formatDateTime(log?.ts)}</td>
                        <td className="px-5 py-4">
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium capitalize border border-blue-200/60">
                            {log?.meta?.mediaType || "file"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-900 max-w-[200px] truncate font-medium">{log?.meta?.fileName || "—"}</td>
                        <td className="px-5 py-4">
                          {log?.meta?.verdict === true ? (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium border border-red-200/60">
                              Deepfake
                            </span>
                          ) : log?.meta?.verdict === false ? (
                            <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 text-xs font-medium border border-cyan-200/60">
                              Real
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {log?.meta?.score ? `${(log.meta.score * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 text-xs font-medium border border-cyan-200/60">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {tab === "statistics" && (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full lg:col-span-2 p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-900">Detection Results Distribution</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <title>Result split: green is authentic, red is deepfake</title>
                        {/* Vòng nền — toàn bộ chu vi (~100 đơn vị) */}
                        <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        {/* Deepfake — cung đỏ sau phần real (stroke-dashoffset đẩy vào đúng đoạn) */}
                        {donutPercents.dfPct > 0 && (
                          <path
                            className="text-red-500 transition-all duration-1000"
                            strokeDasharray={`${donutPercents.dfPct}, ${100 - donutPercents.dfPct}`}
                            strokeDashoffset={-donutPercents.realPct}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="butt"
                          />
                        )}
                        {/* Real content — cung cyan */}
                        {donutPercents.realPct > 0 && (
                          <path
                            className="text-cyan-500 transition-all duration-1000"
                            strokeDasharray={`${donutPercents.realPct}, ${100 - donutPercents.realPct}`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="butt"
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-900">{stats.totalDetects > 0 ? Math.round((stats.realContent / stats.totalDetects) * 100) : 0}%</p>
                          <p className="text-slate-600 text-sm">Authentic</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                      <span className="text-slate-700">Real Content: {stats.realContent}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-slate-700">Deepfakes: {stats.deepfakesFound}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                      <span className="text-slate-700">Total: {stats.totalDetects}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-900">Activity Summary</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Analyses This Week</span>
                      <span className="font-bold">{myLogs.filter(l => l?.type === "detect" && new Date(l?.ts) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: `${Math.min(100, myLogs.filter(l => l?.type === "detect" && new Date(l?.ts) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length * 10)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Login Count</span>
                      <span className="font-bold">{myLogs.filter(l => l?.type?.includes("login")).length}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${Math.min(100, myLogs.filter(l => l?.type?.includes("login")).length * 5)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Success Rate</span>
                      <span className="font-bold">{stats.totalDetects > 0 ? Math.round((stats.realContent / stats.totalDetects) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: `${stats.totalDetects > 0 ? (stats.realContent / stats.totalDetects) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
              <h3 className="text-lg font-bold mb-6 text-slate-900">Timeline Activity</h3>
              <div className="space-y-4">
                {myLogs.slice(0, 15).map((log, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <div className="flex-1 flex items-center justify-between py-2 border-b border-slate-200/80 last:border-0">
                      <div>
                        <p className="font-medium capitalize">{log?.type?.replace(/_/g, " ")}</p>
                        <p className="text-slate-600 text-sm">{log?.meta?.fileName || log?.meta?.mediaType || ""}</p>
                      </div>
                      <span className="text-slate-600 text-sm">{formatDateTime(log?.ts)}</span>
                    </div>
                  </div>
                ))}
                {myLogs.length === 0 && (
                  <p className="text-center text-slate-600 py-8">No activity recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
                <button
                  onClick={() => editingProfile ? handleProfileSave() : setEditingProfile(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] text-white text-sm font-semibold transition shadow-md shadow-cyan-600/20"
                >
                  {editingProfile ? "Save Changes" : "Edit Profile"}
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-slate-200/80">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white flex items-center justify-center text-4xl font-bold shadow-xl">
                    {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user?.full_name || "User"}</h3>
                    <p className="text-slate-500">{user?.email}</p>
                    <p className="text-slate-600 text-sm mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">Full Name</label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-lg font-medium">{user?.full_name || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 text-sm mb-2">Email Address</label>
                    <p className="text-lg font-medium">{user?.email}</p>
                    <p className="text-slate-600 text-sm mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-sm mb-2">Phone Number</label>
                    {editingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-lg font-medium">{user?.phone || "—"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 text-sm mb-2">Date of Birth</label>
                    <p className="text-lg font-medium">{user?.dob || "—"}</p>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-sm mb-2">Face ID Status</label>
                    <div className="flex items-center gap-3">
                      {user?.hasFace ? (
                        <>
                          <span className="px-4 py-2 rounded-xl bg-cyan-100 text-cyan-900 font-medium border border-cyan-200/80">
                            Active
                          </span>
                          <Link to="/face-scan" className="text-cyan-700 hover:text-cyan-900 text-sm font-medium">
                            Re-register
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-medium">Not Set Up</span>
                          <Link to="/face-scan" className="text-cyan-700 hover:text-cyan-900 text-sm font-medium">
                            Set up now
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-red-700">Danger Zone</h3>
              <p className="text-slate-600 text-sm mb-4">Once you delete your account, there is no going back.</p>
              <button className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-sm font-medium transition">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
