import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/start.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false,
  sourcemap: false,
  exports: { legacy: true },
  platform: "node",
  copy: "assets",
});
