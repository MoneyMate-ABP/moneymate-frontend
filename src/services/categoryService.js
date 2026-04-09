import api from "./api";

/**
 * Get all categories for the authenticated user
 */
export async function getCategories() {
  const res = await api.get("/api/categories");
  return res.data; // { data: [...] }
}
