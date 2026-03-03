import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  format: ["esm"],
  dts: true,
  copy: ["src/styles"],
  exports: {
    customExports: (exports) => ({
      ...exports,
      "./styles.css": "./dist/styles/index.css",
      "./styles": "./dist/styles/index.css",
    }),
  },
  platform: "neutral",
});
