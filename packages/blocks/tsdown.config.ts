import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/*/index.ts", "src/charts/*/index.ts"],
  format: ["esm"],
  dts: true,
  platform: "neutral",
});
