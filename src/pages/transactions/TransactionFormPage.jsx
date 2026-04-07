import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import useAuthStore from "../../store/authStore";
import {
  getTransaction,
  createTransaction,
  updateTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CurrencyInput from "../../components/CurrencyInput";
import LocationPicker from "../../components/LocationPicker";

/**
 * TransactionFormPage — Add & Edit in one component
 * - /transactions/new → create mode
 * - /transactions/:id/edit → edit mode
 */
export default function TransactionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // undefined in create mode
  const isEdit = !!id;
  const userId = useAuthStore((s) => s.user?.id);

  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      amount: "",
      type: "expense",
      category_id: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      location: null,
    },
  });

  // Load categories
  useEffect(() => {
    getCategories(userId)
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, [userId]);

  // Load existing transaction if editing
  useEffect(() => {
    if (!isEdit) return;
    setPageLoading(true);
    getTransaction(id)
      .then((res) => {
        const tx = res.data;
        reset({
          amount: tx.amount,
          type: tx.type,
          category_id: tx.category_id,
          date: tx.date ? tx.date.slice(0, 10) : "",
          note: tx.note || "",
          location:
            tx.latitude && tx.longitude
              ? { lat: parseFloat(tx.latitude), lng: parseFloat(tx.longitude) }
              : null,
        });
      })
      .catch(() => setSubmitError("Gagal memuat transaksi."))
      .finally(() => setPageLoading(false));
  }, [id, isEdit, reset]);

  async function onSubmit(data) {
    setSubmitError(null);
    try {
      const payload = {
        amount: Number(data.amount),
        type: data.type,
        category_id: data.category_id ? Number(data.category_id) : undefined,
        date: data.date,
        note: data.note || undefined,
        latitude: data.location?.lat ?? undefined,
        longitude: data.location?.lng ?? undefined,
      };

      if (isEdit) {
        await updateTransaction(id, payload);
        navigate(`/transactions/${id}`);
      } else {
        const res = await createTransaction(payload);
        const newId = res.data?.id;
        navigate(newId ? `/transactions/${newId}` : "/transactions");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || "Gagal menyimpan transaksi. Silakan coba lagi.";
      setSubmitError(msg);
    }
  }

  if (pageLoading) {
    return (
      <div className="page-layout">
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__left">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate(isEdit ? `/transactions/${id}` : "/transactions")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="page-header__title">
              {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
            </h1>
            <p className="page-header__subtitle">
              {isEdit ? "Perbarui detail transaksi" : "Catat transaksi baru"}
            </p>
          </div>
        </div>
      </header>

      <main className="page-main">
        <div className="form-page-card">
          {submitError && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Type Toggle */}
            <div className="form-group">
              <label className="form-label">Tipe Transaksi</label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <div className="type-toggle">
                    <button
                      type="button"
                      id="type-expense"
                      className={`type-toggle__btn type-toggle__btn--expense${field.value === "expense" ? " active" : ""}`}
                      onClick={() => field.onChange("expense")}
                    >
                      💸 Pengeluaran
                    </button>
                    <button
                      type="button"
                      id="type-income"
                      className={`type-toggle__btn type-toggle__btn--income${field.value === "income" ? " active" : ""}`}
                      onClick={() => field.onChange("income")}
                    >
                      💵 Pemasukan
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="amount-input">
                Jumlah <span className="form-required">*</span>
              </label>
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: "Jumlah wajib diisi",
                  validate: (v) => (Number(v) > 0 ? true : "Jumlah harus lebih dari 0"),
                }}
                render={({ field }) => (
                  <CurrencyInput
                    id="amount-input"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.amount?.message}
                  />
                )}
              />
              {errors.amount && (
                <span className="form-error">{errors.amount.message}</span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category-select">Kategori</label>
              <select
                id="category-select"
                className={`form-input${errors.category_id ? " input-error" : ""}`}
                {...register("category_id")}
              >
                <option value="">— Pilih Kategori —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="date-input">
                Tanggal <span className="form-required">*</span>
              </label>
              <input
                id="date-input"
                type="date"
                className={`form-input${errors.date ? " input-error" : ""}`}
                {...register("date", { required: "Tanggal wajib diisi" })}
              />
              {errors.date && (
                <span className="form-error">{errors.date.message}</span>
              )}
            </div>

            {/* Note */}
            <div className="form-group">
              <label className="form-label" htmlFor="note-input">Catatan</label>
              <textarea
                id="note-input"
                className="form-input form-textarea"
                placeholder="Catatan tambahan (opsional)"
                rows={3}
                {...register("note")}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Lokasi (Opsional)</label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <LocationPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-form-cancel"
                onClick={() => navigate(isEdit ? `/transactions/${id}` : "/transactions")}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-submit-transaction"
                className="btn btn-primary form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="spinner" /> Menyimpan...</>
                ) : isEdit ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Transaksi"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
