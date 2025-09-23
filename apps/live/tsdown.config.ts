import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["esm"],
  clean: true,
  sourcemap: true,
});
