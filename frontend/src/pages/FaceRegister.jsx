import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function FaceRegister() {
  const videoRef = useRef();
  const nav = useNavigate();
  const { pendingRegister, setFaceRegistered, setPendingRegister } = useSession();
  const email = pendingRegister?.email;

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (videoRef.current.srcObject = stream));
  }, []);

  const handleSaveFace = () => {
    if (email) setFaceRegistered(email);
    setPendingRegister(null);
    alert("Face registered successfully!");
    nav("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Background gradient mesh - same as Landing */}
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
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-slate-400 hover:text-white text-sm font-medium transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition border border-white/10"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        <div className="w-full max-w-md rounded-2xl p-8 bg-white/[0.03] border border-white/10 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-2">Register Face</h1>
          <p className="text-slate-500 text-sm text-center mb-6">
            Position your face in the frame, then click to save.
          </p>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-video object-cover"
            />
          </div>
          <button
            onClick={handleSaveFace}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-violet-600/25"
          >
            Scan & Save Face
          </button>
          <Link
            to="/"
            className="block text-center text-sm text-slate-500 hover:text-slate-400 mt-6"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
