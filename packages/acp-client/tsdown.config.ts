import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", testing: "src/testing/index.ts" },
  format: ["esm"],
  platform: "browser",
  target: "es2022",
  dts: true,
  // The SDK stays a runtime dependency so the app bundler dedupes it and tree-shakes the schemas.
  external: [/^@agentclientprotocol\/sdk/, "zod"],
});
