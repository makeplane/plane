import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  format: ["esm"],
  dts: true,
  copy: ["src/styles"],
  exports: {
    devExports: "development",
    customExports: (exports) => {
      const dotExport = typeof exports["."] === "string" ? { import: exports["."] } : ((exports["."] as object) ?? {});
      return {
        ...exports,
        ".": {
          style: "./dist/styles/index.css",
          ...dotExport,
        },
      };
    },
  },
  platform: "neutral",
});
