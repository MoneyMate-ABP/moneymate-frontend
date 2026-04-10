import { useCallback, useEffect, useState } from "react";
import {
  getHistory,
  markAllRead as markAllReadRequest,
  markRead as markReadRequest,
} from "../services/notificationService";

export default function useNotificationHistory() {
  const [history, setHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getHistory();
      setHistory(Array.isArray(result?.data) ? result.data : []);
      setUnreadCount(Number(result?.unread_count || 0));
    } catch {
      setHistory([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refetch();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    const handleWindowFocus = () => {
      refetch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [refetch]);

  const markRead = useCallback(
    async (id) => {
      await markReadRequest(id);
      await refetch();
    },
    [refetch],
  );

  const markAllRead = useCallback(async () => {
    await markAllReadRequest();
    await refetch();
  }, [refetch]);

  return {
    history,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refetch,
  };
}
