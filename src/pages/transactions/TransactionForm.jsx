import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getTransaction,
  createTransaction,
  updateTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CurrencyInput from "../../components/CurrencyInput";
import LocationPicker from "../../components/LocationPicker";

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

/* ── Type config ────────────────────────────────────────── */
const typeOptions = [
  { value: "expense", label: "Pengeluaran", emoji: "💸", color: "#ff4757", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.25)" },
  { value: "income", label: "Pemasukan", emoji: "💰", color: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.25)" },
];

/* ══════════════════════════════════════════════════════════
   TRANSACTION FORM PAGE — Add & Edit
   ══════════════════════════════════════════════════════════ */
function TransactionForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // if present → edit mode
  const isEdit = !!id;

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fetchError, setFetchError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: 0,
      type: "expense",
      category_id: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
      latitude: "",
      longitude: "",
    },
  });

  const watchType = watch("type");
  const watchLat = watch("latitude");
  const watchLng = watch("longitude");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load categories + existing transaction (edit)
  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      setFetchError("");
      try {
        const catRes = await getCategories(user?.id);
        setCategories(catRes.data || []);

        if (isEdit) {
          const tx = await getTransaction(id);

          reset({
            amount: tx.amount || 0,
            type: tx.type || "expense",
            category_id: tx.category_id ? String(tx.category_id) : "",
            date: tx.date
              ? new Date(tx.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            note: tx.note || "",
            latitude: tx.latitude ? String(tx.latitude) : "",
            longitude: tx.longitude ? String(tx.longitude) : "",
          });
        }
      } catch {
        setFetchError(
          isEdit
            ? "Gagal memuat data transaksi."
            : "Gagal memuat daftar kategori.",
        );
      } finally {
        setPageLoading(false);
      }
    }
    loadData();
  }, [id, isEdit, reset, user?.id]);

  // Filter categories by type
  const filteredCategories = categories.filter(
    (c) => c.type === watchType || c.type === "both"
  );

  // Submit
  const processSubmit = async (data) => {
    const payload = {
      amount: Number(data.amount),
      type: data.type,
      category_id: Number(data.category_id),
      date: data.date,
      note: data.note || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateTransaction(id, payload);
        showToast("Transaksi berhasil diperbarui! ✨");
      } else {
        await createTransaction(payload);
        showToast("Transaksi berhasil ditambahkan! 🎉");
      }
      setTimeout(() => navigate("/transactions"), 800);
    } catch (err) {
      const msg = err.response?.data?.message || "Terjadi kesalahan.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* noop */ }
    logout();
    navigate("/login", { replace: true });
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
            <h1>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h1>
            <p>{isEdit ? "Ubah data transaksi yang sudah ada" : "Catat transaksi baru"}</p>
          </div>
        </div>

        {pageLoading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat data...</p>
          </div>
        ) : fetchError ? (
          <div className="dashboard-error">
            <span className="dashboard-error__icon">⚠️</span>
            <p>{fetchError}</p>
            <button className="btn btn-primary" style={{ width: "auto", marginTop: "12px" }} onClick={() => window.location.reload()}>
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="tx-form-card" id="transaction-form-card">
            <form onSubmit={handleSubmit(processSubmit)} id="transaction-form">
              {/* Type Selector */}
              <div className="form-group">
                <label className="form-label">Tipe Transaksi</label>
                <div className="type-selector type-selector--2col">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`type-selector__option ${watchType === opt.value ? "active" : ""}`}
                      onClick={() => setValue("type", opt.value)}
                      style={{ "--type-color": opt.color, "--type-bg": opt.bg, "--type-border": opt.border }}
                    >
                      <span className="type-selector__emoji">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-amount">
                  Jumlah <span className="form-required">*</span>
                </label>
                <Controller
                  name="amount"
                  control={control}
                  rules={{ validate: (v) => (v && v > 0) || "Jumlah harus lebih dari 0" }}
                  render={({ field }) => (
                    <CurrencyInput
                      id="tx-amount"
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.amount}
                      placeholder="0"
                    />
                  )}
                />
                {errors.amount && <span className="form-error">{errors.amount.message}</span>}
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-category">
                  Kategori <span className="form-required">*</span>
                </label>
                <select
                  id="tx-category"
                  className="form-input form-select"
                  {...register("category_id", { required: "Pilih kategori" })}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <span className="form-error">{errors.category_id.message}</span>}
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-date">
                  Tanggal <span className="form-required">*</span>
                </label>
                <input id="tx-date" className="form-input" type="date" {...register("date", { required: "Tanggal wajib diisi" })} />
                {errors.date && <span className="form-error">{errors.date.message}</span>}
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-note">Catatan</label>
                <textarea id="tx-note" className="form-input form-textarea" placeholder="Opsional: catatan transaksi..." rows={3} {...register("note")} />
              </div>

              {/* Location — using LocationPicker component */}
              <div className="form-group">
                <label className="form-label">
                  Lokasi <span className="form-optional">(opsional)</span>
                </label>
                <LocationPicker
                  latitude={watchLat}
                  longitude={watchLng}
                  onLatChange={(val) => setValue("latitude", val)}
                  onLngChange={(val) => setValue("longitude", val)}
                  disabled={submitting}
                />
              </div>

              {/* Actions */}
              <div className="tx-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigate("/transactions")}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id={isEdit ? "update-tx-btn" : "create-tx-btn"}>
                  {submitting && <span className="spinner" />}
                  {isEdit ? "Simpan Perubahan" : "Tambah Transaksi"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default TransactionForm;
