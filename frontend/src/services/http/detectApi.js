import { API_BASE, request } from "./client.js";

function appendUserId(formData, userId) {
  if (userId != null) formData.append("user_id", String(userId));
}

export const detectVideo = async (videoFile, userId = null) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  appendUserId(formData, userId);
  return request(`${API_BASE}/detect`, { method: "POST", body: formData });
};

export const detectImage = async (imageFile, userId = null) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  appendUserId(formData, userId);
  return request(`${API_BASE}/detect-image`, { method: "POST", body: formData });
};

export const detectUploadAiVideo = async (videoFile, userId = null) => {
  const formData = new FormData();
  formData.append("file", videoFile);
  appendUserId(formData, userId);
  return request(`${API_BASE}/upload-ai/detect`, { method: "POST", body: formData });
};

export const detectUploadAiImage = async (imageFile, userId = null) => {
  const formData = new FormData();
  formData.append("file", imageFile);
  appendUserId(formData, userId);
  return request(`${API_BASE}/upload-ai/detect`, { method: "POST", body: formData });
};

/** Landing: một endpoint fusion (ảnh hoặc video), field "file". */
export const detectUploadAiMedia = async (mediaFile, userId = null) => {
  const formData = new FormData();
  formData.append("file", mediaFile);
  appendUserId(formData, userId);
  return request(`${API_BASE}/upload-ai/detect`, { method: "POST", body: formData });
};
