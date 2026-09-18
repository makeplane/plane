import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/components/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./core"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
    },
  },
});
