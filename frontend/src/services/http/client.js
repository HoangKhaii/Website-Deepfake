/**
 * HTTP transport — một trách nhiệm (SRP). Các module auth/detect chỉ biết endpoint.
 */
const API_HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";

function buildApiBaseCandidates() {
  const fromEnv =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
      ? String(import.meta.env.VITE_API_BASE).replace(/\/+$/, "")
      : null;
  const list = [];
  if (fromEnv) list.push(fromEnv);
  // Dev: gọi /api cùng origin → Vite proxy gắn X-Forwarded-For (IP client cho email cảnh báo)
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.DEV &&
    typeof window !== "undefined"
  ) {
    list.push(`${window.location.origin}/api`);
  }
  list.push(`http://${API_HOST}:5000/api`);
  if (API_HOST !== "localhost") list.push("http://localhost:5000/api");
  if (API_HOST !== "127.0.0.1") list.push("http://127.0.0.1:5000/api");
  return [...new Set(list)];
}

export const API_BASE_CANDIDATES = buildApiBaseCandidates();
export const API_BASE = API_BASE_CANDIDATES[0];

function extractApiPath(url) {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${parsed.pathname}${parsed.search || ""}`;
  } catch {
    return url;
  }
}

function normalizeApiPath(url) {
  const raw = extractApiPath(url) || "";
  const [pathname = "", search = ""] = raw.split("?");
  let normalizedPath = pathname;
  if (normalizedPath === "/api") normalizedPath = "/";
  else if (normalizedPath.startsWith("/api/")) normalizedPath = normalizedPath.slice(4);
  if (!normalizedPath.startsWith("/")) normalizedPath = `/${normalizedPath}`;
  return search ? `${normalizedPath}?${search}` : normalizedPath;
}

export function createConnectionError(originalError) {
  const err = new Error(
    "Cannot reach the server. Make sure the backend is running on port 5000."
  );
  err.cause = originalError;
  return err;
}

export function isLikelyNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("fetch failed")
  );
}

export async function fetchWithApiFallback(url, options = {}) {
  const apiPath = normalizeApiPath(url);
  let lastError = null;
  for (const base of API_BASE_CANDIDATES) {
    try {
      return await fetch(`${base}${apiPath}`, options);
    } catch (error) {
      lastError = error;
      if (!isLikelyNetworkError(error)) throw error;
    }
  }
  throw createConnectionError(lastError);
}

export async function request(url, options = {}) {
  let res;
  try {
    res = await fetchWithApiFallback(url, options);
  } catch (networkError) {
    if (networkError?.cause || isLikelyNetworkError(networkError)) {
      throw createConnectionError(networkError);
    }
    throw new Error(`Network error: ${networkError.message}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (
      data.message?.includes("PostgreSQL") ||
      data.message?.includes("Database") ||
      data.message?.toLowerCase().includes("database")
    ) {
      throw new Error("Database error: " + data.message);
    }
    throw new Error(data.message || data.error || res.statusText || `Request failed: ${res.status}`);
  }
  return data;
}
