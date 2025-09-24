import { defineConfig } from "tsdown";

export default defineConfig({
  onSuccess: "node --env-file=.env dist/start.js",
  entry: ["src/start.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
});
