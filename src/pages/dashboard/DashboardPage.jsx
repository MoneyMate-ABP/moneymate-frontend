import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import {
  getDashboard,
  getRecentTransactions,
} from "../../services/dashboardService";
import SummaryCard from "../../components/SummaryCard";
import TransactionCard from "../../components/TransactionCard";
import BudgetStatusBar from "../../components/BudgetStatusBar";

/* ── SVG Icons ─────────────────────────────────────────── */
const IncomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ExpenseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const BalanceIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
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
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setTransactions(sorted.slice(0, 5));
    } catch (err) {
      setError("Gagal memuat data dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = dashboard?.totals || {};
  const budgets = dashboard?.budgets || {};
  const budgetStatuses = budgets.status || [];

  return (
    <div className="page-container">
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

            {/* ── Daily Summary (Hari Ini) ──────────────── */}
            {budgets && (
              <section
                className="dashboard-section"
                id="daily-summary-section"
                style={{ marginBottom: "24px" }}
              >
                <div className="dashboard-section__header">
                  <h3>📅 Track Hari Ini</h3>
                </div>
                <section
                  className="dashboard-daily-summary"
                  id="daily-summary-cards"
                  style={{ marginTop: "16px" }}
                >
                  <SummaryCard
                    icon={<BalanceIcon />}
                    label="Sisa Saldo Hari Ini"
                    amount={budgets.remaining_today ?? 0}
                    color="#00a8ff"
                    delay={0}
                  />
                  <SummaryCard
                    icon={<ExpenseIcon />}
                    label="Pengeluaran Hari Ini"
                    amount={budgets.spent_today ?? 0}
                    color="#ff4757"
                    delay={1}
                  />
                </section>
              </section>
            )}

            {/* ── Summary Cards ────────────────────────── */}
            <section
              className="dashboard-section"
              id="monthly-summary-section"
              style={{ marginBottom: "24px" }}
            >
              <div className="dashboard-section__header">
                <h3>📊 Track Bulan Ini</h3>
              </div>
              <section
                className="dashboard-summary"
                id="summary-cards"
                style={{ marginTop: "16px" }}
              >
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
            </section>

            {/* ── Budget Status Section ─────────────────── */}
            {budgetStatuses.length > 0 && (
              <section className="dashboard-section" id="budget-status">
                <div className="dashboard-section__header">
                  <h3>💰 Budget Hari Ini</h3>
                  <div
                    className="dashboard-quick-actions"
                    style={{ gap: "8px" }}
                  >
                    <span className="dashboard-section__badge">
                      {budgets.active_count} aktif
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate("/budgets/invest-savings")}
                    >
                      Tabungan Invest
                    </button>
                  </div>
                </div>
                <div className="budget-status-list">
                  {budgetStatuses.map((b, i) => (
                    <BudgetStatusBar
                      key={b.budget_period_id}
                      name={b.name}
                      categoryName={b.category_name}
                      budgetSystem={b.budget_system}
                      baseBudget={b.daily_status?.base}
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
              <div
                className="dashboard-section__header"
                style={{ flexWrap: "wrap", gap: "16px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <h3>📋 Transaksi Terbaru</h3>
                  {transactions.length > 0 && (
                    <span className="dashboard-section__count">
                      {transactions.length} terakhir
                    </span>
                  )}
                </div>
                <div className="dashboard-quick-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate("/transactions")}
                  >
                    List Transaksi
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate("/transactions?openScan=1")}
                  >
                    Scan Struk
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/transactions/add")}
                  >
                    + Tambah Transaksi
                  </button>
                </div>
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
                    <TransactionCard key={tx.id} transaction={tx} delay={i} />
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
