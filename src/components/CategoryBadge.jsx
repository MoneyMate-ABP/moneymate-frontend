/**
 * CategoryBadge — chip warna per kategori
 *
 * Props:
 *   name — category name string
 *   type — "expense" | "income" (optional, for color fallback)
 */

const categoryColors = {
  Makanan:       { bg: "rgba(255, 165, 2, 0.12)",  color: "#ffa502", border: "rgba(255, 165, 2, 0.25)",   emoji: "🍔" },
  Transportasi:  { bg: "rgba(0, 168, 255, 0.12)",  color: "#00a8ff", border: "rgba(0, 168, 255, 0.25)",   emoji: "🚗" },
  Hiburan:       { bg: "rgba(232, 67, 147, 0.12)", color: "#e84393", border: "rgba(232, 67, 147, 0.25)",  emoji: "🎬" },
  Lainnya:       { bg: "rgba(162, 155, 254, 0.12)",color: "#a29bfe", border: "rgba(162, 155, 254, 0.25)", emoji: "📦" },
  Gaji:          { bg: "rgba(46, 204, 113, 0.12)", color: "#2ecc71", border: "rgba(46, 204, 113, 0.25)",  emoji: "💰" },
  Freelance:     { bg: "rgba(9, 132, 227, 0.12)",  color: "#0984e3", border: "rgba(9, 132, 227, 0.25)",   emoji: "💻" },
};

const defaultExpense = { bg: "rgba(255, 71, 87, 0.12)",  color: "#ff4757", border: "rgba(255, 71, 87, 0.25)",  emoji: "💸" };
const defaultIncome  = { bg: "rgba(46, 204, 113, 0.12)", color: "#2ecc71", border: "rgba(46, 204, 113, 0.25)", emoji: "💵" };
const defaultBoth    = { bg: "rgba(108, 99, 255, 0.12)", color: "#6c63ff", border: "rgba(108, 99, 255, 0.25)", emoji: "🔄" };

function CategoryBadge({ name, type }) {
  const config = categoryColors[name]
    || (type === "income" ? defaultIncome : type === "expense" ? defaultExpense : defaultBoth);

  return (
    <span
      className="category-badge"
      style={{
        background: config.bg,
        color: config.color,
        borderColor: config.border,
      }}
    >
      <span className="category-badge__emoji">{config.emoji}</span>
      {name || "Tanpa Kategori"}
    </span>
  );
}

export default CategoryBadge;
