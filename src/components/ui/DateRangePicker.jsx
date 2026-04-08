import dayjs from "dayjs";

/**
 * DateRangePicker — dual date input with quick presets
 *
 * Props:
 *   startDate   — string (YYYY-MM-DD)
 *   endDate     — string (YYYY-MM-DD)
 *   onStartChange — (value: string) => void
 *   onEndChange   — (value: string) => void
 *   onPreset      — ({ start, end }) => void (optional)
 */

const presets = [
  {
    label: "Hari Ini",
    getRange: () => {
      const today = dayjs().format("YYYY-MM-DD");
      return { start: today, end: today };
    },
  },
  {
    label: "Minggu Ini",
    getRange: () => ({
      start: dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD"),
      end: dayjs().endOf("week").add(1, "day").format("YYYY-MM-DD"),
    }),
  },
  {
    label: "Bulan Ini",
    getRange: () => ({
      start: dayjs().startOf("month").format("YYYY-MM-DD"),
      end: dayjs().endOf("month").format("YYYY-MM-DD"),
    }),
  },
  {
    label: "Bulan Lalu",
    getRange: () => ({
      start: dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
      end: dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
    }),
  },
];

function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onPreset,
}) {
  const handlePresetClick = (preset) => {
    const range = preset.getRange();
    if (onPreset) {
      onPreset(range);
    } else {
      onStartChange(range.start);
      onEndChange(range.end);
    }
  };

  return (
    <div className="date-range-picker">
      {/* Quick presets */}
      <div className="date-range-picker__presets">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            className="date-range-picker__preset"
            onClick={() => handlePresetClick(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="date-range-picker__fields">
        <div className="date-range-picker__field">
          <label className="date-range-picker__label">Dari</label>
          <input
            type="date"
            className="form-input form-input--sm"
            value={startDate || ""}
            onChange={(e) => onStartChange(e.target.value)}
            max={endDate || undefined}
          />
        </div>
        <div className="date-range-picker__separator">→</div>
        <div className="date-range-picker__field">
          <label className="date-range-picker__label">Sampai</label>
          <input
            type="date"
            className="form-input form-input--sm"
            value={endDate || ""}
            onChange={(e) => onEndChange(e.target.value)}
            min={startDate || undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;
