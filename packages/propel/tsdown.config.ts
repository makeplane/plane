import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/avatar/index.ts",
    "src/charts/index.ts",
    "src/dialog/index.ts",
    "src/menu/index.ts",
    "src/table/index.ts",
    "src/tabs/index.ts",
    "src/popover/index.ts",
    "src/command/index.ts",
    "src/combobox/index.ts",
    "src/tooltip/index.ts",
    "src/card/index.ts",
    "src/switch/index.ts",
  ],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
});
