import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBudgetStore from "../../store/budgetStore";
import ConfirmModal from "../../components/ConfirmModal";
import { formatCurrency, formatDate } from "../../utils/dateHelpers";
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

function BudgetListPage() {
  const navigate = useNavigate();
  const {
    periods,
    loading,
    error,
    fetchPeriods,
    deletePeriod,
    setDefaultPeriod,
  } = useBudgetStore();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Lazy Load
  const [visibleCount, setVisibleCount] = useState(20);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePeriod(deleteTarget.id);
    } catch {
      // ignore
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const getStatus = (period) => {
    const today = dayjs();
    const start = dayjs(period.start_date);
    const end = dayjs(period.end_date);

    if (today.isBefore(start)) return "upcoming";
    if (today.isAfter(end)) return "finished";
    return "active";
  };

  const statusConfig = {
    active: { label: "Aktif", className: "badge-active" },
    finished: { label: "Selesai", className: "badge-finished" },
    upcoming: { label: "Mendatang", className: "badge-upcoming" },
  };

  const budgetSystemLabel = {
    carry_over: "Bawa Sisa",
    invest: "Tabungan",
    nothing: "Standar",
  };

  const paginated = periods.slice(0, visibleCount);

  /**
   * Groups budget periods by month.
   * Returns an array of { key, label, items } in descending order.
   */
  const groupByMonth = (items) => {
    const groups = [];
    const map = {};

    for (const item of items) {
      const monthKey = dayjs(item.start_date).format("YYYY-MM");
      if (!map[monthKey]) {
        map[monthKey] = {
          key: monthKey,
          label: dayjs(item.start_date).format("MMMM YYYY"),
          items: [],
        };
        groups.push(map[monthKey]);
      }
      map[monthKey].items.push(item);
    }

    return groups.sort((a, b) => b.key.localeCompare(a.key));
  };

  const groupedPeriods = groupByMonth(paginated);

  return (
    <div className="page-container">
      <main className="dashboard-main">
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/")}
            id="back-to-dashboard-btn"
          >
            <BackIcon />
          </button>
          <div>
            <h1 id="budget-list-title">Anggaran Bulanan</h1>
            <p>Kelola anggaran bulananmu</p>
          </div>
        </div>

        <div className="category-toolbar">
          <div className="category-count" style={{ margin: 0 }}>
            <span>{periods.length} anggaran ditemukan</span>
          </div>
          <div className="dashboard-quick-actions" style={{ gap: "8px" }}>
            <button
              className="btn btn-secondary category-toolbar__add"
              onClick={() => navigate("/budgets/invest-savings")}
              id="btn-open-invest-savings"
            >
              <span>Tabungan</span>
            </button>
            <button
              className="btn btn-primary category-toolbar__add"
              onClick={() => navigate("/budgets/new")}
              id="btn-add-budget"
            >
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tambah</span>
            </button>
          </div>
        </div>

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

        {loading ? (
          <div className="budget-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="budget-card budget-card-skeleton">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-sub" />
                <div className="skeleton-line skeleton-sub" />
                <div className="skeleton-line skeleton-amount" />
              </div>
            ))}
          </div>
        ) : periods.length === 0 ? (
          <div className="empty-state" id="empty-state">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                <path d="M3 5v14a2 2 0 002 2h16v-5" />
                <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
              </svg>
            </div>
            <h3>Belum ada anggaran</h3>
            <p>Yuk, mulai buat anggaran pertamamu!</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/budgets/new")}
            >
              Buat Anggaran
            </button>
          </div>
        ) : (
          <>
            <div className="budget-year-section">
              {groupedPeriods.map((group) => (
                <div key={group.key} className="budget-month-group">
                  <div className="budget-month-header">
                    <span className="budget-month-header__label">
                      {group.label}
                    </span>
                    <span className="budget-month-header__count">
                      {group.items.length} periode
                    </span>
                  </div>
                  <div className="budget-grid">
                    {group.items.map((period) => {
                      const status = getStatus(period);
                      const cfg = statusConfig[status];
                      return (
                        <div
                          key={period.id}
                          className={`budget-card ${status === "active" ? "budget-card-active" : ""}`}
                          id={`budget-card-${period.id}`}
                        >
                          <div className="budget-card-header">
                            <div className="budget-card-title-wrap">
                              <div className="budget-card-title-row">
                                <h3
                                  className="budget-card-name"
                                  style={{ margin: 0 }}
                                >
                                  {period.name}
                                </h3>
                                {period.is_default && (
                                  <span className="badge badge-default">
                                    ★ Default
                                  </span>
                                )}
                              </div>
                              <span className="badge badge-system">
                                {budgetSystemLabel[period.budget_system] ||
                                  "Standar"}
                              </span>
                            </div>
                            <span className={`badge ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </div>

                          <div className="budget-card-dates">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="14"
                              height="14"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDate(period.start_date)} —{" "}
                            {formatDate(period.end_date)}
                          </div>

                          {period.category_name && (
                            <div className="budget-card-category">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="14"
                                height="14"
                              >
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                              </svg>
                              {period.category_name}
                            </div>
                          )}

                          <div className="budget-card-stats">
                            <div className="budget-stat">
                              <span className="budget-stat-label">
                                Total Budget
                              </span>
                              <span className="budget-stat-value">
                                {formatCurrency(period.total_budget)}
                              </span>
                            </div>
                            <div className="budget-stat">
                              <span className="budget-stat-label">Harian</span>
                              <span className="budget-stat-value budget-stat-daily">
                                {formatCurrency(period.daily_budget_base)}
                              </span>
                            </div>
                            <div className="budget-stat">
                              <span className="budget-stat-label">
                                Hari Kerja
                              </span>
                              <span className="budget-stat-value">
                                {period.working_days_count} hari
                              </span>
                            </div>
                          </div>

                          <div className="budget-card-actions">
                            <button
                              className="btn-card btn-card-view"
                              onClick={() =>
                                navigate(`/budgets/${period.id}/status`)
                              }
                              id={`btn-view-${period.id}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="15"
                                height="15"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Status
                            </button>
                            <button
                              className="btn-card btn-card-edit"
                              onClick={() =>
                                navigate(`/budgets/${period.id}/edit`)
                              }
                              id={`btn-edit-${period.id}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="15"
                                height="15"
                              >
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="btn-card btn-card-delete"
                              onClick={() => setDeleteTarget(period)}
                              id={`btn-delete-${period.id}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="15"
                                height="15"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              Hapus
                            </button>

                            {!period.is_default && (
                              <button
                                className="btn-card btn-card-default"
                                onClick={() => setDefaultPeriod(period.id)}
                                id={`btn-set-default-${period.id}`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  width="15"
                                  height="15"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                Set Default
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {visibleCount < periods.length ? (
              <div className="load-more-container">
                <button
                  className="btn load-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + itemsPerPage)}
                >
                  Tampilkan lebih banyak ({periods.length - visibleCount}{" "}
                  tersisa)
                </button>
              </div>
            ) : periods.length > itemsPerPage ? (
              <div className="load-more-end">
                <span>Semua budget ditampilkan</span>
              </div>
            ) : null}
          </>
        )}
      </main>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Anggaran"
        message={`Budget "${deleteTarget?.name}" akan dihapus permanen. Lanjutkan?`}
        warning="Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        icon="🗑️"
        isSubmitting={deleting}
        variant="danger"
      />
    </div>
  );
}

export default BudgetListPage;
