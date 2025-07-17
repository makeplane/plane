import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "node22",
  outDir: "dist",
  env: {
    NODE_ENV: process.env.NODE_ENV || "development",
  },
});
