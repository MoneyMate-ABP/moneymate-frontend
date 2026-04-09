import api from "./api";

/**
 * Get all budget periods for the authenticated user
 */
export async function getBudgetPeriods() {
  const res = await api.get("/api/budget-periods");
  return res.data; // { data: [...] }
}
