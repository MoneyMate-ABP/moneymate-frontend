import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import TransactionsPage from "./pages/transactions/TransactionsPage.jsx";
import TransactionFormPage from "./pages/transactions/TransactionFormPage.jsx";
import TransactionDetailPage from "./pages/transactions/TransactionDetailPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import useAuthStore from "./store/authStore.js";

/**
 * Public route wrapper — redirects to / if already authenticated
 */
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/new"
        element={
          <ProtectedRoute>
            <TransactionFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id"
        element={
          <ProtectedRoute>
            <TransactionDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id/edit"
        element={
          <ProtectedRoute>
            <TransactionFormPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
