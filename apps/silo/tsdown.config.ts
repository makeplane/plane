import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/start.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  exports: true,
  platform: "node",
});
