import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  external: ["react", "@plane/types"],
  injectStyle: true,
  ...options,
}));
