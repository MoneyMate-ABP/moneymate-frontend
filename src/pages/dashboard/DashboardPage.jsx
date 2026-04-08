import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { getCategories } from "../../services/categoryService";
import { createTransaction } from "../../services/transactionService";
import {
  getDashboard,
  getRecentTransactions,
} from "../../services/dashboardService";
import SummaryCard from "../../components/SummaryCard";
import TransactionCard from "../../components/TransactionCard";
import BudgetStatusBar from "../../components/BudgetStatusBar";
import CurrencyInput from "../../components/CurrencyInput";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickCategories, setQuickCategories] = useState([]);
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);
  const [quickCategoryError, setQuickCategoryError] = useState("");
  const [quickType, setQuickType] = useState("expense");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickAmount, setQuickAmount] = useState(0);
  const [quickNote, setQuickNote] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickSubmitError, setQuickSubmitError] = useState("");

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

  useEffect(() => {
    if (!isModalOpen) return;

    let mounted = true;

    async function fetchQuickCategories() {
      setQuickCategoryLoading(true);
      setQuickCategoryError("");
      try {
        const res = await getCategories(user?.id);
        if (mounted) {
          setQuickCategories(res.data || []);
        }
      } catch {
        if (mounted) {
          setQuickCategories([]);
          setQuickCategoryError("Gagal memuat kategori.");
        }
      } finally {
        if (mounted) {
          setQuickCategoryLoading(false);
        }
      }
    }

    fetchQuickCategories();

    return () => {
      mounted = false;
    };
  }, [isModalOpen, user?.id]);

  useEffect(() => {
    if (!isModalOpen) return;

    setQuickAmount(0);
    setQuickType("expense");
    setQuickCategoryId("");
    setQuickNote("");
    setQuickSubmitError("");
  }, [isModalOpen]);

  const quickFilteredCategories = useMemo(
    () =>
      quickCategories.filter(
        (cat) => cat.type === quickType || cat.type === "both",
      ),
    [quickCategories, quickType],
  );

  useEffect(() => {
    if (!quickCategoryId) return;

    const isCategoryValid = quickFilteredCategories.some(
      (cat) => String(cat.id) === String(quickCategoryId),
    );

    if (!isCategoryValid) {
      setQuickCategoryId("");
    }
  }, [quickFilteredCategories, quickCategoryId]);

  const handleQuickSubmit = async () => {
    if (quickAmount <= 0) {
      setQuickSubmitError("Nominal harus lebih dari 0.");
      return;
    }

    if (!quickCategoryId) {
      setQuickSubmitError("Pilih kategori terlebih dahulu.");
      return;
    }

    setQuickSubmitError("");
    setQuickSubmitting(true);

    try {
      await createTransaction({
        amount: Number(quickAmount),
        type: quickType,
        category_id: Number(quickCategoryId),
        date: new Date().toISOString().split("T")[0],
        note: quickNote.trim() || null,
        latitude: null,
        longitude: null,
      });

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menambahkan transaksi.";
      setQuickSubmitError(msg);
    } finally {
      setQuickSubmitting(false);
    }
  };

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
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsModalOpen(true)}
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

        {/* ── Tambah Transaksi Modal ─────────────────── */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tambah Transaksi</h3>
                <button
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nominal</label>
                  <CurrencyInput
                    id="quick-amount"
                    value={quickAmount}
                    onChange={setQuickAmount}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe</label>
                  <select
                    className="form-input"
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value)}
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={quickCategoryId}
                    onChange={(e) => setQuickCategoryId(e.target.value)}
                    disabled={quickCategoryLoading || !!quickCategoryError}
                  >
                    <option value="" disabled>
                      {quickCategoryLoading
                        ? "Memuat kategori..."
                        : quickCategoryError
                          ? "Kategori gagal dimuat"
                          : quickFilteredCategories.length === 0
                            ? "Belum ada kategori untuk tipe ini"
                            : "Pilih kategori"}
                    </option>
                    {quickFilteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {quickCategoryError && (
                    <span className="form-error">{quickCategoryError}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Makan siang, belanja..."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                  />
                </div>
                {quickSubmitError && (
                  <span className="form-error">{quickSubmitError}</span>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={quickSubmitting}
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={quickSubmitting || quickCategoryLoading}
                  onClick={handleQuickSubmit}
                >
                  {quickSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
