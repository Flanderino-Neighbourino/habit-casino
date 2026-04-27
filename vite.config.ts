import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  // For dev (`npm run dev`) the app is served at the root: http://localhost:3003/
  // For prod (`npm run build`) it's served from a GitHub Pages sub-path:
  // https://<user>.github.io/habit-casino/
  base: command === "build" ? "/habit-casino/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Habit Casino",
        short_name: "Casino",
        description: "Slot-machine psychology for habit tracking",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: {
    port: 3003,
    host: "0.0.0.0",
    strictPort: true,
  },
  preview: {
    port: 3003,
    host: "0.0.0.0",
    strictPort: true,
  },
}));
