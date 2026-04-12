import { createContext, useContext, useState, useCallback } from "react";

const SessionContext = createContext(null);
const SESSION_KEY = "deepcheck_session_v1";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveSession(next) {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch (e) {
    // Ignore storage errors (private mode, quota, ...)
  }
}

export function SessionProvider({ children }) {
  const initial = loadSession();
  const [user, setUserState] = useState(initial?.user || null);
  const [token, setTokenState] = useState(initial?.token || null);
  const [pendingLogin, setPendingLoginState] = useState(initial?.pendingLogin || null); // { email, mfaCodes? }
  const [pendingRegister, setPendingRegisterState] = useState(initial?.pendingRegister || null);
  const [faceUsers, setFaceUsersState] = useState(initial?.faceUsers || {});

  const persist = useCallback((patch) => {
    const next = {
      user,
      token,
      pendingLogin,
      pendingRegister,
      faceUsers,
      ...patch,
    };
    saveSession(next);
  }, [user, token, pendingLogin, pendingRegister, faceUsers]);

  const setUser = useCallback((u) => {
    setUserState(u);
    persist({ user: u });
  }, [persist]);
  const setToken = useCallback((t) => {
    setTokenState(t);
    persist({ token: t });
  }, [persist]);
  const setPendingLogin = useCallback((p) => {
    setPendingLoginState(p);
    persist({ pendingLogin: p });
  }, [persist]);
  const setPendingRegister = useCallback((p) => {
    setPendingRegisterState(p);
    persist({ pendingRegister: p });
  }, [persist]);

  const setFaceRegistered = useCallback((email) => {
    setFaceUsersState((prev) => {
      if (!email) return prev;
      const next = { ...prev, [email]: true };
      persist({ faceUsers: next });
      return next;
    });
  }, [persist]);

  const isFaceRegistered = useCallback(
    (email) => Boolean(faceUsers[email]),
    [faceUsers]
  );

  const logout = useCallback(() => {
    setUserState(null);
    setTokenState(null);
    setPendingLoginState(null);
    setPendingRegisterState(null);
    saveSession(null);
  }, []);

  const value = {
    user,
    setUser,
    token,
    setToken,
    pendingLogin,
    setPendingLogin,
    pendingRegister,
    setPendingRegister,
    faceUsers,
    setFaceRegistered,
    isFaceRegistered,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
