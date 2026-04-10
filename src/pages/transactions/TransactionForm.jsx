import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import useAuthStore from "../../store/authStore";
import {
  getTransaction,
  createTransaction,
  updateTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import { getBudgetPeriods } from "../../services/budgetService";
import CurrencyInput from "../../components/CurrencyInput";
import LocationPicker from "../../components/LocationPicker";
import { parseApiError } from "../../utils/validation";

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

  const [categories, setCategories] = useState([]);
  const [budgetPeriods, setBudgetPeriods] = useState([]);
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
      budget_period_id: "",
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

  // Load categories + budget periods + existing transaction (edit)
  useEffect(() => {
    async function loadData() {
      setPageLoading(true);
      setFetchError("");
      try {
        const [catRes, bpRes] = await Promise.all([
          getCategories(user?.id),
          getBudgetPeriods(),
        ]);
        const cats = catRes.data || [];
        const bps = bpRes.data || [];
        setCategories(cats);
        setBudgetPeriods(bps);

        if (isEdit) {
          const tx = await getTransaction(id);

          reset({
            amount: tx.amount || 0,
            type: tx.type || "expense",
            category_id: tx.category_id ? String(tx.category_id) : "",
            budget_period_id: tx.budget_period_id
              ? String(tx.budget_period_id)
              : "",
            date: tx.date
              ? new Date(tx.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            note: tx.note || "",
            latitude: tx.latitude ? String(tx.latitude) : "",
            longitude: tx.longitude ? String(tx.longitude) : "",
          });
        } else {
          // Auto-select default budget period on create
          const defaultBp = bps.find((bp) => bp.is_default);
          if (defaultBp) {
            setValue("budget_period_id", String(defaultBp.id));
          }
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
  }, [id, isEdit, reset, setValue, user?.id]);

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

    // Include budget_period_id only if explicitly selected
    if (data.budget_period_id) {
      payload.budget_period_id = Number(data.budget_period_id);
    }

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
      const msg = parseApiError(err, "Terjadi kesalahan.");
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`} id="toast-notification">
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────── */}
      <main className="dashboard-main">
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/transactions")}
            id="back-to-tx-list"
          >
            <BackIcon />
          </button>
          <div>
            <h1>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h1>
            <p>
              {isEdit
                ? "Ubah data transaksi yang sudah ada"
                : "Catat transaksi baru"}
            </p>
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
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "12px" }}
              onClick={() => window.location.reload()}
            >
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
                      style={{
                        "--type-color": opt.color,
                        "--type-bg": opt.bg,
                        "--type-border": opt.border,
                      }}
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
                  rules={{
                    validate: (v) =>
                      (v && v > 0) || "Jumlah harus lebih dari 0",
                  }}
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
                {errors.amount && (
                  <span className="form-error">{errors.amount.message}</span>
                )}
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
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <span className="form-error">
                    {errors.category_id.message}
                  </span>
                )}
              </div>

              {/* Budget Period */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-budget-period">
                  Periode Anggaran
                  <span className="form-optional"> (opsional)</span>
                </label>
                <select
                  id="tx-budget-period"
                  className="form-input form-select"
                  {...register("budget_period_id")}
                >
                  <option value="">-- Tanpa Periode Anggaran --</option>
                  {budgetPeriods.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name}
                      {bp.is_default ? " ⭐ (Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="form-hint">
                  Periode default dipilih otomatis, kosongkan jika tidak perlu.
                </p>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-date">
                  Tanggal <span className="form-required">*</span>
                </label>
                <input
                  id="tx-date"
                  className="form-input"
                  type="date"
                  {...register("date", { required: "Tanggal wajib diisi" })}
                />
                {errors.date && (
                  <span className="form-error">{errors.date.message}</span>
                )}
              </div>

              {/* Note */}
              <div className="form-group">
                <label className="form-label" htmlFor="tx-note">
                  Catatan
                </label>
                <textarea
                  id="tx-note"
                  className="form-input form-textarea"
                  placeholder="Opsional: catatan transaksi..."
                  rows={3}
                  {...register("note")}
                />
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
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate("/transactions")}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  id={isEdit ? "update-tx-btn" : "create-tx-btn"}
                >
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
