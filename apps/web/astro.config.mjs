import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  // `/e.html` se sirve en `/e` sin redirección a `/e/`.
  build: { format: "file" },
  // CSP con hashes calculados en el build: solo scripts y estilos propios.
  security: { csp: true },
  vite: {
    plugins: [tailwindcss()],
    // En desarrollo, la API la sirve `wrangler dev` (apps/api) en el puerto 8787.
    server: { proxy: { "/api": "http://localhost:8787" } },
  },
});
