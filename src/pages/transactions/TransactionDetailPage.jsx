import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getTransaction, deleteTransaction } from "../../services/transactionService";
import CategoryBadge from "../../components/CategoryBadge";
import ConfirmModal from "../../components/ConfirmModal";

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value, children }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <div className="detail-row__value">{children ?? value}</div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTransaction(id)
      .then((res) => setTransaction(res.data))
      .catch(() => setError("Transaksi tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
      navigate("/transactions", { replace: true });
    } catch {
      setIsDeleting(false);
      setShowDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="page-layout">
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Memuat transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="page-layout">
        <div className="dashboard-error">
          <span className="dashboard-error__icon">😕</span>
          <p>{error || "Transaksi tidak ditemukan."}</p>
          <Link to="/transactions" className="btn btn-primary" style={{ marginTop: 16, width: "auto", padding: "10px 24px" }}>
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  const isExpense = transaction.type === "expense";
  const hasLocation = transaction.latitude && transaction.longitude;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${transaction.latitude},${transaction.longitude}`
    : null;

  return (
    <div className="page-layout">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__left">
          <Link to="/transactions" className="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="page-header__title">Detail Transaksi</h1>
            <p className="page-header__subtitle">#{transaction.id}</p>
          </div>
        </div>
        <div className="page-header__actions">
          <button
            id="btn-edit-transaction"
            className="btn-header-edit"
            onClick={() => navigate(`/transactions/${id}/edit`)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button
            id="btn-delete-transaction"
            className="btn-header-delete"
            onClick={() => setShowDelete(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            Hapus
          </button>
        </div>
      </header>

      <main className="page-main">
        {/* Amount Hero */}
        <div className={`detail-hero detail-hero--${isExpense ? "expense" : "income"}`}>
          <div className="detail-hero__icon">{isExpense ? "💸" : "💵"}</div>
          <div className={`detail-hero__amount ${isExpense ? "expense" : "income"}`}>
            {isExpense ? "-" : "+"}{formatRupiah(transaction.amount)}
          </div>
          <div className="detail-hero__type">
            {isExpense ? "Pengeluaran" : "Pemasukan"}
          </div>
        </div>

        {/* Detail Card */}
        <div className="detail-card">
          <DetailRow label="Kategori">
            <CategoryBadge name={transaction.category_name} size="md" />
          </DetailRow>

          <DetailRow label="Tanggal">
            {formatDate(transaction.date)}
          </DetailRow>

          <DetailRow label="Tipe">
            <span className={`type-chip type-chip--${isExpense ? "expense" : "income"}`}>
              {isExpense ? "Pengeluaran" : "Pemasukan"}
            </span>
          </DetailRow>

          {transaction.budget_period_name && (
            <DetailRow label="Periode Anggaran">
              {transaction.budget_period_name}
            </DetailRow>
          )}

          <DetailRow label="Catatan">
            {transaction.note ? (
              <span className="detail-note">{transaction.note}</span>
            ) : (
              <span className="detail-empty">Tidak ada catatan</span>
            )}
          </DetailRow>

          {/* Location */}
          <DetailRow label="Lokasi">
            {hasLocation ? (
              <div className="detail-location">
                <div className="detail-location__coords">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {parseFloat(transaction.latitude).toFixed(5)}, {parseFloat(transaction.longitude).toFixed(5)}
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-maps-link"
                  id="btn-view-maps"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Buka di Google Maps
                </a>
              </div>
            ) : (
              <span className="detail-empty">Tidak ada data lokasi</span>
            )}
          </DetailRow>
        </div>
      </main>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDelete}
        title="Hapus Transaksi"
        message={`Apakah kamu yakin ingin menghapus transaksi sebesar ${formatRupiah(transaction.amount)}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
