import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@plane/constants": fileURLToPath(new URL("../constants/src/index.ts", import.meta.url)),
      "@plane/types": fileURLToPath(new URL("../types/src/index.ts", import.meta.url)),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
