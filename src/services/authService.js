import api from "./api";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase.config";

const REDIRECT_PENDING_KEY = "mm_google_redirect_pending";

function setRedirectPending(value) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
    } else {
      window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    }
  } catch {
    // Ignore storage access issues (private mode restrictions, etc.)
  }
}

function isRedirectPending() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
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

  return isIOS && isSafari;
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
  if (shouldUseRedirectFlow()) {
    setRedirectPending(true);
    await signInWithRedirect(auth, googleProvider);
    return { redirect: true };
  }

  // Popup remains default for desktop and non-Safari iOS browsers.
  const result = await signInWithPopup(auth, googleProvider);
  return exchangeGoogleTokenToBackend(result.user);
}

/**
 * Complete redirect-based Google Sign-In after returning from provider page.
 */
export async function completeGoogleRedirectLogin() {
  const result = await getRedirectResult(auth);
  const redirectUser = result?.user || null;

  if (redirectUser) {
    setRedirectPending(false);
    return exchangeGoogleTokenToBackend(redirectUser);
  }

  if (!isRedirectPending()) return null;

  const fallbackUser = auth.currentUser || (await waitForAuthUser());
  if (!fallbackUser) return null;

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
