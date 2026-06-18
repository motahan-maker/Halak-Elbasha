import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tanstackStart(),
    tsConfigPaths(),
  ],
});
