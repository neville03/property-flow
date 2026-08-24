import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    // Resolve the "@/*" path alias from tsconfig.
    tsConfigPaths(),
    // TanStack Start. `server.entry` points at our SSR error-handling wrapper.
    tanstackStart({
      server: { entry: "./src/server.ts" },
    }),
    // React Fast Refresh — Start requires this to be added explicitly.
    viteReact(),
    // Tailwind CSS v4.
    tailwindcss(),
  ],
  // Keep a single copy of React across the dependency graph.
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
