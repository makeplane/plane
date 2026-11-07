import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/claude": "src/bin/claude.ts",
    "bin/codex": "src/bin/codex.ts",
    "bin/deepseek": "src/bin/deepseek.ts",
    "bin/echo": "src/bin/echo.ts",
    "bin/gemini": "src/bin/gemini.ts",
    "bin/login": "src/bin/login.ts",
  },
  format: ["esm"],
  platform: "node",
  target: "node24",
  dts: true,
});
