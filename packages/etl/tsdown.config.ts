import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/asana/index.ts",
    "src/confluence/index.ts",
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
    "src/bitbucket/index.ts",
  ],
  format: ["esm"],
  dts: true,
  exports: true,
  platform: "neutral",
});
