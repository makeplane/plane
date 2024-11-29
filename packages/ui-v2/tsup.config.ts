import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: false,
  external: ["react"],
  injectStyle: true,
  treeshake: true,

  ...options,
}));
