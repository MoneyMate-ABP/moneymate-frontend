import api from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Get current notification permission status.
 * Returns: "granted" | "denied" | "default"
 */
export function getPermissionStatus() {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from user.
 * Returns: "granted" | "denied" | "default"
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Subscribe to push notifications and send the subscription to the backend.
 * Returns the PushSubscription object, or null if failed.
 */
export async function subscribePushNotification() {
  if (!isPushSupported()) {
    console.warn("Push notifications not supported in this browser.");
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn("VAPID public key not configured. Skipping push subscription.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Send subscription to backend
    await sendSubscriptionToBackend(subscription);
    return subscription;
  } catch (err) {
    console.error("Failed to subscribe push notification:", err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribePushNotification() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error("Failed to unsubscribe:", err);
    return false;
  }
}

/**
 * Send push subscription to backend.
 * POST /api/notifications/subscribe
 */
async function sendSubscriptionToBackend(subscription) {
  try {
    await api.post("/api/notifications/subscribe", {
      subscription: subscription.toJSON(),
    });
  } catch (err) {
    // Backend endpoint may not exist yet — log but don't throw
    console.warn("Could not send subscription to backend:", err.message);
  }
}
