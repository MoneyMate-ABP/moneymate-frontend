/**
 * BudgetStatusBar — progress bar showing budget usage with surplus/deficit indicator
 *
 * Props:
 *   name            — budget period name
 *   categoryName    — optional category name
 *   effectiveBudget — effective daily budget (base + carry_over)
 *   totalSpent      — total spent today
 *   remaining       — remaining budget
 *   isWeekend       — boolean
 *   delay           — animation delay index
 */
function BudgetStatusBar({
  name,
  categoryName,
  budgetSystem,
  baseBudget,
  effectiveBudget,
  totalSpent,
  remaining,
  isWeekend,
  delay = 0,
}) {
  const isCarryOverSystem = budgetSystem === "carry_over";
  const shownBudget = isCarryOverSystem
    ? effectiveBudget
    : (baseBudget ?? effectiveBudget);
  const isSurplus = remaining >= 0;
  const percentage =
    shownBudget > 0
      ? Math.min((totalSpent / shownBudget) * 100, 100)
      : totalSpent > 0
        ? 100
        : 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val ?? 0);

  const statusColor = isSurplus ? "#2ecc71" : "#ff4757";
  const statusLabel = isSurplus ? "Surplus" : "Deficit";

  return (
    <div
      className="budget-status-bar"
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      <div className="budget-status-bar__header">
        <div className="budget-status-bar__title">
          <span className="budget-status-bar__name">{name}</span>
          {categoryName && (
            <span className="budget-status-bar__category">{categoryName}</span>
          )}
          {isWeekend && (
            <span className="budget-status-bar__weekend">Weekend</span>
          )}
        </div>
        <div
          className="budget-status-bar__badge"
          style={{
            background: `${statusColor}18`,
            color: statusColor,
            borderColor: `${statusColor}30`,
          }}
        >
          <span
            className="budget-status-bar__dot"
            style={{ background: statusColor }}
          />
          {statusLabel}
        </div>
      </div>

      {/* Progress bar */}
      <div className="budget-status-bar__track">
        <div
          className="budget-status-bar__fill"
          style={{
            width: `${percentage}%`,
            background: isSurplus
              ? "linear-gradient(90deg, #2ecc71, #27ae60)"
              : "linear-gradient(90deg, #ff4757, #ff6b81)",
          }}
        />
      </div>

      {/* Details row */}
      <div className="budget-status-bar__details">
        <div className="budget-status-bar__detail">
          <span className="budget-status-bar__detail-label">
            {isCarryOverSystem ? "Budget Efektif" : "Budget Harian"}
          </span>
          <span className="budget-status-bar__detail-value">
            {formatCurrency(shownBudget)}
          </span>
        </div>
        <div className="budget-status-bar__detail">
          <span className="budget-status-bar__detail-label">Terpakai</span>
          <span
            className="budget-status-bar__detail-value"
            style={{ color: "#ff6b7a" }}
          >
            {formatCurrency(totalSpent)}
          </span>
        </div>
        <div className="budget-status-bar__detail">
          <span className="budget-status-bar__detail-label">Sisa</span>
          <span
            className="budget-status-bar__detail-value"
            style={{ color: statusColor }}
          >
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BudgetStatusBar;
