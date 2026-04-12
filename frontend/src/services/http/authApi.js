import {
  API_BASE,
  request,
  fetchWithApiFallback,
  createConnectionError,
  isLikelyNetworkError,
} from "./client.js";

export const register = async (body) =>
  request(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const login = async (email, password) => {
  try {
    const res = await fetchWithApiFallback(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const err = new Error(data.message || data.error || "Login failed");
    err.body = data;
    err.status = res.status;
    throw err;
  } catch (error) {
    if (error?.cause || isLikelyNetworkError(error)) {
      throw createConnectionError(error);
    }
    throw error;
  }
};

export const otpSend = async (email) =>
  request(`${API_BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const otpVerify = async (email, otp_code) =>
  request(`${API_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });

export const registerOtpSend = async (body) =>
  request(`${API_BASE}/auth/register-otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const registerOtpVerify = async (email, otp_code) =>
  request(`${API_BASE}/auth/register-otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });

export const getMe = async (token) =>
  request(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const registerFace = async (email, faceFrames = [], recaptchaToken = null) => {
  const formData = new FormData();
  formData.append("email", email);
  if (recaptchaToken) {
    formData.append("recaptchaToken", recaptchaToken);
  }
  formData.append("frameHashes", JSON.stringify(faceFrames.map((f) => f?.hash || null)));
  faceFrames.forEach((frame, idx) => {
    if (frame?.blob) {
      const t = (frame.blob.type || "").toLowerCase();
      const ext = t.includes("png") ? "png" : "jpg";
      formData.append("frames", frame.blob, `frame-${idx + 1}.${ext}`);
    }
  });
  return request(`${API_BASE}/auth/register-face`, { method: "POST", body: formData });
};

export const verifyFace = async (email, faceAttempt = 1, faceFrames = [], registeredFaceHash = null) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("faceAttempt", String(faceAttempt));
  formData.append("frameHashes", JSON.stringify(faceFrames.map((f) => f?.hash || null)));
  if (registeredFaceHash) formData.append("registeredFaceHash", registeredFaceHash);
  faceFrames.forEach((frame, idx) => {
    if (frame?.blob) {
      const t = (frame.blob.type || "").toLowerCase();
      const ext = t.includes("png") ? "png" : "jpg";
      formData.append("frames", frame.blob, `frame-${idx + 1}.${ext}`);
    }
  });
  try {
    const res = await fetchWithApiFallback(`${API_BASE}/auth/verify-face`, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const err = new Error(data.message || data.error || "Face verification failed");
    err.status = res.status;
    err.forceEmailLogin = data.forceEmailLogin;
    err.remainingAttempts = data.remainingAttempts;
    err.body = data;
    throw err;
  } catch (error) {
    if (error?.cause || isLikelyNetworkError(error)) throw createConnectionError(error);
    throw error;
  }
};

export const forgotPasswordEmail = async (email) =>
  request(`${API_BASE}/auth/forgot-password/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const forgotPasswordVerify = async (identifier, otp, newPassword, method) =>
  request(`${API_BASE}/auth/forgot-password/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp, newPassword, method }),
  });
