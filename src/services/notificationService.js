import api from "./api";

export async function getHistory() {
  const response = await api.get("/api/notifications/history");
  return response.data;
}

export async function markRead(id) {
  await api.patch(`/api/notifications/history/${id}/read`);
}

export async function markAllRead() {
  await api.patch("/api/notifications/history/read-all");
}
