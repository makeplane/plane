import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  external: ["@plane/types"],
});
