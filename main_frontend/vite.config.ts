import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/search": { target: "http://localhost:8000", changeOrigin: true },
      "/play": { target: "http://localhost:8000", changeOrigin: true },
      "/stream": { target: "http://localhost:8000", changeOrigin: true },
      "/songs": { target: "http://localhost:8000", changeOrigin: true },
      "/upload": { target: "http://localhost:8000", changeOrigin: true },
      "/library": { target: "http://localhost:8000", changeOrigin: true },
      "/auth": { target: "http://localhost:8000", changeOrigin: true },
      "/me": { target: "http://localhost:8000", changeOrigin: true },
      "/create-room": { target: "http://localhost:8000", changeOrigin: true },
      "/room": { target: "http://localhost:8000", changeOrigin: true },
      "/ws": { target: "ws://localhost:8000", ws: true, changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
