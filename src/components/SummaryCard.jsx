/**
 * SummaryCard — displays a single financial metric (saldo, income, expense)
 *
 * Props:
 *   icon     — React node (SVG icon)
 *   label    — string label
 *   amount   — number
 *   color    — CSS color for accent
 *   delay    — animation delay index
 */
function SummaryCard({ icon, label, amount, color, delay = 0 }) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

  return (
    <div
      className="summary-card"
      style={{ "--card-accent": color, animationDelay: `${delay * 80}ms` }}
    >
      <div className="summary-card__icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="summary-card__info">
        <span className="summary-card__label">{label}</span>
        <span className="summary-card__amount">{formatted}</span>
      </div>
      <div className="summary-card__glow" style={{ background: color }} />
    </div>
  );
}

export default SummaryCard;
