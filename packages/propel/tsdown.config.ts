import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/accordion/index.ts",
    "src/avatar/index.ts",
    "src/card/index.ts",
    "src/charts/*/index.ts",
    "src/combobox/index.ts",
    "src/command/index.ts",
    "src/dialog/index.ts",
    "src/emoji-icon-picker/index.ts",
    "src/icons/index.ts",
    "src/menu/index.ts",
    "src/popover/index.ts",
    "src/skeleton/index.ts",
    "src/switch/index.ts",
    "src/table/index.ts",
    "src/tabs/index.ts",
    "src/toast/index.ts",
    "src/tooltip/index.ts",
    "src/utils/index.ts",
  ],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  copy: ["src/styles"],
});
