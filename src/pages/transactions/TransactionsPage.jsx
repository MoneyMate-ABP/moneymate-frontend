import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import TransactionCard from "../../components/TransactionCard";
import TransactionModal from "../../components/TransactionModal";

/* ── Icons ──────────────────────────────────────────────────── */
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/* ── Category icons map ─────────────────────────────────────── */
const categoryIcons = {
  Makanan: "🍔", Transportasi: "🚗", Hiburan: "🎬",
  Lainnya: "📦", Gaji: "💰", Freelance: "💻",
};

/* ── Transaction row with edit/delete ───────────────────────── */
function TransactionRow({ transaction, onEdit, onDelete, delay = 0 }) {
  const { type, amount, note, date, category_name, budget_period_name } = transaction;
  const isExpense = type === "expense";
  const icon = categoryIcons[category_name] || (isExpense ? "💸" : "💵");

  const fmt = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);

  const displayDate = new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="tx-row"
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className={`tx-row__icon ${isExpense ? "expense" : "income"}`}>
        <span>{icon}</span>
      </div>
      <div className="tx-row__details">
        <span className="tx-row__category">{category_name || "Uncategorized"}</span>
        <span className="tx-row__meta">
          {displayDate}
          {budget_period_name && (
            <span className="tx-row__period">{budget_period_name}</span>
          )}
        </span>
        {note && <span className="tx-row__note">{note}</span>}
      </div>
      <div className="tx-row__right">
        <div className={`tx-row__amount ${isExpense ? "expense" : "income"}`}>
          {isExpense ? "-" : "+"}{fmt}
        </div>
        <div className="tx-row__actions">
          <button
            className="tx-row__action-btn edit"
            onClick={() => onEdit(transaction)}
            title="Edit"
            aria-label="Edit transaksi"
          >
            <EditIcon />
          </button>
          <button
            className="tx-row__action-btn delete"
            onClick={() => onDelete(transaction)}
            title="Hapus"
            aria-label="Hapus transaksi"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
function TransactionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Delete confirm
  const [deletingTx, setDeletingTx] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = Number(filterCategory);

      const res = await getTransactions(params);
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date) || new Date(b.created_at) - new Date(a.created_at)
      );
      setTransactions(sorted);
    } catch (err) {
      setError("Gagal memuat transaksi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterType, filterCategory]);

  // Fetch categories for filter dropdown
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* ignored */ }
    logout();
    navigate("/login", { replace: true });
  };

  const handleOpenCreate = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchTransactions();
  };

  const handleDeleteClick = (tx) => {
    setDeletingTx(tx);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(deletingTx.id);
      setDeletingTx(null);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus transaksi.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterType("");
    setFilterCategory("");
  };

  const hasFilters = filterDate || filterType || filterCategory;

  // Totals summary
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const fmt = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", minimumFractionDigits: 0,
    }).format(val);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="dashboard-layout">
      {/* Header */}
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

      <main className="dashboard-main">
        {/* Page title + back */}
        <section className="tx-page-title">
          <div className="tx-page-title__left">
            <button
              className="tx-back-btn"
              onClick={() => navigate("/")}
              id="back-to-dashboard-btn"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeftIcon />
              Dashboard
            </button>
            <div>
              <h1 className="tx-page-heading">📋 Semua Transaksi</h1>
              {!loading && (
                <p className="tx-page-sub">
                  {transactions.length} transaksi
                  {hasFilters ? " (filter aktif)" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreate}
            id="add-transaction-btn"
          >
            + Tambah Transaksi
          </button>
        </section>

        {/* Summary bar */}
        {!loading && !error && transactions.length > 0 && (
          <div className="tx-summary-bar">
            <div className="tx-summary-bar__item income">
              <span className="tx-summary-bar__label">Total Pemasukan</span>
              <span className="tx-summary-bar__value">{fmt(totalIncome)}</span>
            </div>
            <div className="tx-summary-bar__divider" />
            <div className="tx-summary-bar__item expense">
              <span className="tx-summary-bar__label">Total Pengeluaran</span>
              <span className="tx-summary-bar__value">{fmt(totalExpense)}</span>
            </div>
            <div className="tx-summary-bar__divider" />
            <div className={`tx-summary-bar__item ${totalIncome - totalExpense >= 0 ? "income" : "expense"}`}>
              <span className="tx-summary-bar__label">Selisih</span>
              <span className="tx-summary-bar__value">{fmt(totalIncome - totalExpense)}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="tx-filters">
          <div className="tx-filters__row">
            <div className="tx-filters__group">
              <label htmlFor="filter-date" className="form-label">Tanggal</label>
              <input
                id="filter-date"
                type="date"
                className="form-input form-input--sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="tx-filters__group">
              <label htmlFor="filter-type" className="form-label">Tipe</label>
              <select
                id="filter-type"
                className="form-input form-input--sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>
            <div className="tx-filters__group">
              <label htmlFor="filter-category" className="form-label">Kategori</label>
              <select
                id="filter-category"
                className="form-input form-input--sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Semua</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                className="btn btn-secondary btn-sm tx-filters__clear"
                onClick={clearFilters}
                id="clear-filters-btn"
              >
                ✕ Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat transaksi...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <span className="dashboard-error__icon">⚠️</span>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "12px" }}
              onClick={fetchTransactions}
            >
              Coba lagi
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="dashboard-empty">
            <span className="dashboard-empty__icon">📭</span>
            <p>
              {hasFilters
                ? "Tidak ada transaksi sesuai filter."
                : "Belum ada transaksi."}
            </p>
            <span className="dashboard-empty__sub">
              {hasFilters
                ? "Coba ubah filter atau reset."
                : "Mulai catat pemasukan dan pengeluaranmu!"}
            </span>
            {!hasFilters && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "16px", width: "auto" }}
                onClick={handleOpenCreate}
              >
                + Tambah Transaksi
              </button>
            )}
          </div>
        ) : (
          <div className="tx-list">
            {transactions.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                delay={i}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Transaction Modal (Create / Edit) */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        transaction={editingTx}
      />

      {/* Delete Confirm Dialog */}
      {deletingTx && (
        <div
          className="modal-overlay"
          onClick={() => !deleteLoading && setDeletingTx(null)}
        >
          <div
            className="modal-content modal-content--confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header__title">
                <span>🗑️</span>
                <h3>Hapus Transaksi</h3>
              </div>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                Yakin ingin menghapus transaksi ini?
              </p>
              <div className="confirm-detail">
                <span className={`confirm-type ${deletingTx.type}`}>
                  {deletingTx.type === "expense" ? "💸 Pengeluaran" : "💵 Pemasukan"}
                </span>
                <span className="confirm-amount">
                  {fmt(deletingTx.amount)}
                </span>
              </div>
              {deletingTx.note && (
                <p className="confirm-note">"{deletingTx.note}"</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingTx(null)}
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                id="confirm-delete-btn"
              >
                {deleteLoading ? (
                  <><span className="spinner" /> Menghapus…</>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsPage;
