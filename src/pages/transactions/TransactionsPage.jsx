import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getTransactions, deleteTransaction } from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CategoryBadge from "../../components/CategoryBadge";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 10;

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TransactionsPage() {
  const navigate = useNavigate();

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "",
    category: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories once
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Load transactions when filters change
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;

      const res = await getTransactions(params);
      setTransactions(res.data || []);
      setCurrentPage(1);
    } catch (e) {
      setError("Gagal memuat transaksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Pagination slice
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginated = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearFilters() {
    setFilters({ dateFrom: "", dateTo: "", type: "", category: "" });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep modal open, show error elsewhere
    } finally {
      setIsDeleting(false);
    }
  }

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.type || filters.category;

  return (
    <div className="page-layout">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__left">
          <Link to="/" className="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="page-header__title">Transaksi</h1>
            <p className="page-header__subtitle">
              {loading ? "Loading..." : `${transactions.length} transaksi ditemukan`}
            </p>
          </div>
        </div>
        <button
          id="btn-add-transaction"
          className="btn-add"
          onClick={() => navigate("/transactions/new")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Tambah</span>
        </button>
      </header>

      <main className="page-main">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-bar__fields">
            <div className="filter-group">
              <label className="filter-label">Dari Tanggal</label>
              <input
                type="date"
                className="form-input filter-input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                id="filter-date-from"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Sampai Tanggal</label>
              <input
                type="date"
                className="form-input filter-input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                id="filter-date-to"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Tipe</label>
              <select
                className="form-input filter-input"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                id="filter-type"
              >
                <option value="">Semua</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Kategori</label>
              <select
                className="form-input filter-input"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                id="filter-category"
              >
                <option value="">Semua</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button className="btn-clear-filter" onClick={handleClearFilters}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reset Filter
            </button>
          )}
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
            <button className="btn btn-primary" style={{ marginTop: 16, width: "auto", padding: "10px 24px" }} onClick={loadTransactions}>
              Coba Lagi
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="dashboard-empty">
            <span className="dashboard-empty__icon">💳</span>
            <p>Belum ada transaksi</p>
            <p className="dashboard-empty__sub">
              {hasActiveFilters ? "Coba ubah filter pencarian." : "Mulai tambah transaksi pertamamu!"}
            </p>
          </div>
        ) : (
          <>
            {/* Transaction Table */}
            <div className="transaction-table">
              <div className="transaction-table__header">
                <span>Tanggal</span>
                <span>Kategori</span>
                <span>Catatan</span>
                <span>Tipe</span>
                <span>Jumlah</span>
                <span>Aksi</span>
              </div>
              <div className="transaction-table__body">
                {paginated.map((tx, idx) => {
                  const isExpense = tx.type === "expense";
                  return (
                    <div
                      key={tx.id}
                      className="transaction-row"
                      style={{ animationDelay: `${idx * 40}ms` }}
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                    >
                      <span className="transaction-row__date">{formatDate(tx.date)}</span>
                      <span className="transaction-row__category">
                        <CategoryBadge name={tx.category_name} size="sm" />
                      </span>
                      <span className="transaction-row__note">{tx.note || "—"}</span>
                      <span className={`transaction-row__type type--${tx.type}`}>
                        {isExpense ? "Pengeluaran" : "Pemasukan"}
                      </span>
                      <span className={`transaction-row__amount ${isExpense ? "expense" : "income"}`}>
                        {isExpense ? "-" : "+"}{formatRupiah(tx.amount)}
                      </span>
                      <span
                        className="transaction-row__actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-icon btn-icon--edit"
                          onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                          title="Edit"
                          aria-label="Edit transaksi"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-icon--delete"
                          onClick={() => setDeleteTarget(tx)}
                          title="Hapus"
                          aria-label="Hapus transaksi"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Transaksi"
        message={
          deleteTarget
            ? `Apakah kamu yakin ingin menghapus transaksi "${deleteTarget.category_name}" sebesar ${formatRupiah(deleteTarget.amount)}? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
