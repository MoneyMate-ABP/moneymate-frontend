import api from "./api";

/**
 * Get dashboard summary (totals + budget status for today)
 */
export async function getDashboard() {
  const res = await api.get("/api/dashboard");
  return res.data; // { data: { totals, budgets } }
}

/**
 * Get recent transactions (last 5)
 */
export async function getRecentTransactions() {
  const res = await api.get("/api/transactions");
  return res.data; // { data: [...] }
}

/**
 * Get daily status for a specific budget period
 */
export async function getBudgetDailyStatus(budgetPeriodId, date) {
  const params = date ? { date } : {};
  const res = await api.get(`/api/budget-periods/${budgetPeriodId}/daily-status`, { params });
  return res.data; // { data: { date, base, carry_over, effective_budget, total_spent, remaining, is_weekend } }
}

/**
 * Get all budget periods
 */
export async function getBudgetPeriods() {
  const res = await api.get("/api/budget-periods");
  return res.data; // { data: [...] }
}
