const API_BASE = "http://localhost:5000/api";

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || res.statusText || `Request failed: ${res.status}`);
  }
  return data;
}

export const register = async (body) => {
  return request(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const login = async (email, password) => {
  return request(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const otpSend = async (email) => {
  return request(`${API_BASE}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const otpVerify = async (email, otp_code) => {
  return request(`${API_BASE}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
};

export const getMe = async (token) => {
  return request(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const detectVideo = async (videoFile, userId = null) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  if (userId != null) formData.append("user_id", String(userId));
  return request(`${API_BASE}/detect`, { method: "POST", body: formData });
};

export const detectImage = async (imageFile, userId = null) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (userId != null) formData.append("user_id", String(userId));
  return request(`${API_BASE}/detect-image`, { method: "POST", body: formData });
};
