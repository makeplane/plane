import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/main.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    external: ["electron", "@todesktop/runtime", "electron-store"],
    clean: true,
  },
  {
    entry: ["src/preload.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    external: ["electron"],
    copy: ["src/setup.html"],
  },
  {
    entry: ["src/tab-bar-preload.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    external: ["electron"],
  },
  {
    entry: ["src/tab-bar.tsx"],
    outDir: "dist",
    format: "iife",
    platform: "browser",
    external: [],
    noExternal: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    inlineOnly: ["react", "react-dom", "scheduler"],
    name: "PlaneTabBar",
    globalName: "PlaneTabBar",
    output: {
      name: "PlaneTabBar",
    },
    rolldownOptions: {
      output: {
        name: "PlaneTabBar",
      },
    },
    copy: ["src/tab-bar.html"],
  },
]);
