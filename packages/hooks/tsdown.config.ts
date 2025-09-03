import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  external: ["react", "react-dom"],
  dts: true,
  sourcemap: true,
  clean: true,
});
