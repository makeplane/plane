import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/consumer.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: false,
  exports: { legacy: true },
});
