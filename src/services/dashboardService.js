import api from "./api";

/**
 * Fetch dashboard summary (totals + budget status for today).
 */
export async function getDashboard() {
  const res = await api.get("/api/dashboard");
  return res.data; // { data: { totals, budgets } }
}
