import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";
import { NotificationProvider, useNotification } from "./components/Notification";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Otp from "./pages/Otp";
import FaceScan from "./pages/FaceScan";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import { useEffect } from "react";

function GoogleAuthHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useSession();
  const { success, error: showError } = useNotification();

  useEffect(() => {
    const token = searchParams.get("token");
    const googleAuth = searchParams.get("google_auth");
    const error = searchParams.get("error");

    if (error) {
      showError("Google authentication failed. Please try again.");
      navigate("/login", { replace: true });
      return;
    }

    if (googleAuth === "success" && token) {
      // Lưu token và set user
      setToken(token);

      // Fetch user info
      fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            success("Login with Google successful! Welcome to DeepCheck.");
            navigate("/", { replace: true });
          }
        })
        .catch((err) => {
          console.error("Failed to get user info:", err);
          showError("Failed to complete Google login.");
          navigate("/login", { replace: true });
        });
    }
  }, [searchParams, setUser, setToken, navigate, success, showError]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <GoogleAuthHandler />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/face-scan" element={<FaceScan />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <SessionProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </SessionProvider>
  );
}

export default App;
