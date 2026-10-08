import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mediaAssetsPlugin } from "./marketing-plugins/media-assets-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Same-origin API in dev so login works via localhost or the public IP
    // (browser "localhost" would otherwise point at the client machine).
    proxy: {
      "/auth": "http://127.0.0.1:8000",
      "/patients": "http://127.0.0.1:8000",
      "/sessions": "http://127.0.0.1:8000",
      "/agent": "http://127.0.0.1:8000",
      "/medicines": "http://127.0.0.1:8000",
      "/food-items": "http://127.0.0.1:8000",
      "/padoc": "http://127.0.0.1:8000",
      "/uploads": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/alert-rules": "http://127.0.0.1:8000",
      "/notifications": "http://127.0.0.1:8000",
      "/portal-access": "http://127.0.0.1:8000",
      "/patient-portal": "http://127.0.0.1:8000",
      "/api": "http://127.0.0.1:8000",
    },
  },
  plugins: [
    react(),
    mediaAssetsPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
}));
