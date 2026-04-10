import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { appendLog, getLogs, getUsers, removeUserByEmail, setLogs, setUsers } from "../services/storage";

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

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Admin() {
  const nav = useNavigate();
  const { user: sessionUser } = useSession();
  const [tab, setTab] = useState("overview");
  const [users, setUsersState] = useState([]);
  const [logs, setLogsState] = useState([]);
  const [logType, setLogType] = useState("all");
  const [q, setQ] = useState("");

  const refresh = () => {
    setUsersState(getUsers());
    setLogsState(getLogs());
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (sessionUser?.role !== "admin") {
      nav("/login", { replace: true });
    }
  }, [sessionUser?.role, nav]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const faceUsers = users.filter((u) => u?.hasFace).length;
    const disabledUsers = users.filter((u) => u?.disabled).length;
    const totalLogs = logs.length;
    const logins = logs.filter((l) => String(l?.type || "").startsWith("login")).length;
    const detects = logs.filter((l) => l?.type === "detect").length;
    const lastActivity = logs[0]?.ts || null;
    return { totalUsers, faceUsers, disabledUsers, totalLogs, logins, detects, lastActivity };
  }, [users, logs]);

  const filteredLogs = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (logType !== "all" && l?.type !== logType) return false;
      if (!qq) return true;
      const hay = `${l?.type || ""} ${l?.email || ""} ${JSON.stringify(l?.meta || {})}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [logs, logType, q]);

  const updateUser = (email, patch) => {
    const next = users.map((u) => (u?.email === email ? { ...u, ...patch } : u));
    setUsers(next);
    setUsersState(next);
    appendLog({ type: "admin_user_update", email, meta: patch });
  };

  const toggleDisable = (email) => {
    const u = users.find((x) => x?.email === email);
    if (!u) return;
    updateUser(email, { disabled: !u.disabled });
  };

  const deleteUser = (email) => {
    if (!email) return;
    const ok = window.confirm(`Delete user ${email}?`);
    if (!ok) return;
    removeUserByEmail(email);
    const nextUsers = getUsers();
    setUsersState(nextUsers);
    appendLog({ type: "admin_user_delete", email });
  };

  const clearLogs = () => {
    const ok = window.confirm("Clear all logs?");
    if (!ok) return;
    setLogs([]);
    setLogsState([]);
    appendLog({ type: "admin_clear_logs" });
  };

  const exportLogs = () => downloadJson(`deepcheck-logs-${Date.now()}.json`, logs);
  const exportUsers = () => downloadJson(`deepcheck-users-${Date.now()}.json`, users);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "from-blue-500 to-cyan-500" },
    { label: "Face Registered", value: stats.faceUsers, icon: "📸", color: "from-cyan-500 to-cyan-400" },
    { label: "Disabled", value: stats.disabledUsers, icon: "🚫", color: "from-red-500 to-rose-500" },
    { label: "Total Logs", value: stats.totalLogs, icon: "📋", color: "from-purple-500 to-violet-500" },
    { label: "Total Logins", value: stats.logins, icon: "🔐", color: "from-amber-500 to-orange-500" },
    { label: "Total Detections", value: stats.detects, icon: "🔍", color: "from-pink-500 to-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 to-transparent rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-xl tracking-tight">DeepCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
            >
              Refresh
            </button>
            <Link to="/" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition border border-white/10 text-gray-300">
              Back to home
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">User management • Activity logs • Statistics</p>
          </div>
          <div className="flex gap-2">
            {["overview", "users", "logs"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  tab === t
                    ? "bg-gradient-to-r from-[#0891b2] to-[#06b6d4] border-transparent shadow-lg shadow-cyan-600/25"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((c, i) => (
              <div key={i} className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{c.label}</p>
                    <p className="text-4xl font-bold mt-2">{c.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-white/[0.03] border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Last Activity</p>
                  <p className="text-lg font-medium mt-1">{formatDateTime(stats.lastActivity)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={exportUsers} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">
                    Export Users
                  </button>
                  <button onClick={exportLogs} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">
                    Export Logs
                  </button>
                  <button onClick={clearLogs} className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition">
                    Clear Logs
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold">User Accounts</h2>
                <p className="text-gray-500 text-sm mt-1">In-memory (session only)</p>
              </div>
              <button onClick={exportUsers} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">
                Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    {["Name", "Email", "Phone", "DOB", "Face", "Disabled", "Created", "Last Login", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 font-semibold text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-gray-500" colSpan={9}>No users yet.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id || u.email} className={`hover:bg-white/[0.02] transition ${u.disabled ? "opacity-50" : ""}`}>
                        <td className="px-5 py-4 text-white">{u.name || "—"}</td>
                        <td className="px-5 py-4 text-white">{u.email}</td>
                        <td className="px-5 py-4 text-gray-400">{u.phone || "—"}</td>
                        <td className="px-5 py-4 text-gray-400">{u.dodate || "—"}</td>
                        <td className="px-5 py-4">
                          {u.hasFace ? <span className="text-cyan-400 font-medium">Yes</span> : <span className="text-gray-500">No</span>}
                        </td>
                        <td className="px-5 py-4">
                          {u.disabled ? <span className="text-red-400 font-medium">Yes</span> : <span className="text-gray-500">No</span>}
                        </td>
                        <td className="px-5 py-4 text-gray-500">{formatDateTime(u.createdAt)}</td>
                        <td className="px-5 py-4 text-gray-500">{formatDateTime(u.lastLoginAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => toggleDisable(u.email)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition">
                              {u.disabled ? "Enable" : "Disable"}
                            </button>
                            <button onClick={() => deleteUser(u.email)} className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "logs" && (
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Activity Logs</h2>
                  <p className="text-gray-500 text-sm mt-1">In-memory (session only)</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportLogs} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition">
                    Export
                  </button>
                  <button onClick={clearLogs} className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition">
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  {[
                    ["all", "All types"],
                    ["register", "Register"],
                    ["login_email", "Login Email"],
                    ["login_face", "Login Face"],
                    ["detect", "Detect"],
                    ["logout", "Logout"],
                    ["admin_user_update", "Admin Update"],
                    ["admin_user_delete", "Admin Delete"],
                    ["admin_clear_logs", "Admin Clear Logs"],
                  ].map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search logs..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    {["Time", "Type", "Email", "Meta"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 font-semibold text-gray-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-gray-500" colSpan={4}>No logs found.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((l, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateTime(l.ts)}</td>
                        <td className="px-5 py-4 text-white">{l.type}</td>
                        <td className="px-5 py-4 text-gray-300">{l.email || "—"}</td>
                        <td className="px-5 py-4 text-gray-500">
                          <pre className="text-xs whitespace-pre-wrap break-all max-w-xs">{JSON.stringify(l.meta || {}, null, 2)}</pre>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
