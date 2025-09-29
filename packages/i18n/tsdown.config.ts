import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  external: ["react", "lodash-es", "mobx", "mobx-react", "intl-messageformat"],
  sourcemap: true,
});
