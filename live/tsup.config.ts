import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["./src/start.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react"],
  injectStyle: true,
  ...options,
}));
