import api from "./api";

/**
 * Get all transactions with optional filters
 * @param {Object} params - { date, type, category }
 */
export async function getTransactions(params = {}) {
  const res = await api.get("/api/transactions", { params });
  return res.data; // { data: [...] }
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(id) {
  const res = await api.get(`/api/transactions/${id}`);
  return res.data.data; // { data: { ... } }
}

/**
 * Create a new transaction
 */
export async function createTransaction(data) {
  const res = await api.post("/api/transactions", data);
  return res.data; // { message, data: { ... } }
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id, data) {
  const res = await api.put(`/api/transactions/${id}`, data);
  return res.data; // { message, data: { ... } }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id) {
  const res = await api.delete(`/api/transactions/${id}`);
  return res.data; // { message }
}
