import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend logout fails, clear local state
    }
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <h2>MoneyMate</h2>
          {user && <span className="dashboard-username">{user.name}</span>}
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <span className="welcome-emoji">💰</span>
          <h1>Selamat Datang{user ? `, ${user.name}` : ""}!</h1>
          <p>Dashboard keuanganmu siap digunakan.</p>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
