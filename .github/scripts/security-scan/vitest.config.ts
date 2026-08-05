import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["**/*.ts"],
      // run.ts is CLI wiring and lib/report-*.ts are thin GitHub/filesystem I/O;
      // their logic lives in the modules they call, which are covered here.
      exclude: ["tests/**", "vitest.config.ts", "run.ts", "lib/report-*.ts"],
      // The text table omits fully-covered files; the summary totals below it
      // still account for every file in the scoped set.
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
