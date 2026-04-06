import api from "./api";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase.config";

/**
 * Register a new user (local auth)
 */
export async function registerUser({ name, email, password }) {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data; // { message, data: { token, user } }
}

/**
 * Login with email + password (local auth)
 */
export async function loginUser({ email, password }) {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
}

/**
 * Google Sign-In: opens Firebase popup, gets ID token, sends to backend
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  const res = await api.post("/api/auth/google", { idToken });
  return res.data;
}

/**
 * Logout (revoke JWT on backend)
 */
export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
