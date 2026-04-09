import { useState, useEffect } from "react";
import { createTransaction, updateTransaction } from "../services/transactionService";
import { getCategories } from "../services/categoryService";
import { getBudgetPeriods } from "../services/budgetPeriodService";

/**
 * TransactionModal
 *
 * Props:
 *   isOpen        — boolean to show/hide modal
 *   onClose       — () => void
 *   onSuccess     — () => void  called after successful create/update
 *   transaction   — existing transaction object for edit mode (optional)
 */
function TransactionModal({ isOpen, onClose, onSuccess, transaction = null }) {
  const isEdit = Boolean(transaction);
  const today = new Date().toISOString().slice(0, 10);

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category_id: "",
    budget_period_id: "",
    note: "",
    date: today,
  });

  const [categories, setCategories] = useState([]);
  const [budgetPeriods, setBudgetPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Load options when modal opens ────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    async function fetchOptions() {
      setFetchLoading(true);
      try {
        const [catRes, bpRes] = await Promise.all([
          getCategories(),
          getBudgetPeriods(),
        ]);
        const cats = catRes.data || [];
        const bps = bpRes.data || [];
        setCategories(cats);
        setBudgetPeriods(bps);

        // Pre-select default budget period (is_default === true)
        const defaultBp = bps.find((bp) => bp.is_default);

        if (isEdit && transaction) {
          // Edit mode — populate form from existing transaction
          setForm({
            type: transaction.type || "expense",
            amount: transaction.amount ?? "",
            category_id: transaction.category_id ?? "",
            budget_period_id:
              transaction.budget_period_id ??
              (defaultBp ? defaultBp.id : ""),
            note: transaction.note ?? "",
            date: transaction.date ? transaction.date.slice(0, 10) : today,
          });
        } else {
          // Create mode — reset form, use default budget period
          setForm({
            type: "expense",
            amount: "",
            category_id: cats.length > 0 ? cats[0].id : "",
            budget_period_id: defaultBp ? defaultBp.id : "",
            note: "",
            date: today,
          });
        }
      } catch (err) {
        console.error("Failed to load form options", err);
      } finally {
        setFetchLoading(false);
      }
    }

    fetchOptions();
    setError("");
  }, [isOpen, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredCategories = categories.filter(
    (c) => c.type === form.type || c.type === "both"
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }
    if (!form.category_id) {
      setError("Pilih kategori terlebih dahulu.");
      return;
    }
    if (!form.date) {
      setError("Tanggal wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        budget_period_id: form.budget_period_id
          ? Number(form.budget_period_id)
          : null,
        note: form.note.trim() || null,
        date: form.date,
      };

      if (isEdit) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Gagal menyimpan transaksi. Coba lagi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content--transaction"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__title">
            <span className="modal-header__icon">
              {form.type === "expense" ? "💸" : "💰"}
            </span>
            <h3>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h3>
          </div>
          <button
            className="btn-close"
            onClick={onClose}
            id="modal-close-btn"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {fetchLoading ? (
          <div className="modal-loading">
            <div className="dashboard-loading__spinner" />
            <span>Memuat pilihan…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && (
                <div className="alert alert-error" role="alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Type toggle */}
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-toggle__btn ${
                      form.type === "expense" ? "active expense" : ""
                    }`}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        type: "expense",
                        category_id: "",
                      }))
                    }
                  >
                    📉 Pengeluaran
                  </button>
                  <button
                    type="button"
                    className={`type-toggle__btn ${
                      form.type === "income" ? "active income" : ""
                    }`}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        type: "income",
                        category_id: "",
                      }))
                    }
                  >
                    📈 Pemasukan
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label htmlFor="tx-amount" className="form-label">
                  Nominal
                </label>
                <div className="amount-input-wrapper">
                  <span className="amount-input-prefix">Rp</span>
                  <input
                    id="tx-amount"
                    type="number"
                    name="amount"
                    className="form-input amount-input"
                    placeholder="0"
                    min="1"
                    step="any"
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                {form.amount > 0 && (
                  <span className="form-hint">
                    {formatCurrency(form.amount)}
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="tx-category" className="form-label">
                  Kategori
                </label>
                <select
                  id="tx-category"
                  name="category_id"
                  className="form-input"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih kategori --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Period */}
              <div className="form-group">
                <label htmlFor="tx-budget-period" className="form-label">
                  Budget Period
                  <span className="form-label-hint">(opsional)</span>
                </label>
                <select
                  id="tx-budget-period"
                  name="budget_period_id"
                  className="form-input"
                  value={form.budget_period_id}
                  onChange={handleChange}
                >
                  <option value="">-- Gunakan default / tanpa period --</option>
                  {budgetPeriods.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name}
                      {bp.is_default ? " ⭐ Default" : ""}
                      {" "}
                      ({bp.start_date?.slice(0, 10)} s/d{" "}
                      {bp.end_date?.slice(0, 10)})
                    </option>
                  ))}
                </select>
                {budgetPeriods.length === 0 && (
                  <span className="form-hint form-hint--warn">
                    Belum ada budget period. Backend akan menggunakan default jika ada.
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="form-group">
                <label htmlFor="tx-date" className="form-label">
                  Tanggal
                </label>
                <input
                  id="tx-date"
                  type="date"
                  name="date"
                  className="form-input"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Note */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="tx-note" className="form-label">
                  Keterangan
                  <span className="form-label-hint">(opsional)</span>
                </label>
                <input
                  id="tx-note"
                  type="text"
                  name="note"
                  className="form-input"
                  placeholder="Makan siang, belanja, dll..."
                  value={form.note}
                  onChange={handleChange}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${
                  form.type === "income" ? "btn-income" : ""
                }`}
                disabled={loading}
                id="modal-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Menyimpan…
                  </>
                ) : isEdit ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Transaksi"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TransactionModal;
