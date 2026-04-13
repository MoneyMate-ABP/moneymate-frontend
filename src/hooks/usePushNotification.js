import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  return Notification.permission;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  // Cleanup legacy manual registration that can conflict on iOS Safari PWA.
  await Promise.all(
    registrations
      .filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          "";

        return scriptUrl.endsWith("/sw-push.js");
      })
      .map((registration) => registration.unregister()),
  );

  const existing = await navigator.serviceWorker.getRegistration("/");

  if (existing && existing.active?.scriptURL?.endsWith("/sw.js")) {
    return existing;
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    updateViaCache: "none",
  });

  await registration.update();
  return registration;
}

function isPushSupportedInBrowser() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function usePushNotification() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const isDev = useMemo(() => import.meta.env.DEV, []);

  const syncSubscriptionState = useCallback(async () => {
    const supported = isPushSupportedInBrowser();
    setIsSupported(supported);
    setPermission(getNotificationPermission());

    if (!supported || isDev) {
      setIsSubscribed(false);
      return;
    }

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        setIsSubscribed(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch {
      setIsSubscribed(false);
    }
  }, [isDev]);

  useEffect(() => {
    syncSubscriptionState();
  }, [syncSubscriptionState]);

  const subscribe = useCallback(async () => {
    if (isDev) {
      toast.success("Mode development: notifikasi push dimock.");
      setIsSubscribed(true);
      return true;
    }

    if (!isPushSupportedInBrowser()) {
      return false;
    }

    try {
      const nextPermission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setIsSubscribed(false);
        return false;
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const { data } = await api.get("/api/notifications/vapid-key", {
        params: { t: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const vapidPublicKey = data?.publicKey;

      if (!vapidPublicKey) {
        throw new Error("VAPID public key response is empty.");
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await api.post("/api/notifications/subscribe", {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error("[Push] subscribe failed:", error);
      return false;
    }
  }, [isDev]);

  const unsubscribe = useCallback(async () => {
    if (isDev) {
      toast("Mode development: notifikasi push dimatikan (mock).", {
        icon: "🔕",
      });
      setIsSubscribed(false);
      return true;
    }

    if (!isPushSupportedInBrowser()) {
      return false;
    }

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        if (endpoint) {
          try {
            await api.delete("/api/notifications/unsubscribe", {
              data: { endpoint },
            });
          } catch (error) {
            if (error?.response?.status !== 404) {
              throw error;
            }
          }
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("[Push] unsubscribe failed:", error);
      return false;
    }
  }, [isDev]);

  return {
    isSubscribed,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
  };
}
