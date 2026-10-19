import { defineConfig } from "vitest/config";

// `npm test` at the repo root runs every workspace's tests; each workspace keeps its own config.
export default defineConfig({
  test: {
    projects: ["frontend", "backend"],
  },
});
