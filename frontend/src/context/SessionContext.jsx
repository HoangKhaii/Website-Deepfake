import { createContext, useContext, useState, useCallback } from "react";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [pendingLogin, setPendingLoginState] = useState(null); // { email, mfaCodes? }
  const [pendingRegister, setPendingRegisterState] = useState(null);
  const [faceUsers, setFaceUsersState] = useState({});

  const setUser = useCallback((u) => setUserState(u), []);
  const setToken = useCallback((t) => setTokenState(t), []);
  const setPendingLogin = useCallback((p) => setPendingLoginState(p), []);
  const setPendingRegister = useCallback((p) => setPendingRegisterState(p), []);

  const setFaceRegistered = useCallback((email) => {
    setFaceUsersState((prev) => (email ? { ...prev, [email]: true } : prev));
  }, []);

  const isFaceRegistered = useCallback(
    (email) => Boolean(faceUsers[email]),
    [faceUsers]
  );

  const logout = useCallback(() => {
    setUserState(null);
    setTokenState(null);
    setPendingLoginState(null);
    setPendingRegisterState(null);
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
