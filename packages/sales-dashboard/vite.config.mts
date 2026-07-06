import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      "@metalnest/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
    },
  },
});
