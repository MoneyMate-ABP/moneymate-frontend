import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <span className="welcome-emoji">💰</span>
        <h1>Selamat Datang{user ? `, ${user.name}` : ""}!</h1>
        <p>Dashboard keuanganmu siap digunakan.</p>

        <div className="dashboard-quick-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/budgets")}
            id="btn-go-budgets"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M21 12V7H5a2 2 0 010-4h14v4" />
              <path d="M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
            </svg>
            Kelola Budget
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
