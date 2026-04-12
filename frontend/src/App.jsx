import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";
import { NotificationProvider, useNotification } from "./components/Notification";
import { API_BASE } from "./services/api";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
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

      // Fetch user info (cùng host với API_BASE để chạy đúng khi mở bằng IP)
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            const needsFaceRegistration =
              data.user.status === "pending_face" ||
              data.user.pending_google === true ||
              data.user.has_face !== true;

            if (needsFaceRegistration) {
              // Chưa cho vào web ngay: buộc hoàn tất đăng ký mặt trước.
              setToken(null);
              success("Google login successful. Please complete face registration to continue.");
              navigate("/face-scan?type=register", {
                replace: true,
                state: { email: data.user.email },
              });
              return;
            }

            // Đăng nhập Google lần sau: luôn đối chiếu lại mặt đã đăng ký.
            setToken(null);
            success("Google account recognized. Please verify your face to continue.");
            navigate(
              `/face-scan?type=login-face&email=${encodeURIComponent(data.user.email)}`,
              {
                replace: true,
                state: { email: data.user.email, source: "google" },
              }
            );
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
