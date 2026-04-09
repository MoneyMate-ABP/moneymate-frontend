import api from "./api";

/**
 * Get list of transactions with optional filters
 * @param {{ date?: string, type?: string, category?: number, page?: number, limit?: number }} params
 */
export async function getTransactions(params = {}) {
  const res = await api.get("/api/transactions", { params });
  return res.data; // { data: [...], meta?: {...} }
}

/**
 * Get a single transaction by id
 * @param {number} id
 */
export async function getTransaction(id) {
  const res = await api.get(`/api/transactions/${id}`);
  return res.data; // { data: {...} }
}

/**
 * Create a new transaction
 * @param {{ category_id, budget_period_id?, type, amount, note?, date, latitude?, longitude? }} payload
 */
export async function createTransaction(payload) {
  const res = await api.post("/api/transactions", payload);
  return res.data; // { message, data }
}

/**
 * Update an existing transaction
 * @param {number} id
 * @param {object} payload
 */
export async function updateTransaction(id, payload) {
  const res = await api.put(`/api/transactions/${id}`, payload);
  return res.data; // { message, data }
}

/**
 * Delete a transaction
 * @param {number} id
 */
export async function deleteTransaction(id) {
  const res = await api.delete(`/api/transactions/${id}`);
  return res.data; // { message }
}
