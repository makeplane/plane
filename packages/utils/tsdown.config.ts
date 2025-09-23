import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  external: ["lodash/*"],
  dts: true,
  clean: true,
});
