import api from "./api";

/**
 * Get all available categories
 */
export async function getCategories() {
  const res = await api.get("/api/categories");
  return res.data; // { data: [...] }
}
