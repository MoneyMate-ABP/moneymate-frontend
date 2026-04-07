import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CategoryBadge from "../../components/CategoryBadge";
import ConfirmModal from "../../components/ConfirmModal";

/* ── SVG Icons ─────────────────────────────────────────── */
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
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

/* ══════════════════════════════════════════════════════════
   TRANSACTION LIST PAGE
   ══════════════════════════════════════════════════════════ */
function TransactionList() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Applied filters (active on the list)
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Temp filters inside modal (staged, not yet applied)
  const [tempType, setTempType] = useState("all");
  const [tempCategory, setTempCategory] = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");

  // Filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Accordion open states
  const [accordionDate, setAccordionDate] = useState(true);
  const [accordionType, setAccordionType] = useState(true);
  const [accordionCategory, setAccordionCategory] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch
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
    } catch {
      setError("Gagal memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logout
  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* noop */ }
    logout();
    navigate("/login", { replace: true });
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

  // Filter Modal handlers
  const openFilterModal = () => {
    // Sync temp values with current applied filters
    setTempType(filterType);
    setTempCategory(filterCategory);
    setTempDateFrom(filterDateFrom);
    setTempDateTo(filterDateTo);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setFilterType(tempType);
    setFilterCategory(tempCategory);
    setFilterDateFrom(tempDateFrom);
    setFilterDateTo(tempDateTo);
    setFilterModalOpen(false);
  };

  const resetFilters = () => {
    setTempType("all");
    setTempCategory("all");
    setTempDateFrom("");
    setTempDateTo("");
  };

  // Filtering
  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && String(tx.category_id) !== filterCategory) return false;
    if (filterDateFrom && new Date(tx.date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(tx.date) > new Date(filterDateTo + "T23:59:59")) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchCat = (tx.category_name || "").toLowerCase().includes(q);
      if (!matchNote && !matchCat) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [filterType, filterCategory, filterDateFrom, filterDateTo, searchQuery]);

  // Summary
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const hasActiveFilters = filterType !== "all" || filterCategory !== "all" || filterDateFrom || filterDateTo;
  const activeFilterCount = [
    filterType !== "all",
    filterCategory !== "all",
    filterDateFrom || filterDateTo,
  ].filter(Boolean).length;

  return (
    <div className="dashboard-layout">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <div className="dashboard-header__logo"><WalletIcon /></div>
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
            <LogoutIcon /><span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`} id="toast-notification">
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────── */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div className="category-page__header">
          <button className="category-page__back" onClick={() => navigate("/")} id="back-to-dashboard">
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
            <button className="btn btn-primary" style={{ width: "auto", marginTop: "12px" }} onClick={fetchData}>
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* ── Summary ──────────────────────────────── */}
            <div className="tx-mini-summary" id="tx-summary">
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💰 Pemasukan</span>
                <span className="tx-mini-card__value income">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💸 Pengeluaran</span>
                <span className="tx-mini-card__value expense">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💵 Selisih</span>
                <span className={`tx-mini-card__value ${totalIncome - totalExpense >= 0 ? "income" : "expense"}`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </div>
            </div>

            {/* ── Toolbar (Search + Filter button + Add) ── */}
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
                className={`btn tx-toolbar__filter ${hasActiveFilters ? "tx-toolbar__filter--active" : ""}`}
                onClick={openFilterModal}
                id="open-filter-modal-btn"
              >
                <FilterIcon />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="tx-toolbar__filter-badge">{activeFilterCount}</span>
                )}
              </button>
              <Link to="/transactions/add" className="btn btn-primary tx-toolbar__add" id="add-tx-btn">
                <PlusIcon /><span>Tambah</span>
              </Link>
            </div>

            {/* ── Active filter tags ─────────────────────── */}
            {hasActiveFilters && (
              <div className="tx-active-filters" id="active-filter-tags">
                {filterType !== "all" && (
                  <span className="tx-filter-tag">
                    {filterType === "income" ? "Pemasukan" : "Pengeluaran"}
                    <button onClick={() => setFilterType("all")} className="tx-filter-tag__remove">×</button>
                  </span>
                )}
                {filterCategory !== "all" && (
                  <span className="tx-filter-tag">
                    {categories.find((c) => String(c.id) === filterCategory)?.name || "Kategori"}
                    <button onClick={() => setFilterCategory("all")} className="tx-filter-tag__remove">×</button>
                  </span>
                )}
                {(filterDateFrom || filterDateTo) && (
                  <span className="tx-filter-tag">
                    {filterDateFrom || "..."} — {filterDateTo || "..."}
                    <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="tx-filter-tag__remove">×</button>
                  </span>
                )}
                <button className="tx-active-filters__clear" onClick={() => { setFilterType("all"); setFilterCategory("all"); setFilterDateFrom(""); setFilterDateTo(""); }} id="clear-all-filters">
                  Hapus Semua
                </button>
              </div>
            )}

            {/* ── Count ────────────────────────────────── */}
            <div className="category-count">
              <span>{filtered.length} transaksi ditemukan</span>
            </div>

            {/* ── List ─────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="dashboard-empty">
                <span className="dashboard-empty__icon">📭</span>
                <p>{hasActiveFilters || searchQuery ? "Tidak ada transaksi yang cocok dengan filter." : "Belum ada transaksi."}</p>
                <span className="dashboard-empty__sub">
                  {hasActiveFilters || searchQuery ? "Coba ubah filter atau kata kunci pencarian." : "Mulai catat pemasukan dan pengeluaranmu!"}
                </span>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="tx-table-wrapper" id="tx-list">
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
                        const isExp = tx.type === "expense";
                        const hasLoc = tx.latitude && tx.longitude;
                        return (
                          <tr key={tx.id} className="tx-table__row" style={{ animationDelay: `${i * 40}ms` }}>
                            <td className="tx-table__date">{formatDate(tx.date)}</td>
                            <td><CategoryBadge name={tx.category_name} type={tx.type} /></td>
                            <td className="tx-table__note">
                              <span>{tx.note || "—"}</span>
                              {hasLoc && <span className="tx-table__location-dot" title="Memiliki lokasi"><MapPinIcon /></span>}
                            </td>
                            <td className={`tx-table__amount ${isExp ? "expense" : "income"}`}>
                              {isExp ? "-" : "+"}{formatCurrency(tx.amount)}
                            </td>
                            <td className="tx-table__actions">
                              <Link to={`/transactions/${tx.id}`} className="category-card__btn category-card__btn--edit" title="Detail" id={`detail-tx-${tx.id}`}>
                                <EyeIcon />
                              </Link>
                              <Link to={`/transactions/${tx.id}/edit`} className="category-card__btn category-card__btn--edit" title="Edit" id={`edit-tx-${tx.id}`}>
                                <EditIcon />
                              </Link>
                              <button className="category-card__btn category-card__btn--delete" onClick={() => { setDeletingTx(tx); setDeleteOpen(true); }} title="Hapus" id={`delete-tx-${tx.id}`}>
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="tx-mobile-list" id="tx-mobile-list">
                  {paginated.map((tx, i) => {
                    const isExp = tx.type === "expense";
                    const hasLoc = tx.latitude && tx.longitude;
                    return (
                      <div key={tx.id} className="tx-mobile-card" style={{ animationDelay: `${i * 40}ms` }} onClick={() => navigate(`/transactions/${tx.id}`)}>
                        <div className="tx-mobile-card__top">
                          <CategoryBadge name={tx.category_name} type={tx.type} />
                          <span className={`tx-mobile-card__amount ${isExp ? "expense" : "income"}`}>
                            {isExp ? "-" : "+"}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                        <div className="tx-mobile-card__bottom">
                          <span className="tx-mobile-card__date">{formatDate(tx.date)}</span>
                          <span className="tx-mobile-card__note">{tx.note || "—"}{hasLoc && <MapPinIcon />}</span>
                        </div>
                        <div className="tx-mobile-card__actions" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/transactions/${tx.id}/edit`} className="category-card__btn category-card__btn--edit" title="Edit">
                            <EditIcon />
                          </Link>
                          <button className="category-card__btn category-card__btn--delete" onClick={() => { setDeletingTx(tx); setDeleteOpen(true); }} title="Hapus">
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
                    <button className="tx-pagination__btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹ Prev</button>
                    <div className="tx-pagination__pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button key={page} className={`tx-pagination__page ${currentPage === page ? "active" : ""}`} onClick={() => setCurrentPage(page)}>{page}</button>
                      ))}
                    </div>
                    <button className="tx-pagination__btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next ›</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Filter Modal ──────────────────────────────────── */}
      {filterModalOpen && (
        <div className="modal-overlay" onClick={() => setFilterModalOpen(false)} id="filter-modal-overlay">
          <div className="modal-content filter-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h3>🔍 Filter Transaksi</h3>
              <button className="modal-close" onClick={() => setFilterModalOpen(false)} id="close-filter-modal">
                <CloseIcon />
              </button>
            </div>

            {/* Accordion Body */}
            <div className="filter-modal__body">
              {/* ── Date Range Accordion ── */}
              <div className={`filter-accordion ${accordionDate ? "filter-accordion--open" : ""}`}>
                <button className="filter-accordion__header" onClick={() => setAccordionDate(!accordionDate)} id="accordion-date-toggle">
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">📅</span>
                    <span className="filter-accordion__title">Filter Tanggal</span>
                    {(tempDateFrom || tempDateTo) && <span className="filter-accordion__dot" />}
                  </div>
                  <span className={`filter-accordion__chevron ${accordionDate ? "filter-accordion__chevron--open" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <div className="filter-modal__date-group">
                      <label className="filter-modal__label">Dari</label>
                      <input
                        className="form-input"
                        type="date"
                        value={tempDateFrom}
                        onChange={(e) => setTempDateFrom(e.target.value)}
                        id="filter-date-from"
                      />
                    </div>
                    <div className="filter-modal__date-group">
                      <label className="filter-modal__label">Sampai</label>
                      <input
                        className="form-input"
                        type="date"
                        value={tempDateTo}
                        onChange={(e) => setTempDateTo(e.target.value)}
                        id="filter-date-to"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Type Accordion ── */}
              <div className={`filter-accordion ${accordionType ? "filter-accordion--open" : ""}`}>
                <button className="filter-accordion__header" onClick={() => setAccordionType(!accordionType)} id="accordion-type-toggle">
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">💱</span>
                    <span className="filter-accordion__title">Filter Tipe</span>
                    {tempType !== "all" && <span className="filter-accordion__dot" />}
                  </div>
                  <span className={`filter-accordion__chevron ${accordionType ? "filter-accordion__chevron--open" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <div className="filter-modal__chips">
                      {["all", "income", "expense"].map((t) => (
                        <button
                          key={t}
                          className={`filter-modal__chip ${tempType === t ? "filter-modal__chip--active" : ""}`}
                          onClick={() => setTempType(t)}
                          id={`filter-type-${t}`}
                        >
                          <span className="filter-modal__chip-icon">
                            {t === "all" ? "📊" : t === "income" ? "💰" : "💸"}
                          </span>
                          {t === "all" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Category Accordion ── */}
              <div className={`filter-accordion ${accordionCategory ? "filter-accordion--open" : ""}`}>
                <button className="filter-accordion__header" onClick={() => setAccordionCategory(!accordionCategory)} id="accordion-category-toggle">
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">🏷️</span>
                    <span className="filter-accordion__title">Filter Kategori</span>
                    {tempCategory !== "all" && <span className="filter-accordion__dot" />}
                  </div>
                  <span className={`filter-accordion__chevron ${accordionCategory ? "filter-accordion__chevron--open" : ""}`}>
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <select
                      className="form-input form-select"
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      id="filter-category"
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="filter-modal__footer">
              <button className="btn btn-ghost" onClick={resetFilters} id="reset-filter-btn">
                Reset Filter
              </button>
              <button className="btn btn-primary" onClick={applyFilters} id="apply-filter-btn">
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ───────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingTx(null); }}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message={<>Yakin ingin menghapus transaksi <strong>&quot;{deletingTx?.category_name} — {formatCurrency(deletingTx?.amount || 0)}&quot;</strong>?</>}
        warning="Transaksi yang dihapus tidak bisa dikembalikan."
        confirmText="Hapus"
        icon="🗑️"
        isSubmitting={submitting}
      />
    </div>
  );
}

export default TransactionList;
