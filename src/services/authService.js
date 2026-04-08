import api from "./api";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase.config";

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
  if (!result?.user) return null;

  return exchangeGoogleTokenToBackend(result.user);
}

/**
 * Logout (revoke JWT on backend)
 */
export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
