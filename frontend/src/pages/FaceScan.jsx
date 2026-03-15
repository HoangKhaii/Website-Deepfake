import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { appendLog, upsertUserByEmail } from "../services/storage";
import { registerFace, verifyFace } from "../services/api";
import SliderCaptcha from "../components/SliderCaptcha";

export default function FaceScan() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const type = params.get("type");
  const isRegister = type === "register";
  const { pendingRegister, user: sessionUser, setUser, setPendingRegister, setFaceRegistered, isFaceRegistered } = useSession();
  const { success, error: showError, warning } = useNotification();
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Start video
  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        showError("Cannot access camera. Please allow camera permission.");
      }
    }
    startVideo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showError]);

  const captureFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  const scan = async () => {
    if (scanning) return;

    setScanning(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(async () => {
      clearInterval(countdownInterval);
      setCountdown(null);
      setScanning(false);

      try {
        // Capture face image
        const faceImage = captureFace();
        
        if (!faceImage) {
          showError("Failed to capture face. Please try again.");
          return;
        }

        setProcessing(true);

        // For registration flow: use sessionUser if logged in, otherwise use pendingRegister
        const userEmail = sessionUser?.email || pendingRegister?.email;
        
        if (type === "register" && !userEmail) {
          showError("Please register through the proper flow first.");
          setProcessing(false);
          return;
        }

        if (type === "register" && userEmail) {
          // Save face to backend
          const response = await registerFace(userEmail, faceImage);

          if (response.success) {
            // Show CAPTCHA after successful face registration
            setShowCaptcha(true);
            setCaptchaVerified(false);
          } else {
            showError(response.message || "Failed to register face");
            setProcessing(false);
          }
        }

        if (type === "login-face") {
          if (!sessionUser?.email) {
            warning("No face registered! Please register with face first.");
            setProcessing(false);
            return;
          }
          
          // Verify face for login
          const response = await verifyFace(sessionUser.email, faceImage);

          if (response.success) {
            setUser({ ...sessionUser, hasFace: true });
            upsertUserByEmail({ ...sessionUser, lastLoginAt: new Date().toISOString() });
            appendLog({ type: "login_face", email: sessionUser.email });
            success("Face verification successful! Welcome back.");
            nav("/");
          } else {
            showError(response.message || "Face verification failed");
          }
          setProcessing(false);
        }
      } catch (err) {
        console.error("Error during scan:", err);
        showError(err.message || "An error occurred. Please try again.");
        setProcessing(false);
      }
    }, 3000);
  };

  const handleCaptchaSuccess = () => {
    setCaptchaVerified(true);
    setShowCaptcha(false);
    
    const userEmail = sessionUser?.email || pendingRegister?.email;
    
    if (type === "register" && userEmail) {
      setUser({ ...sessionUser, hasFace: true });
      if (pendingRegister) setPendingRegister(null);
      setFaceRegistered(userEmail);
      success("Face registered successfully! Welcome to DeepCheck.");
      nav("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.5%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
            <span className="font-bold text-xl tracking-tight text-slate-800">DeepCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Log in</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-sm font-semibold transition shadow-lg shadow-cyan-600/25">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Verify Modal */}
      {showCaptcha && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-[420px] w-full mx-4 overflow-hidden">
            <SliderCaptcha 
              onSuccess={() => {
                handleCaptchaSuccess();
              }}
              onClose={() => {
                setShowCaptcha(false);
                setCaptchaVerified(false);
                setProcessing(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
        <div className="w-full max-w-[480px]">
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 shadow-xl shadow-slate-200/50 animate-fade-in-up">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0891b2] via-[#06b6d4] to-[#22d3ee] rounded-t-3xl"></div>
            
            <div className="text-center mb-8 relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-600/30 animate-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.558-4.137" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-slate-800">
                {isRegister ? "Register Your Face" : "Face Scan"}
              </h1>
              <p className="text-slate-600">
                {isRegister
                  ? "Position your face in the frame, then click to capture."
                  : "Look at the camera and click to verify."}
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-6 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Face overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-52 rounded-3xl border-2 border-cyan-500/50 bg-cyan-500/5 transition-all duration-300">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-500 rounded-br-lg"></div>
                </div>
              </div>

              {/* Camera status indicator */}
              {!loading && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="text-xs font-medium text-slate-600">
                    {cameraReady ? "Camera ready" : "Starting camera..."}
                  </span>
                </div>
              )}

              {/* Scanning indicator */}
              {scanning && (
                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                      <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="text-cyan-700 font-semibold text-lg">Scanning...</p>
                  </div>
                </div>
              )}

              {/* Countdown */}
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl animate-bounce">
                    <span className="text-6xl font-bold text-cyan-600">{countdown}</span>
                  </div>
                </div>
              )}

              {/* Bottom guide */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/90 backdrop-blur text-cyan-600 text-sm font-medium shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Position your face here
              </div>
            </div>

            <button
              onClick={scan}
              disabled={scanning || processing || !cameraReady}
              className="w-full py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-white transition-all shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : scanning ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isRegister ? "Scan & Save Face" : "Scan & Verify"}
                </span>
              )}
            </button>

            <div className="text-center mt-8 pt-6 border-t border-slate-200/50 relative">
              <Link to="/" className="text-slate-500 hover:text-slate-700 text-sm transition inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to home
              </Link>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/50">
            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips for best results
            </p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• Ensure good lighting on your face</li>
              <li>• Position your face within the frame</li>
              <li>• Remove glasses or accessories that cover your face</li>
              <li>• Look directly at the camera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
