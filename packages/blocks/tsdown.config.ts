import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/utils/index.ts"],
  format: ["esm"],
  dts: true,
  copy: ["src/styles"],
  exports: {
    customExports: (exports) => ({
      ...exports,
      ".": {
        ...(typeof exports["."] === "string" ? { import: exports["."] } : ((exports["."] as object) ?? {})),
        style: "./dist/styles/index.css",
      },
    }),
  },
  platform: "neutral",
});
