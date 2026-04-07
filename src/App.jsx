import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import BudgetListPage from "./pages/budget/BudgetListPage.jsx";
import BudgetFormPage from "./pages/budget/BudgetFormPage.jsx";
import DailyStatusPage from "./pages/budget/DailyStatusPage.jsx";
import TransactionList from "./pages/transactions/TransactionList.jsx";
import TransactionForm from "./pages/transactions/TransactionForm.jsx";
import TransactionDetail from "./pages/transactions/TransactionDetail.jsx";
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

      {/* Protected routes (without AppLayout) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <BudgetListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets/new"
        element={
          <ProtectedRoute>
            <BudgetFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets/:id/edit"
        element={
          <ProtectedRoute>
            <BudgetFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets/:id/status"
        element={
          <ProtectedRoute>
            <DailyStatusPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />

      {/* ── Transaction Routes ────────────────────────── */}
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/add"
        element={
          <ProtectedRoute>
            <TransactionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id"
        element={
          <ProtectedRoute>
            <TransactionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id/edit"
        element={
          <ProtectedRoute>
            <TransactionForm />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
