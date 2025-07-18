import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  minify: true,
  splitting: true,
  treeshake: true,
  external: ["axios"],
});
