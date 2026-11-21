import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  copy: ["src/locales"],
  platform: "neutral",
  exports: true,
});
