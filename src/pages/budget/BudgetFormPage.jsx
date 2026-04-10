import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import useBudgetStore from "../../store/budgetStore";
import useAuthStore from "../../store/authStore";
import { getCategories } from "../../services/categoryService";
import { getWorkingDays, formatCurrency } from "../../utils/dateHelpers";
import CurrencyInput from "../../components/CurrencyInput";
import dayjs from "dayjs";
import { parseApiError } from "../../utils/validation";

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const WEEKDAYS = [
  { value: 0, label: "Minggu" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" }
];

function BudgetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const userId = useAuthStore((s) => s.user?.id);

  const { periods, createPeriod, updatePeriod, fetchPeriods } = useBudgetStore();

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      total_budget: "",
      start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
      end_date: dayjs().endOf("month").format("YYYY-MM-DD"),
      category_id: "",
      excluded_weekdays: ["0", "6"], // default excluded: Sunday and Saturday
    },
  });

  // Watch fields for live preview
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedTotalBudget = watch("total_budget");
  const watchedExcluded = watch("excluded_weekdays");

  // Load categories
  useEffect(() => {
    getCategories(userId)
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, [userId]);

  // If editing, populate form with existing period data
  useEffect(() => {
    if (isEdit) {
      let period = periods.find((p) => p.id === Number(id));
      
      const applyData = (p) => {
        reset({
          name: p.name,
          total_budget: String(p.total_budget),
          start_date: p.start_date,
          end_date: p.end_date,
          category_id: p.category_id ?? "",
          excluded_weekdays: Array.isArray(p.excluded_weekdays) 
            ? p.excluded_weekdays.map(String) 
            : ["0", "6"],
        });
      };

      if (period) {
        applyData(period);
      } else {
        fetchPeriods().then(() => {
          const updated = useBudgetStore.getState().periods;
          const p = updated.find((p) => p.id === Number(id));
          if (p) {
            applyData(p);
          }
        });
      }
    }
  }, [isEdit, id, periods, fetchPeriods, reset]);

  // Live preview calculations
  const preview = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate || !watchedTotalBudget) {
      return { workingDays: 0, weekendDays: 0, dailyBudget: 0, totalDays: 0 };
    }

    const start = dayjs(watchedStartDate);
    const end = dayjs(watchedEndDate);
    if (end.isBefore(start)) {
      return { workingDays: 0, weekendDays: 0, dailyBudget: 0, totalDays: 0 };
    }

    const totalDays = end.diff(start, "day") + 1;
    // ensure excludedArray is an array of numbers
    const excludedArray = Array.isArray(watchedExcluded) ? watchedExcluded.map(Number) : [];
    
    const workingDays = getWorkingDays(watchedStartDate, watchedEndDate, excludedArray);
    const weekendDays = totalDays - workingDays;
    const budget = parseFloat(watchedTotalBudget) || 0;
    const dailyBudget = workingDays > 0 ? budget / workingDays : 0;

    return { workingDays, weekendDays, dailyBudget, totalDays };
  }, [watchedStartDate, watchedEndDate, watchedTotalBudget, watchedExcluded]);

  const onSubmit = async (data) => {
    setError(null);

    const payload = {
      name: data.name.trim(),
      total_budget: parseFloat(data.total_budget),
      start_date: data.start_date,
      end_date: data.end_date,
      category_id: data.category_id ? Number(data.category_id) : null,
      excluded_weekdays: data.excluded_weekdays ? data.excluded_weekdays.map(Number) : [],
    };

    try {
      if (isEdit) {
        await updatePeriod(Number(id), payload);
      } else {
        await createPeriod(payload);
      }
      navigate("/budgets");
    } catch (err) {
      setError(parseApiError(err, "Gagal menyimpan budget period."));
    }
  };

  return (
    <div className="page-container">
      <main className="dashboard-main">
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/budgets")}
            id="btn-back"
          >
            <BackIcon />
          </button>
          <div>
            <h1 id="budget-form-title">
              {isEdit ? "Edit Budget Period" : "Buat Budget Period"}
            </h1>
            <p>
              {isEdit
                ? "Perbarui detail budget period"
                : "Atur anggaran untuk periode tertentu"}
            </p>
          </div>
        </div>

        <div className="budget-form-container">
          <form
            className="budget-form"
            onSubmit={handleSubmit(onSubmit)}
            id="budget-form"
          >
            {error && (
              <div className="alert alert-error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="input-name">
                Nama Budget
              </label>
              <input
                id="input-name"
                className="form-input"
                type="text"
                placeholder="Contoh: Budget April 2026"
                {...register("name", { required: true })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-total-budget">
                Total Budget
              </label>
              <Controller
                name="total_budget"
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <CurrencyInput
                    id="input-total-budget"
                    value={Number(value) || 0}
                    onChange={(numericValue) => onChange(numericValue ? String(numericValue) : "")}
                    placeholder="0"
                  />
                )}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="input-start-date">
                  Tanggal Mulai
                </label>
                <input
                  id="input-start-date"
                  className="form-input"
                  type="date"
                  {...register("start_date", { required: true })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-end-date">
                  Tanggal Selesai
                </label>
                <input
                  id="input-end-date"
                  className="form-input"
                  type="date"
                  {...register("end_date", { required: true })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-category">
                Kategori (Opsional)
              </label>
              <select
                id="input-category"
                className="form-input form-select"
                {...register("category_id")}
              >
                <option value="">Global (Semua kategori)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Custom Excluded Days (Hari yang tidak dihitung dalam budget)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                {WEEKDAYS.map((day) => (
                  <label key={day.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "16px", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      value={String(day.value)}
                      {...register("excluded_weekdays")}
                      style={{ accentColor: "#4f46e5", cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isSubmitting}
              id="btn-submit"
              style={{ marginTop: "1rem" }}
            >
              {isSubmitting && <span className="spinner" />}
              {isSubmitting
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Buat Budget"}
            </button>
          </form>

          {/* ── Live Preview Panel ────────────────────── */}
          <div className="budget-preview" id="budget-preview">
            <h3 className="preview-title">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview
            </h3>

            <div className="preview-stats">
              <div className="preview-stat">
                <span className="preview-stat-icon preview-stat-total">📅</span>
                <div>
                  <span className="preview-stat-value">
                    {preview.totalDays}
                  </span>
                  <span className="preview-stat-label">Total Hari</span>
                </div>
              </div>

              <div className="preview-stat">
                <span className="preview-stat-icon preview-stat-working">
                  💼
                </span>
                <div>
                  <span className="preview-stat-value">
                    {preview.workingDays}
                  </span>
                  <span className="preview-stat-label">Hari Dihitung</span>
                </div>
              </div>

              <div className="preview-stat">
                <span className="preview-stat-icon preview-stat-weekend">
                  🌙
                </span>
                <div>
                  <span className="preview-stat-value">
                    {preview.weekendDays}
                  </span>
                  <span className="preview-stat-label">Hari Excluded</span>
                </div>
              </div>

              <div className="preview-stat preview-stat-highlight">
                <span className="preview-stat-icon preview-stat-daily">💰</span>
                <div>
                  <span className="preview-stat-value">
                    {formatCurrency(preview.dailyBudget)}
                  </span>
                  <span className="preview-stat-label">Budget Harian</span>
                </div>
              </div>
            </div>

            <div className="preview-note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Budget harian = Total Budget ÷ Hari Dihitung. Hari Excluded mendapat budget
              Rp 0 (carry-over tetap aktif).
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BudgetFormPage;
