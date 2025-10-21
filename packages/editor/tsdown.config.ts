import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  copy: ["src/styles"],
  exports: {
    customExports: (out) => ({
      ...out,
      "./styles.css": "./dist/styles/index.css",
      "./styles": "./dist/styles/index.css",
    }),
  },
  dts: true,
  clean: true,
});
