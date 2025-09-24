import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  external: ["react", "lodash", "mobx", "mobx-react", "intl-messageformat"],
  dts: true,
  clean: true,
  sourcemap: true,
});
