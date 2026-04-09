import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import { parseApiError } from "../../utils/validation";
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

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ── Type badge config ─────────────────────────────────── */
const typeConfig = {
  expense: { label: "Pengeluaran", color: "#ff4757", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.25)" },
  income:  { label: "Pemasukan",   color: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.25)" },
  both:    { label: "Keduanya",    color: "#6c63ff", bg: "rgba(108,99,255,0.1)", border: "rgba(108,99,255,0.25)" },
};

const typeEmoji = { expense: "💸", income: "💰", both: "🔄" };

/* ── Category Modal Component ──────────────────────────── */
function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  submitError,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  const isEdit = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "expense");
    } else {
      setName("");
      setType("expense");
    }
    setError("");
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama kategori harus diisi.");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), type });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Kategori" : "Tambah Kategori"}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            id="modal-close-btn"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {(error || submitError) && (
            <div className="alert alert-error">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error || submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="category-name">
              Nama Kategori
            </label>
            <input
              id="category-name"
              className="form-input"
              type="text"
              placeholder="Contoh: Makanan, Transportasi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipe</label>
            <div className="type-selector">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  className={`type-selector__option ${type === key ? "active" : ""}`}
                  onClick={() => setType(key)}
                  style={{
                    "--type-color": cfg.color,
                    "--type-bg": cfg.bg,
                    "--type-border": cfg.border,
                  }}
                >
                  <span className="type-selector__emoji">{typeEmoji[key]}</span>
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            id={isEdit ? "update-category-btn" : "create-category-btn"}
          >
            {isSubmitting && <span className="spinner" />}
            {isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirmation Modal ─────────────────────────── */
function DeleteModal({ isOpen, onClose, onConfirm, categoryName, isSubmitting }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Hapus Kategori</h3>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="delete-modal__body">
          <div className="delete-modal__icon">🗑️</div>
          <p>
            Yakin ingin menghapus kategori <strong>&quot;{categoryName}&quot;</strong>?
          </p>
          <span className="delete-modal__warning">
            Kategori yang sudah digunakan di transaksi tidak bisa dihapus.
          </span>
        </div>

        <div className="delete-modal__actions">
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Batal
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
            id="confirm-delete-btn"
            type="button"
          >
            {isSubmitting && <span className="spinner" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CATEGORIES PAGE
   ══════════════════════════════════════════════════════════ */
function CategoriesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalSubmitError, setModalSubmitError] = useState("");

  // Filter
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCategories(user?.id);
      setCategories(res.data || []);
    } catch (err) {
      setError("Gagal memuat data kategori.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);


  // Create / Update
  const handleSubmit = async ({ name, type }) => {
    setModalSubmitError("");
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, type });
        showToast("Kategori berhasil diperbarui! ✨");
      } else {
        await createCategory({ name, type });
        showToast("Kategori baru berhasil ditambahkan! 🎉");
      }
      setModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      const msg = parseApiError(err, "Terjadi kesalahan.");
      setModalSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingCategory) return;
    setSubmitting(true);
    try {
      await deleteCategory(deletingCategory.id);
      showToast("Kategori berhasil dihapus! 🗑️");
      setDeleteModalOpen(false);
      setDeletingCategory(null);
      await fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus kategori.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEdit = (cat) => {
    setModalSubmitError("");
    setEditingCategory(cat);
    setModalOpen(true);
  };

  // Open create modal
  const openCreate = () => {
    setModalSubmitError("");
    setEditingCategory(null);
    setModalOpen(true);
  };

  // Open delete modal
  const openDelete = (cat) => {
    setDeletingCategory(cat);
    setDeleteModalOpen(true);
  };

  // Filtered categories
  const filtered = categories.filter((c) => {
    const matchesType = filterType === "all" || c.type === filterType;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* ── Toast Notification ──────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`} id="toast-notification">
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────── */}
      <main className="dashboard-main">
        {/* Back + Title */}
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/")}
            id="back-to-dashboard-btn"
          >
            <BackIcon />
          </button>
          <div>
            <h1>Kategori</h1>
            <p>Kelola kategori pemasukan dan pengeluaranmu</p>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat kategori...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <span className="dashboard-error__icon">⚠️</span>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "12px" }}
              onClick={fetchCategories}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* ── Toolbar: Search + Filter + Add ────────── */}
            <div className="category-toolbar" id="category-toolbar">
              <div className="category-toolbar__search">
                <svg
                  className="category-toolbar__search-icon"
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
                <input
                  className="form-input category-toolbar__input"
                  type="text"
                  placeholder="Cari kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search-category-input"
                />
              </div>

              <div className="category-toolbar__filters">
                {["all", "expense", "income", "both"].map((t) => (
                  <button
                    key={t}
                    className={`category-filter-chip ${filterType === t ? "active" : ""}`}
                    onClick={() => setFilterType(t)}
                    id={`filter-${t}`}
                  >
                    {t === "all" ? "Semua" : typeConfig[t]?.label}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary category-toolbar__add"
                onClick={openCreate}
                id="add-category-btn"
              >
                <PlusIcon />
                <span>Tambah</span>
              </button>
            </div>

            {/* ── Category Count ────────────────────────── */}
            <div className="category-count">
              <span>{filtered.length} kategori ditemukan</span>
            </div>

            {/* ── Category Grid ─────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="dashboard-empty">
                <span className="dashboard-empty__icon">📂</span>
                <p>
                  {searchQuery || filterType !== "all"
                    ? "Tidak ada kategori yang cocok."
                    : "Belum ada kategori."}
                </p>
                <span className="dashboard-empty__sub">
                  {searchQuery || filterType !== "all"
                    ? "Coba ubah filter atau kata kunci pencarian."
                    : "Buat kategori pertamamu sekarang!"}
                </span>
              </div>
            ) : (
              <div className="category-grid" id="category-list">
                {filtered.map((cat, index) => {
                  const cfg = typeConfig[cat.type] || typeConfig.expense;
                  return (
                    <div
                      key={cat.id}
                      className="category-card"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="category-card__left">
                        <div
                          className="category-card__emoji"
                          style={{
                            background: cfg.bg,
                            borderColor: cfg.border,
                          }}
                        >
                          {typeEmoji[cat.type] || "📁"}
                        </div>
                        <div className="category-card__info">
                          <span className="category-card__name">
                            {cat.name}
                          </span>
                          <span
                            className="category-card__type"
                            style={{
                              color: cfg.color,
                              background: cfg.bg,
                              borderColor: cfg.border,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="category-card__actions">
                        <button
                          className="category-card__btn category-card__btn--edit"
                          onClick={() => openEdit(cat)}
                          title="Edit"
                          id={`edit-category-${cat.id}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="category-card__btn category-card__btn--delete"
                          onClick={() => openDelete(cat)}
                          title="Hapus"
                          id={`delete-category-${cat.id}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────── */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
          setModalSubmitError("");
        }}
        onSubmit={handleSubmit}
        initialData={editingCategory}
        isSubmitting={submitting}
        submitError={modalSubmitError}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        categoryName={deletingCategory?.name}
        isSubmitting={submitting}
      />
    </div>
  );
}

export default CategoriesPage;
