import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/consumer.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false,
  sourcemap: false,
  exports: { legacy: true },
});
