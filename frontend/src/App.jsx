import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Otp from "./pages/Otp";
import FaceScan from "./pages/FaceScan";
import Admin from "./pages/Admin";

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/face-scan" element={<FaceScan />} />
        <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
