import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Lovable (and dev) serve from the domain root ("/"); the GitHub Pages
  // build serves from the project subpath. The workflow sets GITHUB_PAGES=true
  // so only that build gets the "/runi-exchange/" base — Lovable stays on "/".
  base: process.env.GITHUB_PAGES === "true" ? "/runi-exchange/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
