import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useNotification } from "../components/Notification";
import { appendLog, upsertUserByEmail } from "../services/storage";
import { registerFace, verifyFace } from "../services/api";
import RegisterFaceRecaptchaModal from "../components/RegisterFaceRecaptchaModal";
import {
  FACE_FRAME_TARGET,
  MIN_UPRIGHT_FRAMES,
  REGISTER_COUNTDOWN_SECONDS,
  VERIFY_FRAME_TARGET,
  VERIFY_MIN_UPRIGHT_FRAMES,
  VERIFY_FRAME_DELAY_MS,
  MAX_FACE_ATTEMPTS,
  FACE_LOGIN_EMAIL_KEY,
} from "../features/faceScan/faceScanConstants";
import { saveLocalFaceProfile, getLocalFaceProfile } from "../features/faceScan/faceScanStorage";
import {
  captureFaceFromVideo,
  captureFrameBatch,
} from "../features/faceScan/captureFaceFromVideo";

export default function FaceScan() {
  const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || "").trim();
  const videoRef = useRef();
  const canvasRef = useRef();
  const frameGuideRef = useRef();
  const streamRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const nav = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const type = params.get("type");
  const isRegister = type === "register";
  const isLoginFace = type === "login-face";
  const { pendingRegister, user: sessionUser, setUser, setToken, setPendingRegister, setFaceRegistered } = useSession();

  const loginFaceEmail = useMemo(() => {
    if (!isLoginFace) return null;
    const fromState = typeof location.state?.email === "string" ? location.state.email.trim() : "";
    const fromQuery = typeof params.get("email") === "string" ? params.get("email").trim() : "";
    let fromStore = "";
    try {
      fromStore = (window.sessionStorage.getItem(FACE_LOGIN_EMAIL_KEY) || "").trim();
    } catch {
      fromStore = "";
    }
    const fromSession = typeof sessionUser?.email === "string" ? sessionUser.email.trim() : "";
    return fromState || fromQuery || fromStore || fromSession || null;
  }, [isLoginFace, location.state, params, sessionUser?.email]);

  useEffect(() => {
    if (!isLoginFace || typeof window === "undefined") return;
    if (loginFaceEmail) {
      try {
        window.sessionStorage.setItem(FACE_LOGIN_EMAIL_KEY, loginFaceEmail);
      } catch {
        /* ignore */
      }
    }
  }, [isLoginFace, loginFaceEmail]);
  const { success, error: showError, warning, info } = useNotification();
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFailCount, setFaceFailCount] = useState(0);
  const [aiStatus, setAiStatus] = useState("");
  const [aiStatusType, setAiStatusType] = useState("info");
  const registerFlowFinishedRef = useRef(false);
  const registerFaceApiOkRef = useRef(false);
  const pendingRegisterFramesRef = useRef(null);

  const handleAbandonRegisterFace = useCallback(() => {
    if (registerFlowFinishedRef.current) return;
    setToken(null);
    setUser(null);
    setPendingRegister(null);
    if (registerFaceApiOkRef.current) {
      warning(
        "Your face is already saved. Please sign in with your email and password."
      );
      nav("/login", { replace: true });
      return;
    }
    nav("/register", { replace: true, state: { registrationAbandoned: true } });
  }, [nav, setToken, setUser, setPendingRegister, warning]);

  useEffect(() => {
    if (!isRegister) return undefined;
    const onBeforeUnload = (e) => {
      if (registerFlowFinishedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRegister]);

  // Start video
  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: "user",
            frameRate: { ideal: 30, max: 60 },
          },
        });
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          await new Promise((resolve) => {
            const done = () => {
              el.removeEventListener("loadedmetadata", done);
              resolve();
            };
            if (el.readyState >= 1 && el.videoWidth > 0) resolve();
            else el.addEventListener("loadedmetadata", done, { once: true });
          });
          try {
            await el.play();
          } catch {
            /* một số trình duyệt vẫn chiếu được sau play() lỗi */
          }
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

  useEffect(() => {
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        faceDetectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch (err) {
        faceDetectorRef.current = null;
      }
    }
  }, []);

  const captureFace = useCallback(async () => {
    return captureFaceFromVideo({
      video: videoRef.current,
      canvas: canvasRef.current,
      guideEl: frameGuideRef.current,
      faceDetector: faceDetectorRef.current,
    });
  }, []);

  const setProcessingStatus = useCallback((message, type = "info", notify = false) => {
    setAiStatus(message);
    setAiStatusType(type);
    if (!notify) return;
    if (type === "success") success(message);
    else if (type === "warning") warning(message);
    else if (type === "error") showError(message);
    else info(message);
  }, [info, showError, success, warning]);

  const runRegisterFaceApi = useCallback(
    async (userEmail, faceFrames, recaptchaToken) => {
      try {
        setProcessingStatus("AI is checking if the face is fake or real...", "info", true);
        const response = await registerFace(userEmail, faceFrames, recaptchaToken || null);
        registerFaceApiOkRef.current = true;
        if (response.token) {
          setToken(response.token);
        }
        const savedHash = response.storedFaceHash || faceFrames[0]?.hash || null;
        saveLocalFaceProfile(userEmail, savedHash);
        setProcessingStatus("AI confirms it's REAL. The face is valid for registration.", "success", false);
        registerFlowFinishedRef.current = true;
        setShowCaptcha(false);
        setProcessing(false);
        setAiStatus("");
        setUser({ ...sessionUser, hasFace: true });
        if (pendingRegister) setPendingRegister(null);
        setFaceRegistered(userEmail);
        success("Face registered successfully! Welcome to DeepCheck.");
        nav("/");
      } catch (err) {
        setProcessing(false);
        setAiStatus("");
        showError(err.message || "Failed to register face");
        throw err;
      }
    },
    [
      sessionUser,
      pendingRegister,
      setToken,
      setUser,
      setPendingRegister,
      setFaceRegistered,
      nav,
      success,
      showError,
      setProcessingStatus,
    ]
  );

  const forceEmailLogin = useCallback((message) => {
    appendLog({
      type: "login_face_locked",
      email: loginFaceEmail || null,
      reason: "max_attempts_reached",
    });
    showError(message);
    nav("/login", { state: { message: "Please sign in with your email." } });
  }, [loginFaceEmail, nav, showError]);

  const consumeFaceAttempt = useCallback((message, options = {}) => {
    const { remainingAttempts, reason = "unknown" } = options;
    const nextFailCount = typeof remainingAttempts === "number"
      ? Math.min(MAX_FACE_ATTEMPTS, Math.max(0, MAX_FACE_ATTEMPTS - remainingAttempts))
      : Math.min(MAX_FACE_ATTEMPTS, faceFailCount + 1);
    const remain = Math.max(0, MAX_FACE_ATTEMPTS - nextFailCount);
    setFaceFailCount(nextFailCount);

    appendLog({
      type: "login_face_attempt_failed",
      email: loginFaceEmail || null,
      reason,
      attemptsUsed: nextFailCount,
      remainingAttempts: remain,
    });

    if (remain <= 0) {
      forceEmailLogin("Face verification failed too many times. Please sign in with your email.");
      return false;
    }

    setProcessingStatus(`${message} (${remain} attempt(s) left).`, "warning", true);
    return true;
  }, [faceFailCount, forceEmailLogin, loginFaceEmail, setProcessingStatus]);

  const captureFrameBatchCb = useCallback(
    async (targetCount = FACE_FRAME_TARGET, frameDelayMs = 120) =>
      captureFrameBatch({
        targetCount,
        frameDelayMs,
        captureOne: captureFace,
      }),
    [captureFace]
  );

  const scan = async () => {
    if (scanning) return;
    setAiStatus("");
    setAiStatusType("info");
    setScanning(true);
    const countdownSec = REGISTER_COUNTDOWN_SECONDS;
    const frameTarget = isLoginFace ? VERIFY_FRAME_TARGET : FACE_FRAME_TARGET;
    const frameDelayMs = isLoginFace ? VERIFY_FRAME_DELAY_MS : 120;
    const minUprightNeeded = isLoginFace ? VERIFY_MIN_UPRIGHT_FRAMES : MIN_UPRIGHT_FRAMES;
    setCountdown(countdownSec);

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
        const faceFrames = await captureFrameBatchCb(frameTarget, frameDelayMs);
        if (faceFrames.length === 0) {
          if (type === "login-face") {
            consumeFaceAttempt("No face detected", { reason: "no_face_detected" });
          } else {
            showError("Failed to capture face frames. Please try again.");
          }
          return;
        }

        const checkedFrames = faceFrames.filter((frame) => typeof frame.upright === "boolean");
        const uprightFrames = checkedFrames.filter((frame) => frame.upright === true).length;
        if (checkedFrames.length > 0 && uprightFrames < minUprightNeeded) {
          const poseGuideMessage =
            "Keep your whole face inside the frame (not half-face), look straight at the camera, and avoid tilting your head too much.";
          if (type === "login-face") {
            consumeFaceAttempt(poseGuideMessage, {
              reason: "face_not_upright",
            });
          } else {
            setProcessingStatus(poseGuideMessage, "warning", true);
          }
          setProcessing(false);
          return;
        }

        setProcessing(true);
        const userEmail = sessionUser?.email || pendingRegister?.email;

        if (type === "register" && !userEmail) {
          showError("Please register through the proper flow first.");
          setProcessing(false);
          return;
        }

        if (type === "register" && userEmail) {
          if (recaptchaSiteKey) {
            pendingRegisterFramesRef.current = { email: userEmail, faceFrames };
            setProcessingStatus("Please complete reCAPTCHA below.", "info", true);
            setShowCaptcha(true);
          } else {
            try {
              await runRegisterFaceApi(userEmail, faceFrames, null);
            } catch {
              /* error already shown in runRegisterFaceApi */
            }
          }
          return;
        }

        if (type === "login-face") {
          if (!loginFaceEmail) {
            warning("Please enter your email on the Login page and then click Face ID, or go back and log in using email.");
            setProcessing(false);
            return;
          }
          try {
            setProcessingStatus("Face verification in progress...", "info", true);
            setProcessingStatus("Matching with saved image...", "info");
            const localRegisteredFace = getLocalFaceProfile(loginFaceEmail);
            const response = await verifyFace(
              loginFaceEmail,
              faceFailCount + 1,
              faceFrames,
              localRegisteredFace?.hash || null
            );
            if (response.success) {
              if (response.token) setToken(response.token);
              setUser({ ...sessionUser, hasFace: true, ...response.user });
              upsertUserByEmail({ ...sessionUser, lastLoginAt: new Date().toISOString() });
              appendLog({ type: "login_face", email: loginFaceEmail });
              try {
                window.sessionStorage.removeItem(FACE_LOGIN_EMAIL_KEY);
              } catch {
                /* ignore */
              }
              setProcessingStatus("The face matches the registered photo.", "success", true);
              success("Face verification successful! Welcome back.");
              nav("/");
            }
          } catch (err) {
            const body = err.body || {};
            if (body.forceEmailLogin === true) {
              const rawMsg =
                body.message ||
                "The attempt has been exceeded 3 times. Please log in using your email.";
              showError(rawMsg);
              nav("/login", { state: { message: "Please log in using your email." } });
            } else {
              const rawMsg = body.message || err.message || "Face verification failed";
              const isUserNotFound =
                err?.status === 404 ||
                rawMsg === "User not found" ||
                (typeof rawMsg === "string" && rawMsg.toLowerCase().includes("user not found"));
              const userHint = isUserNotFound
                ? `${rawMsg}. Use the same email you registered with, or sign in with email.`
                : rawMsg;
              const canRetry = consumeFaceAttempt(userHint, {
                remainingAttempts: body.remainingAttempts,
                reason: body.livenessReason ? "liveness_failed" : "face_mismatch",
              });
              if (canRetry) {
                showError(
                  userHint +
                    (body.remainingAttempts != null ? ` (remaining ${body.remainingAttempts} attempts).` : "")
                );
              }
            }
          }
          setProcessing(false);
        }
      } catch (err) {
        console.error("Error during scan:", err);
        setProcessingStatus(err.message || "An error occurred. Please try again.", "error");
        showError(err.message || "An error occurred. Please try again.");
        setProcessing(false);
      }
    }, countdownSec * 1000);
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
          {isRegister ? (
            <button
              type="button"
              onClick={handleAbandonRegisterFace}
              className="flex items-center gap-3 group text-left"
            >
              <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-slate-800">DeepCheck</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo-deepfake.png" alt="DeepCheck" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-600/30 group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-slate-800">DeepCheck</span>
            </Link>
          )}
          <div className="flex items-center gap-4">
            {isRegister ? (
              <>
                <button
                  type="button"
                  onClick={handleAbandonRegisterFace}
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium transition"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={handleAbandonRegisterFace}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-sm font-semibold transition shadow-lg shadow-cyan-600/25"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Log in</Link>
                <Link to="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#22d3ee] text-sm font-semibold transition shadow-lg shadow-cyan-600/25">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* reCAPTCHA before register-face when VITE_RECAPTCHA_SITE_KEY is set */}
      {showCaptcha && recaptchaSiteKey ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <RegisterFaceRecaptchaModal
            siteKey={recaptchaSiteKey}
            onSubmitToken={async (recaptchaToken) => {
              const pending = pendingRegisterFramesRef.current;
              if (!pending?.email) return;
              await runRegisterFaceApi(pending.email, pending.faceFrames, recaptchaToken);
              pendingRegisterFramesRef.current = null;
            }}
            onClose={() => {
              pendingRegisterFramesRef.current = null;
              setShowCaptcha(false);
              setProcessing(false);
              setAiStatus("");
            }}
          />
        </div>
      ) : null}

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
                  : "Keep your face within the frame, looking directly at the camera. The system takes multiple live photos and selects the frame that most closely matches the submitted photo for matching.."}
              </p>
            </div>

            {/* Alignment guide — fewer scan errors */}
            <div className="mb-5 rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Before you verify — align your face
              </p>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  <span className="font-medium text-slate-800">Frame your face:</span> keep your <strong className="text-cyan-800">forehead, chin, and cheeks</strong> inside the cyan oval — avoid touching the edges or being cropped.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Distance:</span> sit about <strong>40–70 cm</strong> from the camera; your face should be clear without filling the whole frame.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Pose:</span> look <strong className="text-cyan-800">straight into the lens</strong> with your head level (minimal tilt).
                </li>
                <li>
                  <span className="font-medium text-slate-800">Lighting:</span> avoid backlight; prefer even light on your face so one side is not dark.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Obstructions:</span> keep hair, masks, hands, or objects from covering your <strong>eyes, nose, and mouth</strong>.
                </li>
                <li>
                  When you are steady in the frame, tap <span className="font-medium text-cyan-800">Scan</span> — hold still until the countdown finishes.
                </li>
              </ol>
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
              <div className="absolute inset-0 pointer-events-none">
                {/* Blur and dim everything outside the face frame */}
                <div className="absolute top-0 left-0 right-0 h-[calc(50%-6.5rem)] bg-black/20 backdrop-blur-[3px]"></div>
                <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-6.5rem)] bg-black/20 backdrop-blur-[3px]"></div>
                <div className="absolute left-0 top-[calc(50%-6.5rem)] h-52 w-[calc(50%-5rem)] bg-black/20 backdrop-blur-[3px]"></div>
                <div className="absolute right-0 top-[calc(50%-6.5rem)] h-52 w-[calc(50%-5rem)] bg-black/20 backdrop-blur-[3px]"></div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div ref={frameGuideRef} className="relative w-28 h-40 rounded-3xl border-2 border-cyan-500/50 bg-cyan-500/5 transition-all duration-300">
                  <span className="absolute top-2 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow text-center max-w-[9.5rem] leading-tight">
                    Align face in frame
                  </span>
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-500 rounded-br-lg"></div>
                </div>
              </div>

              {/* Camera status indicator */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-xs font-medium text-slate-600">
                  {cameraReady ? "Camera ready" : "Starting camera..."}
                </span>
              </div>

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

            {processing && aiStatus && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  aiStatusType === "success"
                    ? "bg-cyan-50 border-cyan-200 text-cyan-700"
                    : aiStatusType === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : aiStatusType === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                {aiStatus}
              </div>
            )}

            {type === "login-face" && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span>Attempts: {faceFailCount}/{MAX_FACE_ATTEMPTS}</span>
                <span>Remaining: {Math.max(0, MAX_FACE_ATTEMPTS - faceFailCount)}</span>
              </div>
            )}

            <div className="text-center mt-8 pt-6 border-t border-slate-200/50 relative">
              {isRegister ? (
                <button
                  type="button"
                  onClick={handleAbandonRegisterFace}
                  className="text-slate-600 hover:text-slate-900 text-sm transition inline-flex items-center gap-1 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to registration (face not yet complete)
                </button>
              ) : (
                <Link to="/" className="text-slate-500 hover:text-slate-700 text-sm transition inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/50">
            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Quick tips
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>• <span className="font-medium text-slate-700">Framing:</span> center your face in the oval; avoid being off to one side or showing only half your face.</li>
              <li>• Use even light in front of you; avoid one side of your face in deep shadow.</li>
              <li>• Remove heavy glasses that cover your eyes; take off face masks.</li>
              <li>• Move slowly and keep looking at the camera while frames are captured.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
