import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import CurrencyInput from "./CurrencyInput";
import { getCategories } from "../services/categoryService";

/* ── Icons ──────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── Type config ────────────────────────────────────────── */
const typeOptions = [
  { value: "expense", label: "Pengeluaran", emoji: "💸", color: "#ff4757", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.25)" },
  { value: "income",  label: "Pemasukan",   emoji: "💰", color: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.25)" },
];

/**
 * TransactionFormModal — Add & Edit transaction in one component
 *
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   onSubmit     — (data) => Promise<void>
 *   initialData  — transaction object for edit, null for add
 *   isSubmitting — boolean
 */
function TransactionFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const isEdit = !!initialData;
  const [categories, setCategories] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);

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

  // Load categories on open
  useEffect(() => {
    if (isOpen) {
      getCategories()
        .then((res) => setCategories(res.data || []))
        .catch(() => setCategories([]));
    }
  }, [isOpen]);

  // Reset form when modal opens / data changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          amount: initialData.amount || 0,
          type: initialData.type || "expense",
          category_id: initialData.category_id || "",
          date: initialData.date
            ? new Date(initialData.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          note: initialData.note || "",
          latitude: initialData.latitude || "",
          longitude: initialData.longitude || "",
        });
      } else {
        reset({
          amount: 0,
          type: "expense",
          category_id: "",
          date: new Date().toISOString().split("T")[0],
          note: "",
          latitude: "",
          longitude: "",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  // Filter categories by type
  const filteredCategories = categories.filter(
    (c) => c.type === watchType || c.type === "both"
  );

  // Geolocation handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude.toString());
        setValue("longitude", pos.coords.longitude.toString());
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const processSubmit = (data) => {
    const payload = {
      amount: Number(data.amount),
      type: data.type,
      category_id: Number(data.category_id),
      date: data.date,
      note: data.note || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h3>
          <button className="modal-close" onClick={onClose} id="tx-modal-close">
            <CloseIcon />
          </button>
        </div>

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
                validate: (v) => (v && v > 0) || "Jumlah harus lebih dari 0",
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
              <span className="form-error">{errors.category_id.message}</span>
            )}
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
            <label className="form-label" htmlFor="tx-note">Catatan</label>
            <textarea
              id="tx-note"
              className="form-input form-textarea"
              placeholder="Opsional: catatan transaksi..."
              rows={3}
              {...register("note")}
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">
              Lokasi <span className="form-optional">(opsional)</span>
            </label>
            <div className="location-row">
              <div className="location-row__fields">
                <input
                  className="form-input form-input--sm"
                  type="text"
                  placeholder="Latitude"
                  {...register("latitude")}
                  id="tx-latitude"
                />
                <input
                  className="form-input form-input--sm"
                  type="text"
                  placeholder="Longitude"
                  {...register("longitude")}
                  id="tx-longitude"
                />
              </div>
              <button
                type="button"
                className="btn-location"
                onClick={handleGetLocation}
                disabled={geoLoading}
                title="Ambil lokasi saat ini"
                id="tx-get-location"
              >
                {geoLoading ? (
                  <span className="spinner spinner--sm" />
                ) : (
                  <LocationIcon />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            id={isEdit ? "update-tx-btn" : "create-tx-btn"}
          >
            {isSubmitting && <span className="spinner" />}
            {isEdit ? "Simpan Perubahan" : "Tambah Transaksi"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TransactionFormModal;
