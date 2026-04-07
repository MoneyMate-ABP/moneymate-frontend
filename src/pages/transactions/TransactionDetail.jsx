import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import { getTransaction, deleteTransaction } from "../../services/transactionService";
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
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const NoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
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

const formatDateFull = (dateStr) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ══════════════════════════════════════════════════════════
   TRANSACTION DETAIL PAGE
   ══════════════════════════════════════════════════════════ */
function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTx() {
      setLoading(true);
      setError("");
      try {
        const res = await getTransaction(id);
        setTransaction(res.data);
      } catch {
        setError("Gagal memuat data transaksi.");
      } finally {
        setLoading(false);
      }
    }
    fetchTx();
  }, [id]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* noop */ }
    logout();
    navigate("/login", { replace: true });
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteTransaction(id);
      setDeleteOpen(false);
      navigate("/transactions", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus transaksi.";
      setToast({ message: msg, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const isExpense = transaction?.type === "expense";
  const hasLocation = transaction?.latitude && transaction?.longitude;
  const mapsUrl = hasLocation ? `https://www.google.com/maps?q=${transaction.latitude},${transaction.longitude}` : null;

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
        <div className="category-page__header">
          <button className="category-page__back" onClick={() => navigate("/transactions")} id="back-to-tx-list">
            <BackIcon />
          </button>
          <div>
            <h1>Detail Transaksi</h1>
            <p>Informasi lengkap transaksi</p>
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
            <button className="btn btn-primary" style={{ width: "auto", marginTop: "12px" }} onClick={() => window.location.reload()}>
              Coba lagi
            </button>
          </div>
        ) : transaction && (
          <div className="tx-detail-card" id="tx-detail-card">
            {/* ── Amount Hero ──────────────────────────── */}
            <div className={`tx-detail__amount-hero ${isExpense ? "expense" : "income"}`}>
              <span className="tx-detail__type-label">
                {isExpense ? "Pengeluaran" : "Pemasukan"}
              </span>
              <span className="tx-detail__amount-value">
                {isExpense ? "-" : "+"}{formatCurrency(transaction.amount)}
              </span>
            </div>

            {/* ── Info Rows ────────────────────────────── */}
            <div className="tx-detail__rows">
              <div className="tx-detail__row">
                <div className="tx-detail__row-left">
                  <span className="tx-detail__row-icon">🏷️</span>
                  <span className="tx-detail__label">Kategori</span>
                </div>
                <CategoryBadge name={transaction.category_name} type={transaction.type} />
              </div>

              <div className="tx-detail__row">
                <div className="tx-detail__row-left">
                  <span className="tx-detail__row-icon"><CalendarIcon /></span>
                  <span className="tx-detail__label">Tanggal</span>
                </div>
                <span className="tx-detail__value">{formatDateFull(transaction.date)}</span>
              </div>

              {transaction.note && (
                <div className="tx-detail__row">
                  <div className="tx-detail__row-left">
                    <span className="tx-detail__row-icon"><NoteIcon /></span>
                    <span className="tx-detail__label">Catatan</span>
                  </div>
                  <span className="tx-detail__value">{transaction.note}</span>
                </div>
              )}

              {transaction.budget_period_name && (
                <div className="tx-detail__row">
                  <div className="tx-detail__row-left">
                    <span className="tx-detail__row-icon">💼</span>
                    <span className="tx-detail__label">Budget Period</span>
                  </div>
                  <span className="tx-detail__value">{transaction.budget_period_name}</span>
                </div>
              )}

              {hasLocation && (
                <div className="tx-detail__row">
                  <div className="tx-detail__row-left">
                    <span className="tx-detail__row-icon"><MapPinIcon /></span>
                    <span className="tx-detail__label">Lokasi</span>
                  </div>
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

            {/* ── Action Buttons ───────────────────────── */}
            <div className="tx-detail__actions">
              <Link to={`/transactions/${id}/edit`} className="btn btn-primary" id="edit-this-tx">
                <EditIcon />
                Edit Transaksi
              </Link>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setDeleteOpen(true)}
                id="delete-this-tx"
              >
                <TrashIcon />
                Hapus
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Delete Modal ───────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message={
          <>
            Yakin ingin menghapus transaksi{" "}
            <strong>
              &quot;{transaction?.category_name} — {formatCurrency(transaction?.amount || 0)}&quot;
            </strong>
            ?
          </>
        }
        warning="Transaksi yang dihapus tidak bisa dikembalikan."
        confirmText="Hapus"
        icon="🗑️"
        isSubmitting={submitting}
      />
    </div>
  );
}

export default TransactionDetail;
