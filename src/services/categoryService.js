import api from "./api";

/**
 * Fetch all categories.
 */
export async function getCategories() {
  const res = await api.get("/api/categories");
  return res.data; // { data: Category[] }
}
