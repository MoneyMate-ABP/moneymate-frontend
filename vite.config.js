import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "Expense Tracker",
        short_name: "ExpTrack",
        theme_color: "#1a1a2e",
      },
    }),
  ],
});
