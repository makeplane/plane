import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  clean: false,
  sourcemap: true,
  copy: ["src/styles"],
});
