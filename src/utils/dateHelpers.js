import dayjs from "dayjs";

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
  let count = 0;
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end, "day")) {
    if (!excludedDays.includes(current.day())) {
      count++;
    }
    current = current.add(1, "day");
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
  const days = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end, "day")) {
    days.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
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
