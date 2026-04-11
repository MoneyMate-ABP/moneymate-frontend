import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInvestSavingsSummary } from "../../services/budgetService";
import { formatCurrency, formatDate } from "../../utils/dateHelpers";

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

function InvestSavingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    total_invested: 0,
    period_count: 0,
    periods: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      setLoading(true);
      setError("");
      try {
        const res = await getInvestSavingsSummary();
        if (!mounted) return;
        setSummary(
          res.data || { total_invested: 0, period_count: 0, periods: [] },
        );
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message || "Gagal memuat ringkasan tabungan.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

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
            <h1 id="invest-savings-title">Tabungan Invest</h1>
            <p>Total tabungan dari budget system: Invest</p>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat ringkasan tabungan...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <>
            <section
              className="dashboard-summary"
              style={{ marginBottom: "20px" }}
            >
              <div className="summary-card summary-card-balance">
                <div className="summary-card__icon" aria-hidden="true">
                  💰
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__label">
                    Total Tabungan Invest
                  </span>
                  <strong className="summary-card__amount">
                    {formatCurrency(summary.total_invested || 0)}
                  </strong>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-card__icon" aria-hidden="true">
                  📦
                </div>
                <div className="summary-card__content">
                  <span className="summary-card__label">Period Invest</span>
                  <strong className="summary-card__amount">
                    {summary.period_count || 0}
                  </strong>
                </div>
              </div>
            </section>

            {summary.periods?.length === 0 ? (
              <div className="empty-state" id="empty-invest-state">
                <div className="empty-icon">🏦</div>
                <h3>Belum ada budget invest</h3>
                <p>
                  Buat budget period dengan system Invest untuk mulai menabung
                  otomatis.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/budgets/new")}
                >
                  Buat Budget Invest
                </button>
              </div>
            ) : (
              <div className="budget-grid">
                {summary.periods.map((period) => (
                  <article
                    className="budget-card"
                    key={period.budget_period_id}
                  >
                    <div className="budget-card-header">
                      <div className="budget-card-title-wrap">
                        <h3 className="budget-card-name" style={{ margin: 0 }}>
                          {period.name}
                        </h3>
                        {period.category_name && (
                          <span className="budget-card-category">
                            {period.category_name}
                          </span>
                        )}
                      </div>
                      <span className="badge badge-system">Invest</span>
                    </div>

                    <div className="budget-card-dates">
                      {formatDate(period.start_date)} -{" "}
                      {formatDate(period.end_date)}
                    </div>

                    <div className="budget-card-stats">
                      <div className="budget-stat">
                        <span className="budget-stat-label">
                          Tabungan Terkumpul
                        </span>
                        <span className="budget-stat-value budget-stat-daily">
                          {formatCurrency(period.invested_total || 0)}
                        </span>
                      </div>
                      <div className="budget-stat">
                        <span className="budget-stat-label">Hari Terlacak</span>
                        <span className="budget-stat-value">
                          {period.tracked_days || 0} hari
                        </span>
                      </div>
                    </div>

                    <div className="budget-card-actions">
                      <button
                        className="btn-card btn-card-view"
                        onClick={() =>
                          navigate(`/budgets/${period.budget_period_id}/status`)
                        }
                      >
                        Lihat Status Harian
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default InvestSavingsPage;
