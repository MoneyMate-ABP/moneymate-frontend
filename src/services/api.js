import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — auto-inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
