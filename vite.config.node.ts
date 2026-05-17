import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "src/client"),
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  build: {
    outDir: "dist/node",
    emptyOutDir: true,
    ssr: "src/server/entry.node.ts",
    rollupOptions: {
      output: {
        entryFileNames: "entry.node.js",
        format: "es",
      },
    },
  },
  ssr: {
    target: "node",
  },
});
