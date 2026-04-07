import api from "./api";

function normalizeCategoryList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return [];
}

export function scopeCategoriesToUser(categories, userId) {
  if (!Array.isArray(categories)) return [];
  if (!userId) return categories;

  return categories.filter((category) => {
    const ownerId = category?.user_id ?? category?.userId;

    // Keep category when backend does not expose ownership field,
    // otherwise ensure it belongs to current authenticated user.
    if (ownerId === undefined || ownerId === null) return true;
    return String(ownerId) === String(userId);
  });
}

/**
 * Get all categories
 */
export async function getCategories(userId) {
  const res = await api.get("/api/categories");
  const payload = res.data;
  const categories = scopeCategoriesToUser(
    normalizeCategoryList(payload),
    userId,
  );

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return { ...payload, data: categories };
  }

  return { data: categories };
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
