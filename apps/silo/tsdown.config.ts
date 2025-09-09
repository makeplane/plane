import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/start.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
