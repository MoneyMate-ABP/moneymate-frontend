/**
 * Badge — reusable status badge component
 *
 * Props:
 *   variant  — "active" | "finished" | "upcoming" | "expense" | "income" | "info" | "warning"
 *   dot      — boolean (show pulsing dot)
 *   children — badge text
 *   className — extra CSS classes
 */

const variantMap = {
  active: "badge-active",
  finished: "badge-finished",
  upcoming: "badge-upcoming",
  expense: "badge-expense",
  income: "badge-income",
  info: "badge-info",
  warning: "badge-warning",
};

function Badge({ variant = "info", dot = false, children, className = "" }) {
  const classes = ["badge", variantMap[variant] || "badge-info", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export default Badge;
