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

/**
 * Analyze uploaded receipt with AI and return extracted transaction draft
 */
export async function scanReceipt(file) {
  const formData = new FormData();
  formData.append("receipt", file);

  const res = await api.post("/api/transactions/receipt-scan", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data; // { message, data }
}

/**
 * Analyze uploaded bank mutation screenshots with AI and return extracted transactions
 * @param {File[]} files - Array of screenshot files
 */
export async function scanMutation(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("receipts", file);
  }

  const res = await api.post("/api/transactions/mutation-scan", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data; // { message, data: [...] }
}
