import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { initPushOnLogin } from "./services/notificationService.js";
import "./index.css";

// Register push notification service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-push.js").then(() => {
    initPushOnLogin();
  }).catch(() => {
    // Silent fail — push notifications just won't work
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(22, 33, 62, 0.95)",
            color: "#f0f0f5",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            backdropFilter: "blur(16px)",
            fontSize: "0.875rem",
            fontWeight: "500",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.35)",
            padding: "12px 20px",
          },
          success: {
            iconTheme: {
              primary: "#2ecc71",
              secondary: "#f0f0f5",
            },
            style: {
              border: "1px solid rgba(46, 204, 113, 0.25)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff4757",
              secondary: "#f0f0f5",
            },
            style: {
              border: "1px solid rgba(255, 71, 87, 0.25)",
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
