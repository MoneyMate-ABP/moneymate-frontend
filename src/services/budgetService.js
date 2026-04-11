import api from "./api";
import { getDaysInRange } from "../utils/dateHelpers";

/**
 * Fetch all budget periods for the authenticated user.
 */
export async function getBudgetPeriods() {
  const res = await api.get("/api/budget-periods");
  return res.data; // { data: BudgetPeriod[] }
}

/**
 * Create a new budget period.
 */
export async function createBudgetPeriod(payload) {
  const res = await api.post("/api/budget-periods", payload);
  return res.data; // { message, data: BudgetPeriod }
}

/**
 * Update an existing budget period.
 */
export async function updateBudgetPeriod(id, payload) {
  const res = await api.put(`/api/budget-periods/${id}`, payload);
  return res.data;
}

/**
 * Delete a budget period.
 */
export async function deleteBudgetPeriod(id) {
  const res = await api.delete(`/api/budget-periods/${id}`);
  return res.data;
}

/**
 * Get daily status for a budget period on a specific date.
 */
export async function getDailyStatus(id, date) {
  const res = await api.get(`/api/budget-periods/${id}/daily-status`, {
    params: date ? { date } : {},
  });
  return res.data; // { data: DailyStatus }
}

/**
 * Fetch daily statuses for every day in a budget period's range.
 * Returns an array of DailyStatus objects sorted by date.
 */
export async function fetchAllDailyStatuses(id, startDate, endDate) {
  try {
    const res = await api.get(`/api/budget-periods/${id}/daily-statuses`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });

    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    // Backward-compatible fallback while backend deployment is rolling out.
    const days = getDaysInRange(startDate, endDate);
    const results = [];

    for (let i = 0; i < days.length; i += 7) {
      const batch = days.slice(i, i + 7);
      const batchResults = await Promise.all(
        batch.map((date) =>
          getDailyStatus(id, date)
            .then((res) => res.data)
            .catch(() => ({
              date,
              base: 0,
              carry_over: 0,
              effective_budget: 0,
              total_spent: 0,
              remaining: 0,
              is_weekend: false,
            })),
        ),
      );
      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Set a budget period as default.
 */
export async function setDefaultBudgetPeriod(id) {
  const res = await api.post(`/api/budget-periods/${id}/set-default`);
  return res.data;
}

/**
 * Get summary of savings produced by invest budget system.
 */
export async function getInvestSavingsSummary() {
  const res = await api.get("/api/budget-periods/invest-savings");
  return res.data; // { data: { total_invested, period_count, periods[] } }
}
