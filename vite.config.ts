import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/schema": "http://localhost:8080",
      "/render": "http://localhost:8080",
    },
  },
});
