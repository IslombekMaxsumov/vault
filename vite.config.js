import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps every asset path relative, so the build works on GitHub Pages
// (served from /<repo>/). Pages are hash routes (#/library), so a refresh on any
// page still loads index.html and the relative paths stay right.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
