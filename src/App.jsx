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
import AppLayout from "./components/layout/AppLayout.jsx";
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
      {/* Public routes (no AppLayout) */}
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

      {/* Protected routes — wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/budgets" element={<BudgetListPage />} />
        <Route path="/budgets/new" element={<BudgetFormPage />} />
        <Route path="/budgets/:id/edit" element={<BudgetFormPage />} />
        <Route path="/budgets/:id/status" element={<DailyStatusPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="/transactions/add" element={<TransactionForm />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/transactions/:id/edit" element={<TransactionForm />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
