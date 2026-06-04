import path from "path";
import { defineConfig } from "vitest/config";

// Minimal unit-test setup for pure helpers/logic in apps/web.
// Node environment only — no DOM. Component tests are intentionally out of scope.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["{ce,core,helpers}/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./core"),
      "@/plane-web": path.resolve(__dirname, "./ce"),
    },
  },
});
