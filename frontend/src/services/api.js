export const API_BASE = "http://localhost:5000/api";

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkError) {
    if (networkError.message === "Failed to fetch") {
      throw new Error("Không thể kết nối đến máy chủ. Vui lòng đảm bảo backend server đang chạy trên port 5000.");
    }
    throw new Error(`Lỗi mạng: ${networkError.message}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.message?.includes("PostgreSQL") || data.message?.includes("Database") || data.message?.includes("cơ sở dữ liệu")) {
      throw new Error("Lỗi Database: " + data.message);
    }
    throw new Error(data.message || data.error || res.statusText || `Yêu cầu thất bại: ${res.status}`);
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

export const registerOtpSend = async (body) => {
  return request(`${API_BASE}/auth/register-otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const registerOtpVerify = async (email, otp_code) => {
  return request(`${API_BASE}/auth/register-otp/verify`, {
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

export const registerFace = async (email, faceImage) => {
  return request(`${API_BASE}/auth/register-face`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, faceImage }),
  });
};

export const verifyFace = async (email, faceImage) => {
  return request(`${API_BASE}/auth/verify-face`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, faceImage }),
  });
};

// Forgot Password
export const forgotPasswordEmail = async (email) => {
  return request(`${API_BASE}/auth/forgot-password/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const forgotPasswordPhone = async (phone) => {
  return request(`${API_BASE}/auth/forgot-password/phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
};


export const forgotPasswordVerify = async (identifier, otp, newPassword, method) => {
  return request(`${API_BASE}/auth/forgot-password/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp, newPassword, method }),
  });
};
