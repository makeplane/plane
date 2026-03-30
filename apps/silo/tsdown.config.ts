import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/start.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  exports: { legacy: true },
  deps: {
    alwaysBundle: [/^bluebird$/],
    onlyBundle: false,
  },
  platform: "node",
});
