import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.GITHUB_PAGES_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pocus-icon.svg"],
      manifest: {
        name: "CritSono: POCUS Logbook",
        short_name: "CritSono",
        description: "An offline-first personal point-of-care ultrasound logbook.",
        theme_color: "#163b44",
        background_color: "#f3f6f5",
        display: "standalone",
        start_url: base,
        icons: [
          {
            src: "pocus-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,txt,webmanifest}"],
      },
    }),
  ],
});
