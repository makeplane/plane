import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", start: "src/start.ts" },
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: true,
});
