import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CategoryBadge from "../../components/CategoryBadge";
import ConfirmModal from "../../components/ConfirmModal";
import TransactionFormModal from "../../components/TransactionFormModal";
import { getLocationName } from "../../utils/locationLookup";

/* ── SVG Icons ─────────────────────────────────────────── */
const WalletIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="14"
    height="14"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Helpers ────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateFull = (dateStr) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ── Detail Modal ──────────────────────────────────────── */
function TransactionDetailModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  const isExpense = transaction.type === "expense";
  const hasLocation = transaction.latitude && transaction.longitude;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${transaction.latitude},${transaction.longitude}`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detail Transaksi</h3>
          <button
            className="modal-close"
            onClick={onClose}
            id="detail-modal-close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="tx-detail">
          {/* Amount Hero */}
          <div
            className={`tx-detail__amount-hero ${isExpense ? "expense" : "income"}`}
          >
            <span className="tx-detail__type-label">
              {isExpense ? "Pengeluaran" : "Pemasukan"}
            </span>
            <span className="tx-detail__amount-value">
              {isExpense ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          {/* Info Rows */}
          <div className="tx-detail__rows">
            <div className="tx-detail__row">
              <span className="tx-detail__label">Kategori</span>
              <CategoryBadge
                name={transaction.category_name}
                type={transaction.type}
              />
            </div>

            <div className="tx-detail__row">
              <span className="tx-detail__label">Tanggal</span>
              <span className="tx-detail__value">
                {formatDateFull(transaction.date)}
              </span>
            </div>

            {transaction.note && (
              <div className="tx-detail__row">
                <span className="tx-detail__label">Catatan</span>
                <span className="tx-detail__value">{transaction.note}</span>
              </div>
            )}

            {transaction.budget_period_name && (
              <div className="tx-detail__row">
                <span className="tx-detail__label">Budget Period</span>
                <span className="tx-detail__value">
                  {transaction.budget_period_name}
                </span>
              </div>
            )}

            {hasLocation && (
              <div className="tx-detail__row">
                <span className="tx-detail__label">Lokasi</span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-detail__location-link"
                  id="tx-maps-link"
                >
                  <MapPinIcon />
                  Lihat di Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TRANSACTIONS PAGE
   ══════════════════════════════════════════════════════════ */
function TransactionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTx, setDetailTx] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationNames, setLocationNames] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [txRes, catRes] = await Promise.all([
        getTransactions(),
        getCategories(user?.id),
      ]);
      const sorted = (txRes.data || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      setTransactions(sorted);
      setCategories(catRes.data || []);
    } catch (err) {
      setError("Gagal memuat data transaksi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      /* noop */
    }
    logout();
    navigate("/login", { replace: true });
  };

  // Create / Update
  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data);
        showToast("Transaksi berhasil diperbarui! ✨");
      } else {
        await createTransaction(data);
        showToast("Transaksi berhasil ditambahkan! 🎉");
      }
      setFormOpen(false);
      setEditingTx(null);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Terjadi kesalahan.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingTx) return;
    setSubmitting(true);
    try {
      await deleteTransaction(deletingTx.id);
      showToast("Transaksi berhasil dihapus! 🗑️");
      setDeleteOpen(false);
      setDeletingTx(null);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus transaksi.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open modals
  const openCreate = () => {
    setEditingTx(null);
    setFormOpen(true);
  };
  const openEdit = (tx) => {
    setEditingTx(tx);
    setFormOpen(true);
  };
  const openDelete = (tx) => {
    setDeletingTx(tx);
    setDeleteOpen(true);
  };
  const openDetail = (tx) => {
    setDetailTx(tx);
    setDetailOpen(true);
  };

  // Filtering
  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && String(tx.category_id) !== filterCategory)
      return false;
    if (filterDateFrom && new Date(tx.date) < new Date(filterDateFrom))
      return false;
    if (
      filterDateTo &&
      new Date(tx.date) > new Date(filterDateTo + "T23:59:59")
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchCategory = (tx.category_name || "").toLowerCase().includes(q);
      if (!matchNote && !matchCategory) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    let active = true;

    const targets = paginated.filter(
      (tx) => tx.latitude && tx.longitude && !locationNames[tx.id],
    );

    if (targets.length === 0) return undefined;

    (async () => {
      const updates = {};
      for (const tx of targets) {
        const name = await getLocationName(tx.latitude, tx.longitude);
        if (name) {
          updates[tx.id] = name;
        }
      }

      if (active && Object.keys(updates).length > 0) {
        setLocationNames((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      active = false;
    };
  }, [paginated, locationNames]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, filterDateFrom, filterDateTo, searchQuery]);

  // Summary
  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterDateFrom ||
    filterDateTo ||
    searchQuery;

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

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`} id="toast-notification">
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/")}
            id="back-to-dashboard"
          >
            <BackIcon />
          </button>
          <div>
            <h1>Transaksi</h1>
            <p>Kelola semua transaksi pemasukan dan pengeluaranmu</p>
          </div>
        </div>

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
              onClick={fetchData}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* ── Summary Mini Cards ─────────────────────── */}
            <div className="tx-mini-summary" id="tx-summary">
              <div className="tx-mini-card tx-mini-card--income">
                <span className="tx-mini-card__label">💰 Pemasukan</span>
                <span className="tx-mini-card__value income">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="tx-mini-card tx-mini-card--expense">
                <span className="tx-mini-card__label">💸 Pengeluaran</span>
                <span className="tx-mini-card__value expense">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="tx-mini-card tx-mini-card--balance">
                <span className="tx-mini-card__label">💵 Selisih</span>
                <span
                  className={`tx-mini-card__value ${totalIncome - totalExpense >= 0 ? "income" : "expense"}`}
                >
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </div>
            </div>

            {/* ── Toolbar ────────────────────────────────── */}
            <div className="tx-toolbar" id="tx-toolbar">
              <div className="tx-toolbar__search">
                <SearchIcon />
                <input
                  className="form-input tx-toolbar__input"
                  type="text"
                  placeholder="Cari catatan atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search-tx-input"
                />
              </div>
              <button
                className="btn btn-primary tx-toolbar__add"
                onClick={openCreate}
                id="add-tx-btn"
              >
                <PlusIcon />
                <span>Tambah</span>
              </button>
            </div>

            {/* ── Filters ────────────────────────────────── */}
            <div className="tx-filters" id="tx-filters">
              {/* Type */}
              <div className="tx-filters__group">
                <label className="tx-filters__label">Tipe</label>
                <div className="tx-filters__chips">
                  {["all", "income", "expense"].map((t) => (
                    <button
                      key={t}
                      className={`category-filter-chip ${filterType === t ? "active" : ""}`}
                      onClick={() => setFilterType(t)}
                      id={`filter-type-${t}`}
                    >
                      {t === "all"
                        ? "Semua"
                        : t === "income"
                          ? "Pemasukan"
                          : "Pengeluaran"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="tx-filters__group">
                <label className="tx-filters__label">Kategori</label>
                <select
                  className="form-input form-select form-select--sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  id="filter-category"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="tx-filters__group">
                <label className="tx-filters__label">Tanggal</label>
                <div className="tx-filters__date-range">
                  <input
                    className="form-input form-input--sm"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    id="filter-date-from"
                  />
                  <span className="tx-filters__separator">—</span>
                  <input
                    className="form-input form-input--sm"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    id="filter-date-to"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  className="tx-filters__clear"
                  onClick={clearFilters}
                  id="clear-filters"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* ── Count ──────────────────────────────────── */}
            <div className="category-count">
              <span>{filtered.length} transaksi ditemukan</span>
            </div>

            {/* ── Transaction List ────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="dashboard-empty">
                <span className="dashboard-empty__icon">📭</span>
                <p>
                  {hasActiveFilters
                    ? "Tidak ada transaksi yang cocok dengan filter."
                    : "Belum ada transaksi."}
                </p>
                <span className="dashboard-empty__sub">
                  {hasActiveFilters
                    ? "Coba ubah filter atau kata kunci pencarian."
                    : "Mulai catat pemasukan dan pengeluaranmu!"}
                </span>
              </div>
            ) : (
              <>
                <div className="tx-table-wrapper" id="tx-list">
                  {/* Desktop table */}
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Catatan</th>
                        <th className="tx-table__right">Jumlah</th>
                        <th className="tx-table__center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((tx, i) => {
                        const isExpense = tx.type === "expense";
                        const hasLocation = tx.latitude && tx.longitude;
                        return (
                          <tr
                            key={tx.id}
                            className="tx-table__row"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <td className="tx-table__date">
                              {formatDate(tx.date)}
                            </td>
                            <td>
                              <CategoryBadge
                                name={tx.category_name}
                                type={tx.type}
                              />
                            </td>
                            <td className="tx-table__note">
                              <span>{tx.note || "—"}</span>
                              {hasLocation && (
                                <span
                                  className="tx-table__location-dot"
                                  title="Memiliki lokasi"
                                >
                                  <MapPinIcon />
                                </span>
                              )}
                              {hasLocation && locationNames[tx.id] && (
                                <span className="tx-location-preview">
                                  {locationNames[tx.id]}
                                </span>
                              )}
                            </td>
                            <td
                              className={`tx-table__amount ${isExpense ? "expense" : "income"}`}
                            >
                              {isExpense ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="tx-table__actions">
                              <button
                                className="category-card__btn category-card__btn--edit"
                                onClick={() => openDetail(tx)}
                                title="Detail"
                                id={`detail-tx-${tx.id}`}
                              >
                                <EyeIcon />
                              </button>
                              <button
                                className="category-card__btn category-card__btn--edit"
                                onClick={() => openEdit(tx)}
                                title="Edit"
                                id={`edit-tx-${tx.id}`}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="category-card__btn category-card__btn--delete"
                                onClick={() => openDelete(tx)}
                                title="Hapus"
                                id={`delete-tx-${tx.id}`}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards (visible on small screens) */}
                <div className="tx-mobile-list" id="tx-mobile-list">
                  {paginated.map((tx, i) => {
                    const isExpense = tx.type === "expense";
                    const hasLocation = tx.latitude && tx.longitude;
                    return (
                      <div
                        key={tx.id}
                        className="tx-mobile-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => openDetail(tx)}
                      >
                        <div className="tx-mobile-card__top">
                          <CategoryBadge
                            name={tx.category_name}
                            type={tx.type}
                          />
                          <span
                            className={`tx-mobile-card__amount ${isExpense ? "expense" : "income"}`}
                          >
                            {isExpense ? "-" : "+"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                        <div className="tx-mobile-card__bottom">
                          <span className="tx-mobile-card__date">
                            {formatDate(tx.date)}
                          </span>
                          <span className="tx-mobile-card__note">
                            {tx.note || "—"}
                            {hasLocation && <MapPinIcon />}
                          </span>
                        </div>
                        {hasLocation && locationNames[tx.id] && (
                          <span className="tx-location-preview tx-location-preview--mobile">
                            {locationNames[tx.id]}
                          </span>
                        )}
                        <div
                          className="tx-mobile-card__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="category-card__btn category-card__btn--edit"
                            onClick={() => openEdit(tx)}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="category-card__btn category-card__btn--delete"
                            onClick={() => openDelete(tx)}
                            title="Hapus"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="tx-pagination" id="tx-pagination">
                    <button
                      className="tx-pagination__btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      ‹ Prev
                    </button>
                    <div className="tx-pagination__pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            className={`tx-pagination__page ${currentPage === page ? "active" : ""}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>
                    <button
                      className="tx-pagination__btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────── */}
      <TransactionFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTx}
        isSubmitting={submitting}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingTx(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message={
          <>
            Yakin ingin menghapus transaksi{" "}
            <strong>
              &quot;{deletingTx?.category_name} —{" "}
              {formatCurrency(deletingTx?.amount || 0)}&quot;
            </strong>
            ?
          </>
        }
        warning="Transaksi yang dihapus tidak bisa dikembalikan."
        confirmText="Hapus"
        icon="🗑️"
        isSubmitting={submitting}
      />

      <TransactionDetailModal
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailTx(null);
        }}
        transaction={detailTx}
      />
    </div>
  );
}

export default TransactionsPage;
