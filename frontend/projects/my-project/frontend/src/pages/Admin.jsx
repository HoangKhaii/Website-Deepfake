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
  const [tab, setTab] = useState("overview"); // overview | users | logs
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
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
          >
            Refresh
          </button>
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition border border-white/10 text-slate-300"
          >
            Back to home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              User management • Activity logs • Basic statistics (in-memory)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "overview"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-transparent"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "users"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-transparent"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setTab("logs")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "logs"
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-transparent"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              Logs
            </button>
          </div>
        </div>

        {tab === "overview" && (
          <section className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Total users", value: stats.totalUsers },
              { label: "Face-registered users", value: stats.faceUsers },
              { label: "Disabled users", value: stats.disabledUsers },
              { label: "Total logs", value: stats.totalLogs },
              { label: "Total logins", value: stats.logins },
              { label: "Total checks", value: stats.detects },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                <p className="text-slate-500 text-sm">{c.label}</p>
                <p className="text-3xl font-bold mt-2">{c.value}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 md:col-span-3">
              <p className="text-slate-500 text-sm">Last activity</p>
              <p className="text-lg font-medium mt-2">{formatDateTime(stats.lastActivity)}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={exportUsers}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
                >
                  Export users JSON
                </button>
                <button
                  onClick={exportLogs}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
                >
                  Export logs JSON
                </button>
                <button
                  onClick={clearLogs}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition text-rose-300"
                >
                  Clear logs
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">User accounts</h2>
                <p className="text-slate-500 text-sm mt-1">In-memory (session only)</p>
              </div>
              <button
                onClick={exportUsers}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
              >
                Export
              </button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    {["Name", "Email", "Phone", "DOB", "Face", "Disabled", "Created", "Last login", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={9}>
                        No users yet.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id || u.email} className={u.disabled ? "opacity-60" : ""}>
                        <td className="px-4 py-3 text-slate-200">{u.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-200">{u.email}</td>
                        <td className="px-4 py-3 text-slate-400">{u.phone || "—"}</td>
                        <td className="px-4 py-3 text-slate-400">{u.dodate || "—"}</td>
                        <td className="px-4 py-3">
                          {u.hasFace ? (
                            <span className="text-emerald-400 font-medium">Yes</span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.disabled ? (
                            <span className="text-rose-300 font-medium">Yes</span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(u.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(u.lastLoginAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleDisable(u.email)}
                              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition"
                            >
                              {u.disabled ? "Enable" : "Disable"}
                            </button>
                            <button
                              onClick={() => deleteUser(u.email)}
                              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition text-rose-300"
                            >
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
          <section className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <div className="p-5 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">User activity logs</h2>
                  <p className="text-slate-500 text-sm mt-1">In-memory (session only)</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportLogs}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition"
                  >
                    Export
                  </button>
                  <button
                    onClick={clearLogs}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition text-rose-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200"
                >
                  {[
                    ["all", "All types"],
                    ["register", "register"],
                    ["login_email", "login_email"],
                    ["login_face", "login_face"],
                    ["detect", "detect"],
                    ["logout", "logout"],
                    ["admin_user_update", "admin_user_update"],
                    ["admin_user_delete", "admin_user_delete"],
                    ["admin_clear_logs", "admin_clear_logs"],
                  ].map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (email, type, meta...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-white/[0.03]">
                  <tr>
                    {["Time", "Type", "Email", "Meta"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        No logs.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(l.ts)}</td>
                        <td className="px-4 py-3 text-slate-200">{l.type}</td>
                        <td className="px-4 py-3 text-slate-200">{l.email || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">
                          <pre className="text-xs whitespace-pre-wrap break-words">
                            {JSON.stringify(l.meta || {}, null, 2)}
                          </pre>
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
