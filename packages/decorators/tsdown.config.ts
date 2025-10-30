import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  exports: true,
  dts: true,
  clean: true,
  sourcemap: false,
});
