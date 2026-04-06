import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import { getDashboard, getRecentTransactions } from "../../services/dashboardService";
import SummaryCard from "../../components/SummaryCard";
import TransactionCard from "../../components/TransactionCard";
import BudgetStatusBar from "../../components/BudgetStatusBar";

/* ── SVG Icons ─────────────────────────────────────────── */
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IncomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ExpenseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const BalanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [dashRes, txRes] = await Promise.all([
          getDashboard(),
          getRecentTransactions(),
        ]);
        setDashboard(dashRes.data);
        // Take last 5 transactions (most recent first)
        const sorted = (txRes.data || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setTransactions(sorted.slice(0, 5));
      } catch (err) {
        setError("Gagal memuat data dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if backend logout fails, clear local state
    }
    logout();
    navigate("/login", { replace: true });
  };

  const totals = dashboard?.totals || {};
  const budgets = dashboard?.budgets || {};
  const budgetStatuses = budgets.status || [];

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard-layout">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <div className="dashboard-header__logo">
            <WalletIcon />
          </div>
          <div>
            <h2>MoneyMate</h2>
            <span className="dashboard-header__date">{today}</span>
          </div>
        </div>
        <div className="dashboard-header__right">
          <div className="dashboard-header__user">
            <div className="dashboard-header__avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="dashboard-header__name">{user?.name}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} id="logout-btn">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────── */}
      <main className="dashboard-main">
        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat dashboard...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <span className="dashboard-error__icon">⚠️</span>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "12px" }}
              onClick={() => window.location.reload()}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* ── Greeting ─────────────────────────────── */}
            <section className="dashboard-greeting">
              <h1>Halo, {user?.name?.split(" ")[0] || "User"} 👋</h1>
              <p>Berikut ringkasan keuanganmu hari ini.</p>
            </section>

            {/* ── Summary Cards ────────────────────────── */}
            <section className="dashboard-summary" id="summary-cards">
              <SummaryCard
                icon={<BalanceIcon />}
                label="Saldo"
                amount={totals.balance}
                color="#6c63ff"
                delay={0}
              />
              <SummaryCard
                icon={<IncomeIcon />}
                label="Pemasukan"
                amount={totals.income}
                color="#2ecc71"
                delay={1}
              />
              <SummaryCard
                icon={<ExpenseIcon />}
                label="Pengeluaran"
                amount={totals.expense}
                color="#ff4757"
                delay={2}
              />
            </section>

            {/* ── Budget Status Section ─────────────────── */}
            {budgetStatuses.length > 0 && (
              <section className="dashboard-section" id="budget-status">
                <div className="dashboard-section__header">
                  <h3>💰 Budget Hari Ini</h3>
                  <span className="dashboard-section__badge">
                    {budgets.active_count} aktif
                  </span>
                </div>
                <div className="budget-status-list">
                  {budgetStatuses.map((b, i) => (
                    <BudgetStatusBar
                      key={b.budget_period_id}
                      name={b.name}
                      categoryName={b.category_name}
                      effectiveBudget={b.daily_status?.effective_budget}
                      totalSpent={b.daily_status?.total_spent}
                      remaining={b.daily_status?.remaining}
                      isWeekend={b.daily_status?.is_weekend}
                      delay={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Recent Transactions ──────────────────── */}
            <section className="dashboard-section" id="recent-transactions">
              <div className="dashboard-section__header">
                <h3>📋 Transaksi Terbaru</h3>
                {transactions.length > 0 && (
                  <span className="dashboard-section__count">
                    {transactions.length} terakhir
                  </span>
                )}
              </div>
              {transactions.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="dashboard-empty__icon">📭</span>
                  <p>Belum ada transaksi.</p>
                  <span className="dashboard-empty__sub">
                    Mulai catat pemasukan dan pengeluaranmu!
                  </span>
                </div>
              ) : (
                <div className="transaction-list">
                  {transactions.map((tx, i) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      delay={i}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
