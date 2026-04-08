import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBudgetStore from "../../store/budgetStore";
import useAuthStore from "../../store/authStore";
import { getCategories } from "../../services/categoryService";
import {
  getWorkingDays,
  formatCurrency,
} from "../../utils/dateHelpers";
import dayjs from "dayjs";

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

function BudgetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const userId = useAuthStore((s) => s.user?.id);

  const { periods, createPeriod, updatePeriod, fetchPeriods } =
    useBudgetStore();

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    total_budget: "",
    start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
    end_date: dayjs().endOf("month").format("YYYY-MM-DD"),
    category_id: "",
  });

  // Load categories
  useEffect(() => {
    getCategories(userId)
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, [userId]);

  // If editing, populate form with existing period data
  useEffect(() => {
    if (isEdit) {
      // Try from store first
      let period = periods.find((p) => p.id === Number(id));
      if (period) {
        setForm({
          name: period.name,
          total_budget: String(period.total_budget),
          start_date: period.start_date,
          end_date: period.end_date,
          category_id: period.category_id ?? "",
        });
      } else {
        // Fetch from server if not in store
        fetchPeriods().then(() => {
          const updated = useBudgetStore.getState().periods;
          const p = updated.find((p) => p.id === Number(id));
          if (p) {
            setForm({
              name: p.name,
              total_budget: String(p.total_budget),
              start_date: p.start_date,
              end_date: p.end_date,
              category_id: p.category_id ?? "",
            });
          }
        });
      }
    }
  }, [isEdit, id, periods, fetchPeriods]);

  // Live preview calculations
  const preview = useMemo(() => {
    const { start_date, end_date, total_budget } = form;
    if (!start_date || !end_date || !total_budget) {
      return { workingDays: 0, weekendDays: 0, dailyBudget: 0, totalDays: 0 };
    }

    const start = dayjs(start_date);
    const end = dayjs(end_date);
    if (end.isBefore(start)) {
      return { workingDays: 0, weekendDays: 0, dailyBudget: 0, totalDays: 0 };
    }

    const totalDays = end.diff(start, "day") + 1;
    const workingDays = getWorkingDays(start_date, end_date);
    const weekendDays = totalDays - workingDays;
    const budget = parseFloat(total_budget) || 0;
    const dailyBudget = workingDays > 0 ? budget / workingDays : 0;

    return { workingDays, weekendDays, dailyBudget, totalDays };
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      total_budget: parseFloat(form.total_budget),
      start_date: form.start_date,
      end_date: form.end_date,
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      if (isEdit) {
        await updatePeriod(Number(id), payload);
      } else {
        await createPeriod(payload);
      }
      navigate("/budgets");
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal menyimpan budget period."
      );
    } finally {
      setSubmitting(false);
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
            onSubmit={handleSubmit}
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
                name="name"
                placeholder="Contoh: Budget April 2026"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-total-budget">
                Total Budget
              </label>
              <input
                id="input-total-budget"
                className="form-input"
                type="number"
                name="total_budget"
                placeholder="1500000"
                value={form.total_budget}
                onChange={handleChange}
                min="0"
                step="1000"
                required
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
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
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
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
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
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">Global (Semua kategori)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={submitting}
              id="btn-submit"
            >
              {submitting && <span className="spinner" />}
              {submitting
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
                  <span className="preview-stat-label">Hari Kerja</span>
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
                  <span className="preview-stat-label">Hari Weekend</span>
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
              Budget harian = Total Budget ÷ Hari Kerja. Weekend mendapat budget
              Rp 0 (carry-over tetap aktif).
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BudgetFormPage;
