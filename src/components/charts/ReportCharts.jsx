const ACCENT = "#e61919";
const INCOME = "#5ddb9b";

/**
 * LineChart (SVG) — running balance trend across days of the month.
 * Pure SVG, no chart library. Renders cumulative income-expense as a line.
 */
export function BalanceLineChart({ year, month, perHari, width = 360 }) {
  const days = new Date(year, month, 0).getDate();

  // cumulative running balance per day
  const daily = Array.from({ length: days }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const key = `${year}-${String(month).padStart(2, "0")}-${day}`;
    const row = perHari.find((r) => r.tanggal === key);
    return (row ? row.income : 0) - (row ? row.expense : 0);
  });

  const cumulative = [];
  let bal = 0;
  for (const d of daily) {
    bal += d;
    cumulative.push(bal);
  }

  const min = Math.min(0, ...cumulative);
  const max = Math.max(0, ...cumulative);
  const range = max - min || 1;

  const Y_LABEL_W = 64;
  const X_LABEL_H = 18;
  const padTop = 14;
  const padBot = 6;
  const innerW = width - Y_LABEL_W;
  const innerH = 140;
  const stepX = innerW / (days - 1 || 1);
  const y = (v) => padTop + innerH - ((v - min) / range) * innerH;

  const points = cumulative
    .map((v, i) => `${(Y_LABEL_W + i * stepX).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");

  // 4 evenly-spaced Y labels
  const yLabels = [];
  for (let i = 0; i <= 4; i += 1) {
    yLabels.push({
      v: min + (range * i) / 4,
      y: padTop + innerH - (i / 4) * innerH,
    });
  }
  const fmtY = (v) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : Math.round(v).toLocaleString("id-ID");

  // X labels: 1, 15, last
  const xLabels = [1, Math.ceil(days / 2), days];

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${width} ${padTop + innerH + X_LABEL_H}`}
        className="chart__svg chart__svg--line"
        role="img"
        aria-label="Tren saldo berjalan"
      >
        {yLabels.map((g, i) => (
          <g key={i}>
            <line
              x1={Y_LABEL_W}
              y1={g.y}
              x2={width}
              y2={g.y}
              className="chart__grid"
            />
            <text x={Y_LABEL_W - 6} y={g.y + 3} textAnchor="end" className="chart__y-label">
              {fmtY(g.v)}
            </text>
          </g>
        ))}
        <polyline
          points={points}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="chart__line"
        />
        <circle
          cx={Y_LABEL_W + ((cumulative.length - 1) * stepX).toFixed(1)}
          cy={y(cumulative[cumulative.length - 1]).toFixed(1)}
          r="3"
          fill={ACCENT}
        />
      </svg>
      <div className="chart__x-axis">
        {xLabels.map((d) => (
          <span key={d} className="chart__x-label">
            {String(d).padStart(2, "0")}
          </span>
        ))}
      </div>
      <div className="chart__legend">
        <span className="chart__legend-item">
          <span className="chart__legend-dot legend--line" /> Saldo berjalan
        </span>
      </div>
    </div>
  );
}

/**
 * DonutChart (SVG) — category composition as a donut.
 * Uses stroke-dasharray on a circle; segments sized by proportion.
 */
export function DonutChart({ items, total, size = 180 }) {
  if (!items || items.length === 0) {
    return <p className="report-empty">Tidak ada data.</p>;
  }

  const flat = Math.max(total, 1e-6);
  const R = 60;
  const C = 2 * Math.PI * R;
  const cx = size / 2;
  const cy = size / 2;
  const COLORS = [ACCENT, INCOME, "#f5a524", "#4fc3f7", "#b39ddb", "#f06292"];

  let offset = 0;
  const segments = items.map((item, i) => {
    const frac = item.jumlah / flat;
    const dash = frac * C;
    const seg = {
      key: item.kategori,
      color: COLORS[i % COLORS.length],
      dash,
      offset,
    };
    offset -= dash;
    return seg;
  });

  return (
    <div className="chart chart--donut">
      <svg viewBox={`0 0 ${size} ${size}`} className="chart__svg" role="img" aria-label="Komposisi kategori">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1a1a1a" strokeWidth="22" />
        {segments.map((s) => (
          <circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeDasharray={`${Math.max(s.dash - 1, 0.5)} ${C}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" className="chart__donut-val">
          {Math.round((total / flat) * 100)}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="chart__donut-cap">
          TOTAL
        </text>
      </svg>
      <div className="chart__legend">
        {items.map((item, i) => (
          <span key={item.kategori} className="chart__legend-item">
            <span
              className="chart__legend-dot"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {item.kategori} {item.jumlah > 0 ? Math.round((item.jumlah / flat) * 100) : 0}%
          </span>
        ))}
      </div>
    </div>
  );
}
