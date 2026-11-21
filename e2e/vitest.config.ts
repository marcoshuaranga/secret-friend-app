import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "conventions",
          include: ["specs/feature-conventions.spec.ts"],
        },
      },
      {
        test: {
          name: "e2e",
          include: ["specs/e2e/**/*.spec.ts"],
          setupFiles: ["support/setup.ts"],
          testTimeout: 30_000,
          hookTimeout: 60_000,
          // Scenarios share one deployed app; keep each file's scenarios in order.
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
