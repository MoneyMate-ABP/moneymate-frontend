self.addEventListener("push", (event) => {
  let payload = {
    title: "Budget hari ini siap!",
    body: "Budget efektif kamu hari ini sudah tersedia.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        icon: parsed.icon || payload.icon,
        badge: parsed.badge || payload.badge,
      };
    }
  } catch {
    // Keep fallback payload
  }

  event.waitUntil(self.registration.showNotification(payload.title, payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            if ("navigate" in client) {
              client.navigate(urlToOpen);
            }
            return client.focus();
          }
        }

        return self.clients.openWindow(urlToOpen);
      }),
  );
});
