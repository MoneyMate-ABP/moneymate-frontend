import api from "./api";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase.config";

const REDIRECT_PENDING_KEY = "mm_google_redirect_pending";
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 7;
const AUTH_RATE_LIMIT_KEY_PREFIX = "mm_auth_rl";

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

function readAuthAttempts(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((n) => Number.isFinite(n))
      : [];
  } catch {
    return [];
  }
}

function writeAuthAttempts(key, timestamps) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(timestamps));
  } catch {
    // Ignore storage access issues.
  }
}

function enforceAuthRateLimit(endpointName) {
  const now = Date.now();
  const key = `${AUTH_RATE_LIMIT_KEY_PREFIX}:${endpointName}`;
  const activeAttempts = readAuthAttempts(key).filter(
    (ts) => now - ts <= AUTH_RATE_LIMIT_WINDOW_MS,
  );

  if (activeAttempts.length >= AUTH_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.ceil(
      (AUTH_RATE_LIMIT_WINDOW_MS - (now - activeAttempts[0])) / 1000,
    );
    throw createClientGuardError(
      429,
      "Batas percobaan autentikasi tercapai. Coba lagi nanti.",
      {
        url: `/api/auth/${endpointName}`,
        method: "post",
      },
      { retryAfterSeconds },
    );
  }

  activeAttempts.push(now);
  writeAuthAttempts(key, activeAttempts);
}

function setRedirectPending(value) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(REDIRECT_PENDING_KEY, "1");
    } else {
      window.localStorage.removeItem(REDIRECT_PENDING_KEY);
    }
  } catch {
    // Ignore storage access issues (private mode restrictions, etc.)
  }
}

export function clearPendingGoogleRedirect() {
  setRedirectPending(false);
}

export function hasPendingGoogleRedirect() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

async function getRedirectResultWithTimeout(timeoutMs = 8000) {
  return Promise.race([
    getRedirectResult(auth),
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Google redirect timed out. Please try again."));
      }, timeoutMs);
    }),
  ]);
}

function waitForAuthUser(timeoutMs = 4500) {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(null);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled || !user) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

function shouldUseRedirectFlow() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && "ontouchend" in document);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);

  // Safari on iOS (browser tab and standalone PWA) is unreliable for Firebase redirect flow
  // in this app's context. Always use popup flow there.
  if (isIOS && isSafari) {
    return false;
  }

  return false;
}

function normalizeAuthPayload(payload) {
  if (payload?.token && payload?.user) return payload;
  if (payload?.data?.token && payload?.data?.user) return payload.data;
  return null;
}

async function exchangeGoogleTokenToBackend(firebaseUser) {
  const idToken = await firebaseUser.getIdToken(true);

  try {
    const res = await api.post("/api/auth/google", { idToken });
    const authPayload = normalizeAuthPayload(res.data);

    if (!authPayload) {
      throw new Error("Invalid auth payload from /api/auth/google");
    }

    return authPayload;
  } finally {
    // Sign out from Firebase — app session is handled by backend JWT.
    await auth.signOut().catch(() => {});
  }
}

/**
 * Register a new user (local auth)
 */
export async function registerUser({ name, email, password }) {
  enforceAuthRateLimit("register");

  const res = await api.post("/api/auth/register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data; // { message, data: { token, user } }
}

/**
 * Login with email + password (local auth)
 */
export async function loginUser({ email, password }) {
  enforceAuthRateLimit("login");

  const res = await api.post("/api/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
}

/**
 * Google Sign-In: opens Firebase popup, gets ID token, sends to backend
 */
export async function loginWithGoogle() {
  // Ensure stale redirect markers from previous versions do not trigger loop on login page.
  setRedirectPending(false);

  if (!auth || !googleProvider) {
    throw new Error("Google login is not configured.");
  }

  const result = await signInWithPopup(auth, googleProvider);
  return exchangeGoogleTokenToBackend(result.user);
}

/**
 * Complete redirect-based Google Sign-In after returning from provider page.
 */
export async function completeGoogleRedirectLogin() {
  if (!hasPendingGoogleRedirect()) return null;

  if (!auth) {
    setRedirectPending(false);
    return null;
  }

  if (!shouldUseRedirectFlow()) {
    setRedirectPending(false);
    return null;
  }

  const result = await getRedirectResultWithTimeout();
  const redirectUser = result?.user || null;

  if (redirectUser) {
    setRedirectPending(false);
    return exchangeGoogleTokenToBackend(redirectUser);
  }

  const fallbackUser = auth.currentUser || (await waitForAuthUser());
  if (!fallbackUser) {
    setRedirectPending(false);
    return null;
  }

  setRedirectPending(false);
  return exchangeGoogleTokenToBackend(fallbackUser);
}

/**
 * Logout (revoke JWT on backend)
 */
export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
