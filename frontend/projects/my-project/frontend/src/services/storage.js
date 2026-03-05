// In-memory only — no localStorage (database ảo đã bỏ hoàn toàn)

let users = [];
let logs = [];

const id = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const getUsers = () => [...users];
export const setUsers = (next) => {
  users = Array.isArray(next) ? next : [];
};

export const upsertUserByEmail = (partial) => {
  if (!partial?.email) return null;
  const now = new Date().toISOString();
  const idx = users.findIndex((u) => u?.email === partial.email);

  if (idx === -1) {
    const user = {
      id: id(),
      createdAt: now,
      disabled: false,
      hasFace: false,
      ...partial,
    };
    users = [user, ...users];
    return user;
  }

  const existing = users[idx];
  const updated = { ...existing, ...partial };
  users[idx] = updated;
  return updated;
};

export const removeUserByEmail = (email) => {
  if (!email) return;
  users = users.filter((u) => u?.email !== email);
};

export const getLogs = () => [...logs];
export const setLogs = (next) => {
  logs = Array.isArray(next) ? next : [];
};

export const appendLog = (event) => {
  const entry = {
    id: id(),
    ts: new Date().toISOString(),
    ...event,
  };
  logs = [entry, ...logs];
  return entry;
};
