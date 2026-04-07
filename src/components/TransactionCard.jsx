/**
 * TransactionCard — reusable card for a single transaction
 *
 * Props:
 *   transaction — { id, type, amount, note, date, category_name, budget_period_name }
 *   delay       — animation delay index
 */

const categoryIcons = {
  Makanan: "🍔",
  Transportasi: "🚗",
  Hiburan: "🎬",
  Lainnya: "📦",
  Gaji: "💰",
  Freelance: "💻",
};

function TransactionCard({ transaction, delay = 0 }) {
  const { type, amount, note, date, category_name } = transaction;

  const isExpense = type === "expense";

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const displayDate = new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const icon = categoryIcons[category_name] || (isExpense ? "💸" : "💵");

  return (
    <div
      className="transaction-card"
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <div className={`transaction-card__icon ${isExpense ? "expense" : "income"}`}>
        <span>{icon}</span>
      </div>

      <div className="transaction-card__details">
        <span className="transaction-card__category">
          {category_name || "Uncategorized"}
        </span>
        <span className="transaction-card__note">
          {note || displayDate}
        </span>
      </div>

      <div className={`transaction-card__amount ${isExpense ? "expense" : "income"}`}>
        {isExpense ? "-" : "+"}{formatted}
      </div>
    </div>
  );
}

export default TransactionCard;
