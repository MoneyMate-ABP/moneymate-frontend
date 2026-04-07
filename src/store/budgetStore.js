import { create } from "zustand";
import {
  getBudgetPeriods,
  createBudgetPeriod,
  updateBudgetPeriod,
  deleteBudgetPeriod,
  fetchAllDailyStatuses,
} from "../services/budgetService";

const useBudgetStore = create((set, get) => ({
  periods: [],
  loading: false,
  error: null,

  dailyStatuses: [],
  dailyLoading: false,

  /* ── Fetch all budget periods ──────────────────── */
  fetchPeriods: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getBudgetPeriods();
      set({ periods: res.data, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load budget periods.",
        loading: false,
      });
    }
  },

  /* ── Create ──────────────────────────────────── */
  createPeriod: async (payload) => {
    const res = await createBudgetPeriod(payload);
    // Append to list
    set((s) => ({ periods: [...s.periods, res.data] }));
    return res;
  },

  /* ── Update ──────────────────────────────────── */
  updatePeriod: async (id, payload) => {
    const res = await updateBudgetPeriod(id, payload);
    set((s) => ({
      periods: s.periods.map((p) => (p.id === id ? res.data : p)),
    }));
    return res;
  },

  /* ── Delete ──────────────────────────────────── */
  deletePeriod: async (id) => {
    await deleteBudgetPeriod(id);
    set((s) => ({
      periods: s.periods.filter((p) => p.id !== id),
    }));
  },

  /* ── Daily statuses for a period ───────────── */
  fetchDailyStatuses: async (id, startDate, endDate) => {
    set({ dailyLoading: true });
    try {
      const statuses = await fetchAllDailyStatuses(id, startDate, endDate);
      set({ dailyStatuses: statuses, dailyLoading: false });
    } catch {
      set({ dailyStatuses: [], dailyLoading: false });
    }
  },

  clearDailyStatuses: () => set({ dailyStatuses: [] }),
}));

export default useBudgetStore;
