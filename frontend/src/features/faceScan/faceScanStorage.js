import { FACE_LOCAL_KEY } from "./faceScanConstants.js";

export function loadLocalFaceMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FACE_LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalFaceProfile(email, faceHash) {
  if (!email || typeof window === "undefined") return;
  try {
    const map = loadLocalFaceMap();
    map[email.toLowerCase()] = { hash: faceHash || null };
    window.localStorage.setItem(FACE_LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getLocalFaceProfile(email) {
  if (!email) return null;
  const map = loadLocalFaceMap();
  const value = map[email.toLowerCase()];
  if (!value) return null;
  if (typeof value === "string") return { hash: value };
  if (typeof value === "object") return { hash: value.hash || null };
  return null;
}
