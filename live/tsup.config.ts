import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/server.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  external: ["react"],
  injectStyle: true,
  ...options,
}));
