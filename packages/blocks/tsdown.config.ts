import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/*/index.ts", "src/charts/*/index.ts", "src/emoji-icon-picker/data.ts"],
  format: ["esm"],
  dts: true,
  platform: "neutral",
});
