/**
 * CategoryBadge — colored chip for a category name
 * 
 * Props:
 *   name: string — category name
 *   size: 'sm' | 'md' (default md)
 */

const CATEGORY_COLORS = {
  makanan: { bg: "rgba(255, 165, 2, 0.12)", border: "rgba(255, 165, 2, 0.3)", text: "#ffb833", emoji: "🍜" },
  transportasi: { bg: "rgba(66, 133, 244, 0.12)", border: "rgba(66, 133, 244, 0.3)", text: "#6ba8f7", emoji: "🚗" },
  hiburan: { bg: "rgba(156, 39, 176, 0.12)", border: "rgba(156, 39, 176, 0.3)", text: "#ce93d8", emoji: "🎮" },
  belanja: { bg: "rgba(233, 30, 99, 0.12)", border: "rgba(233, 30, 99, 0.3)", text: "#f06292", emoji: "🛍️" },
  kesehatan: { bg: "rgba(76, 175, 80, 0.12)", border: "rgba(76, 175, 80, 0.3)", text: "#81c784", emoji: "🏥" },
  pendidikan: { bg: "rgba(3, 169, 244, 0.12)", border: "rgba(3, 169, 244, 0.3)", text: "#4fc3f7", emoji: "📚" },
  lainnya: { bg: "rgba(255, 255, 255, 0.06)", border: "rgba(255, 255, 255, 0.15)", text: "rgba(240,240,245,0.6)", emoji: "📌" },
};

const DEFAULT_COLOR = { bg: "rgba(108, 99, 255, 0.12)", border: "rgba(108, 99, 255, 0.3)", text: "#a5a0ff", emoji: "💰" };

export default function CategoryBadge({ name, size = "md" }) {
  if (!name) return null;
  const key = name.toLowerCase();
  const color = CATEGORY_COLORS[key] || DEFAULT_COLOR;

  return (
    <span
      className={`category-badge category-badge--${size}`}
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
      }}
    >
      <span className="category-badge__emoji">{color.emoji}</span>
      {name}
    </span>
  );
}
