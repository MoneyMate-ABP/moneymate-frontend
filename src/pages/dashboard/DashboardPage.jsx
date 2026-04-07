import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getDashboard } from "../../services/dashboardService";
import { formatCurrency } from "../../utils/dateHelpers";
import dayjs from "dayjs";

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getDashboard()
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Gagal memuat dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  const today = dayjs().format("dddd, D MMMM YYYY");

  return (
    <div className="dashboard-page">
      {/* ── Welcome Header ──────────────────────── */}
      <div className="dash-welcome-section">
        <span className="dash-welcome-emoji">💰</span>
        <h1 className="dash-welcome-title" id="dash-title">
          Selamat Datang{user ? `, ${user.name}` : ""}!
        </h1>
        <p className="dash-welcome-date">{today}</p>
      </div>

      {/* ── Error ────────────────────────────────── */}
      {error && (
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────── */}
      {loading ? (
        <div className="dash-overview-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-skeleton-card">
              <div className="skeleton-line skeleton-sub" />
              <div className="skeleton-line skeleton-amount" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* ── Financial Overview Cards ──────────── */}
          <div className="dash-overview-grid" id="dash-overview">
            <div className="dash-overview-card dash-card-balance">
              <div className="dash-card-icon-wrap dash-icon-balance">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div>
                <span className="dash-card-label">Saldo</span>
                <span className="dash-card-value">{formatCurrency(data.totals?.balance ?? 0)}</span>
              </div>
            </div>

            <div className="dash-overview-card dash-card-income">
              <div className="dash-card-icon-wrap dash-icon-income">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div>
                <span className="dash-card-label">Pemasukan</span>
                <span className="dash-card-value dash-val-income">{formatCurrency(data.totals?.income ?? 0)}</span>
              </div>
            </div>

            <div className="dash-overview-card dash-card-expense">
              <div className="dash-card-icon-wrap dash-icon-expense">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
              </div>
              <div>
                <span className="dash-card-label">Pengeluaran</span>
                <span className="dash-card-value dash-val-expense">{formatCurrency(data.totals?.expense ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* ── Quick Navigation Card ────────────── */}
          <div className="dash-nav-cards">
            <div
              className="dash-nav-card"
              onClick={() => navigate("/budgets")}
              role="button"
              tabIndex={0}
              id="dash-goto-budgets"
            >
              <div className="dash-nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                  <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                  <path d="M3 5v14a2 2 0 002 2h16v-5" />
                  <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
                </svg>
              </div>
              <div className="dash-nav-text">
                <h3>Budget Periods</h3>
                <p>Kelola periode anggaran, lihat status harian, dan atur budget bulananmu</p>
              </div>
              <div className="dash-nav-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default DashboardPage;
