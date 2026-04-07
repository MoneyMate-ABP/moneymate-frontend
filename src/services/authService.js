import api from "./api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase.config";

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
  // Sign out any previous Firebase session first to avoid stale tokens
  await auth.signOut().catch(() => {});

  const result = await signInWithPopup(auth, googleProvider);
  // Force-refresh to get a fresh, valid ID token
  const idToken = await result.user.getIdToken(true);

  try {
    const res = await api.post("/api/auth/google", { idToken });
    return res.data;
  } finally {
    // Sign out from Firebase — we only use it for the ID token exchange
    // Our app uses its own JWT from the backend
    await auth.signOut().catch(() => {});
  }
}

/**
 * Logout (revoke JWT on backend)
 */
export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
