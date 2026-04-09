import axios from "axios";
import useAuthStore from "../store/authStore";

const MAX_JSON_PAYLOAD_BYTES = 10 * 1024;
const BURST_WINDOW_MS = 60 * 1000;
const BURST_LIMIT = 60;
const SUSTAIN_WINDOW_MS = 15 * 60 * 1000;
const SUSTAIN_LIMIT = 500;
const DUPLICATE_WINDOW_MS = 60 * 1000;
const DUPLICATE_GUARDED_POST_PATHS = new Set([
  "/api/transactions",
  "/api/budget-periods",
]);

const requestLog = [];
const duplicateSubmissionLog = new Map();

function normalizePath(url = "") {
  return String(url).split("?")[0].trim();
}

function pruneRequestLog(now) {
  while (requestLog.length > 0 && now - requestLog[0] > SUSTAIN_WINDOW_MS) {
    requestLog.shift();
  }
}

function countInWindow(now, windowMs) {
  let count = 0;
  for (let i = requestLog.length - 1; i >= 0; i -= 1) {
    if (now - requestLog[i] > windowMs) break;
    count += 1;
  }
  return count;
}

function createClientGuardError(status, message, config, extraData = {}) {
  const error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  error.response = {
    status,
    data: { message, ...extraData },
    headers: {},
  };
  return error;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",");
  return `{${body}}`;
}

function jsonPayloadSizeBytes(data) {
  if (typeof data === "undefined" || data === null) return 0;
  if (typeof data === "string") return new TextEncoder().encode(data).length;
  return new TextEncoder().encode(stableStringify(data)).length;
}

function makeDuplicateKey(config) {
  const path = normalizePath(config.url);
  const method = String(config.method || "get").toUpperCase();
  const payloadSignature = stableStringify(config.data ?? null);
  return `${method}:${path}:${payloadSignature}`;
}

function enforceGlobalRateLimit(config) {
  const now = Date.now();
  pruneRequestLog(now);

  const burstCount = countInWindow(now, BURST_WINDOW_MS);
  if (burstCount >= BURST_LIMIT) {
    const retryAfterSeconds = Math.ceil(BURST_WINDOW_MS / 1000);
    throw createClientGuardError(
      429,
      "Terlalu banyak request dalam 1 menit. Coba lagi sebentar.",
      config,
      { retryAfterSeconds },
    );
  }

  if (requestLog.length >= SUSTAIN_LIMIT) {
    const retryAfterSeconds = Math.ceil(SUSTAIN_WINDOW_MS / 1000);
    throw createClientGuardError(
      429,
      "Terlalu banyak request dalam 15 menit. Coba lagi nanti.",
      config,
      { retryAfterSeconds },
    );
  }

  requestLog.push(now);
}

function enforcePayloadLimit(config) {
  const contentType = String(
    config.headers?.["Content-Type"] || "",
  ).toLowerCase();
  const isJson = contentType.includes("application/json");
  if (!isJson) return;

  const payloadSize = jsonPayloadSizeBytes(config.data);
  if (payloadSize > MAX_JSON_PAYLOAD_BYTES) {
    throw createClientGuardError(
      413,
      "Payload terlalu besar. Maksimum ukuran JSON adalah 10KB.",
      config,
      { maxBytes: MAX_JSON_PAYLOAD_BYTES, payloadSize },
    );
  }
}

function enforceDuplicateProtection(config) {
  const method = String(config.method || "get").toLowerCase();
  const path = normalizePath(config.url);
  if (method !== "post" || !DUPLICATE_GUARDED_POST_PATHS.has(path)) return;

  const now = Date.now();
  const key = makeDuplicateKey(config);
  const previous = duplicateSubmissionLog.get(key);

  if (previous && now - previous < DUPLICATE_WINDOW_MS) {
    throw createClientGuardError(
      409,
      "Request duplikat terdeteksi. Tunggu 60 detik sebelum kirim data yang sama.",
      config,
      { duplicateWindowSeconds: 60 },
    );
  }

  duplicateSubmissionLog.set(key, now);

  if (duplicateSubmissionLog.size > 200) {
    for (const [entryKey, entryTime] of duplicateSubmissionLog.entries()) {
      if (now - entryTime > DUPLICATE_WINDOW_MS) {
        duplicateSubmissionLog.delete(entryKey);
      }
    }
  }
}

function serializeSafeParams(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, rawValue]) => {
    if (rawValue === null || typeof rawValue === "undefined") return;

    if (Array.isArray(rawValue)) {
      const uniqValues = [...new Set(rawValue.map((v) => String(v)))];
      if (uniqValues.length > 0) {
        search.set(key, uniqValues.join(","));
      }
      return;
    }

    if (typeof rawValue === "object") {
      search.set(key, JSON.stringify(rawValue));
      return;
    }

    search.set(key, String(rawValue));
  });
  return search.toString();
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  paramsSerializer: {
    serialize: serializeSafeParams,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — auto-inject JWT token (skip auth endpoints)
api.interceptors.request.use(
  (config) => {
    enforceGlobalRateLimit(config);
    enforcePayloadLimit(config);
    enforceDuplicateProtection(config);

    const url = config.url || "";
    const isAuthEndpoint = url.includes("/api/auth/");

    // Don't inject JWT for auth endpoints (login, register, google, logout)
    // The google endpoint expects only the Firebase idToken in the body,
    // sending a stale/invalid JWT header causes the backend to reject it
    if (!isAuthEndpoint) {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint = url.includes("/api/auth/");

    // Only auto-logout for non-auth endpoints (expired token, etc.)
    // Auth endpoint 401s (wrong password) should be handled by the page itself
    if (error.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      // No window.location.href — ProtectedRoute handles redirect reactively
    }
    return Promise.reject(error);
  }
);

export default api;
