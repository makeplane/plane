import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/start.ts"],
  format: ["cjs"],
  dts: true,
  clean: false,
  sourcemap: true,
  ...options,
}));
