import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
  injectStyle: true,
  splitting: true,
  treeshake: true,
  minify: true,
});
