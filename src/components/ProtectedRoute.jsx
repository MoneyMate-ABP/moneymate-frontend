import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

/**
 * Wraps routes that require authentication.
 * Redirects to /login if no valid token exists.
 */
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
