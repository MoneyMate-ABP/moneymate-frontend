import api from "./api";

/**
 * Get all categories
 */
export async function getCategories() {
  const res = await api.get("/api/categories");
  return res.data; // { data: [...] }
}

/**
 * Create a new category
 */
export async function createCategory({ name, type }) {
  const res = await api.post("/api/categories", { name, type });
  return res.data; // { message, data: { id, name, type } }
}

/**
 * Update an existing category
 */
export async function updateCategory(id, { name, type }) {
  const res = await api.put(`/api/categories/${id}`, { name, type });
  return res.data; // { message, data: { id, name, type } }
}

/**
 * Delete a category
 */
export async function deleteCategory(id) {
  const res = await api.delete(`/api/categories/${id}`);
  return res.data; // { message }
}
