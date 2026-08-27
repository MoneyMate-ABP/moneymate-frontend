import api from "./api";

/**
 * Fetch monthly income/expense report.
 * @param {number} year
 * @param {number} month (1-12)
 */
export async function getMonthlyReport(year, month) {
  const res = await api.get("/api/reports/monthly", {
    params: { year, month },
  });
  return res.data; // { tahun, bulan, total_income, ... }
}
