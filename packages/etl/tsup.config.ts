import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/parser/index.ts",
    "src/asana/index.ts",
    "src/core/index.ts",
    "src/github/index.ts",
    "src/gitlab/index.ts",
    "src/jira/index.ts",
    "src/jira-server/index.ts",
    "src/linear/index.ts",
    "src/slack/index.ts",
    "src/flatfile/index.ts",
    "src/sentry/index.ts",
    "src/clickup/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  splitting: true,
  treeshake: true,
});
