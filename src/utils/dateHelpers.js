import dayjs from "dayjs";

function toDateOnlyString(value) {
  return String(value ?? "")
    .trim()
    .slice(0, 10);
}

function parseDateOnlyToUtc(value) {
  const dateOnly = toDateOnlyString(value);
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month, day));
}

function formatUtcDateToDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Check if a given date falls on a weekend (Saturday or Sunday).
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {boolean}
 */
export function isWeekend(date) {
  const day = dayjs(date).day(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

export function getWorkingDays(startDate, endDate, excludedDays = [0, 6]) {
  const start = parseDateOnlyToUtc(startDate);
  const end = parseDateOnlyToUtc(endDate);

  if (!start || !end || start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const weekday = current.getUTCDay();
    if (!excludedDays.includes(weekday)) {
      count += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Get every date in a range as an array of YYYY-MM-DD strings.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string[]}
 */
export function getDaysInRange(startDate, endDate) {
  const start = parseDateOnlyToUtc(startDate);
  const end = parseDateOnlyToUtc(endDate);

  if (!start || !end || start > end) {
    return [];
  }

  const days = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(formatUtcDateToDateOnly(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

/**
 * Format a number as Indonesian Rupiah currency.
 * @param {number} amount
 * @returns {string}  e.g. "Rp 68.182"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to a human-friendly label.
 * @param {string} date  YYYY-MM-DD
 * @param {string} format  dayjs format tokens
 * @returns {string}  e.g. "2 Apr 2026"
 */
export function formatDate(date, format = "D MMM YYYY") {
  return dayjs(date).format(format);
}

/**
 * Get the short day-of-week name for a date.
 * @param {string} date  YYYY-MM-DD
 * @returns {string}  e.g. "Mon", "Sat"
 */
export function getDayName(date) {
  return dayjs(date).format("ddd");
}

/**
 * Check if a date string matches today.
 * @param {string} date  YYYY-MM-DD
 * @returns {boolean}
 */
export function isToday(date) {
  return dayjs(date).isSame(dayjs(), "day");
}
