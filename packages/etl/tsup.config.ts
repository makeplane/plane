import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
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
    "src/clickup/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  ...options,
}));
