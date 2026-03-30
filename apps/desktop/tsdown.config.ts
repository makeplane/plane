import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/main.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    deps: {
      neverBundle: ["electron", "@todesktop/runtime", "electron-store"],
    },
  },
  {
    entry: ["src/preload.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    deps: {
      neverBundle: ["electron"],
    },
    copy: ["src/setup.html"],
  },
  {
    entry: ["src/tab-bar-preload.ts"],
    outDir: "dist",
    format: "cjs",
    platform: "neutral",
    deps: {
      neverBundle: ["electron"],
    },
  },
  {
    entry: ["src/tab-bar.tsx"],
    outDir: "dist",
    format: "iife",
    platform: "browser",
    deps: {
      neverBundle: [],
      alwaysBundle: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
      onlyBundle: ["react", "react-dom", "scheduler"],
    },
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
