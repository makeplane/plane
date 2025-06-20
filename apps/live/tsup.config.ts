import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  target: "node18",
  sourcemap: true,
  splitting: false,
  bundle: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = {
      "@/core": "./src/core",
      "@/plane-live": "./src/ce"
    };
  },
  ...options,
}));
