import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBudgetStore from "../../store/budgetStore";
import {
  formatCurrency,
  formatDate,
  getDayName,
  isToday,
  isWeekend,
} from "../../utils/dateHelpers";

function DailyStatusPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    periods,
    fetchPeriods,
    dailyStatuses,
    dailyLoading,
    fetchDailyStatuses,
    clearDailyStatuses,
  } = useBudgetStore();

  // Find the period from store
  const period = useMemo(
    () => periods.find((p) => p.id === Number(id)),
    [periods, id]
  );

  // Fetch periods if not loaded
  useEffect(() => {
    if (periods.length === 0) fetchPeriods();
  }, [periods.length, fetchPeriods]);

  // Fetch daily statuses once we know the period range
  useEffect(() => {
    if (period) {
      fetchDailyStatuses(period.id, period.start_date, period.end_date);
    }
    return () => clearDailyStatuses();
  }, [period, fetchDailyStatuses, clearDailyStatuses]);

  const getRowClass = (status) => {
    if (status.is_weekend) return "row-weekend";
    if (status.remaining < 0) return "row-deficit";
    return "row-surplus";
  };

  if (!period && !dailyLoading) {
    return (
      <div className="budget-status-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate("/budgets")} id="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali
          </button>
          <h1 className="page-title">Budget tidak ditemukan</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-status-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate("/budgets")} id="btn-back-status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali
          </button>
          <h1 className="page-title" id="status-title">
            {period?.name || "Daily Status"}
          </h1>
          <p className="page-subtitle">
            {period &&
              `${formatDate(period.start_date)} — ${formatDate(period.end_date)}  •  ${formatCurrency(period.total_budget)}  •  ${period.working_days_count} hari kerja`}
          </p>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────── */}
      {period && (
        <div className="status-summary-cards">
          <div className="summary-card">
            <span className="summary-card-icon">💰</span>
            <div>
              <span className="summary-card-label">Total Budget</span>
              <span className="summary-card-value">{formatCurrency(period.total_budget)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-card-icon">📊</span>
            <div>
              <span className="summary-card-label">Budget Harian</span>
              <span className="summary-card-value">{formatCurrency(period.daily_budget_base)}</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-card-icon">📅</span>
            <div>
              <span className="summary-card-label">Hari Kerja</span>
              <span className="summary-card-value">{period.working_days_count} hari</span>
            </div>
          </div>
          {period.category_name && (
            <div className="summary-card">
              <span className="summary-card-icon">🏷️</span>
              <div>
                <span className="summary-card-label">Kategori</span>
                <span className="summary-card-value">{period.category_name}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Legend ───────────────────────────────── */}
      <div className="status-legend">
        <div className="legend-item">
          <span className="legend-dot legend-dot-surplus" />
          Surplus
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-deficit" />
          Deficit
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-weekend" />
          Weekend
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-today" />
          Hari Ini
        </div>
      </div>

      {/* ── Table ────────────────────────────────── */}
      {dailyLoading ? (
        <div className="status-loading">
          <span className="spinner spinner-lg" />
          <p>Memuat data harian...</p>
        </div>
      ) : (
        <div className="status-table-wrapper" id="status-table-wrapper">
          <table className="status-table" id="status-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Hari</th>
                <th>Base Budget</th>
                <th>Carry Over</th>
                <th>Efektif</th>
                <th>Terpakai</th>
                <th>Sisa</th>
              </tr>
            </thead>
            <tbody>
              {dailyStatuses.map((status) => {
                const today = isToday(status.date);
                const rowClass = getRowClass(status);
                return (
                  <tr
                    key={status.date}
                    className={`${rowClass} ${today ? "row-today" : ""}`}
                    id={`row-${status.date}`}
                  >
                    <td className="cell-date">{formatDate(status.date, "DD MMM")}</td>
                    <td className="cell-day">{getDayName(status.date)}</td>
                    <td>{formatCurrency(status.base)}</td>
                    <td>
                      <span className={status.carry_over > 0 ? "text-positive" : status.carry_over < 0 ? "text-negative" : ""}>
                        {status.carry_over > 0 ? "+" : ""}
                        {formatCurrency(status.carry_over)}
                      </span>
                    </td>
                    <td>{formatCurrency(status.effective_budget)}</td>
                    <td className="text-spent">{formatCurrency(status.total_spent)}</td>
                    <td>
                      <span className={`remaining-badge ${status.remaining >= 0 ? "remaining-positive" : "remaining-negative"}`}>
                        {formatCurrency(status.remaining)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DailyStatusPage;
