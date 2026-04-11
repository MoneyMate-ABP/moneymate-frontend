import { create } from "zustand";
import {
  getBudgetPeriods,
  createBudgetPeriod,
  updateBudgetPeriod,
  deleteBudgetPeriod,
  fetchAllDailyStatuses,
  setDefaultBudgetPeriod,
} from "../services/budgetService";

const useBudgetStore = create((set, get) => ({
  periods: [],
  loading: false,
  error: null,

  dailyStatuses: [],
  dailyLoading: false,
  dailyFetchKey: null,
  dailyFetchRequestId: 0,

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

  /* ── Set Default ─────────────────────────────── */
  setDefaultPeriod: async (id) => {
    await setDefaultBudgetPeriod(id);
    set((s) => ({
      periods: s.periods.map((p) => ({
        ...p,
        is_default: p.id === id,
      })),
    }));
  },

  /* ── Daily statuses for a period ───────────── */
  fetchDailyStatuses: async (id, startDate, endDate) => {
    const fetchKey = `${id}:${startDate}:${endDate}`;
    const state = get();

    // Prevent duplicate in-flight fetch for the exact same range.
    if (state.dailyLoading && state.dailyFetchKey === fetchKey) {
      return;
    }

    const requestId = state.dailyFetchRequestId + 1;
    set({
      dailyLoading: true,
      dailyFetchKey: fetchKey,
      dailyFetchRequestId: requestId,
    });

    try {
      const statuses = await fetchAllDailyStatuses(id, startDate, endDate);

      // If another newer request is already running/completed, ignore stale result.
      if (get().dailyFetchRequestId !== requestId) {
        return;
      }

      const uniqueByDate = new Map();
      for (const status of statuses || []) {
        if (status?.date) {
          uniqueByDate.set(status.date, status);
        }
      }

      const normalizedStatuses = Array.from(uniqueByDate.values()).sort(
        (a, b) => String(a.date).localeCompare(String(b.date)),
      );

      set({ dailyStatuses: normalizedStatuses, dailyLoading: false });
    } catch {
      if (get().dailyFetchRequestId !== requestId) {
        return;
      }

      set({ dailyStatuses: [], dailyLoading: false });
    }
  },

  clearDailyStatuses: () => set({ dailyStatuses: [] }),
}));

export default useBudgetStore;
