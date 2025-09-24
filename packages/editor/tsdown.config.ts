import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  copy: ["src/styles"],
  dts: true,
  clean: true,
  sourcemap: true,
});
