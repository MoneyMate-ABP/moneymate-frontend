import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { logoutUser } from "../services/authService";

function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend fails, clear local state
    }
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo" id="app-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="app-brand">MoneyMate</span>
        </div>

        <nav className="app-nav" id="main-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
            id="nav-dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink
            to="/budgets"
            className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
            id="nav-budgets"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 010-4h14v4" />
              <path d="M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
            </svg>
            Budgets
          </NavLink>
        </nav>

        <div className="app-header-right">
          {user && (
            <div className="app-user-info" id="user-info">
              <div className="app-user-avatar">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="app-user-name">{user.name}</span>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout} id="btn-logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
