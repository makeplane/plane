import fs from "node:fs";
import path from "node:path";
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  appDirectory: "app",
  // If running on Vercel, use the Vercel preset
  presets: process.env.VERCEL === "1" ? [vercelPreset()] : [],
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
  },
  // Web runs as a client-side app; build a static client bundle only
  ssr: false,
  buildEnd({ reactRouterConfig, viteConfig }) {
    const outDir = path.resolve(viteConfig.root, reactRouterConfig.buildDirectory, "client");
    const swPath = path.resolve(outDir, "sw.js");
    if (!fs.existsSync(swPath)) return;
    const content = fs.readFileSync(swPath, "utf-8");
    const swVersionPattern = /^\/\/\s*@sw-version.*$/m;
    if (!swVersionPattern.test(content)) {
      throw new Error(`buildEnd: "@sw-version" marker not found in ${swPath}; service worker version was not stamped.`);
    }
    const version = viteConfig.define?.["process.env"]
      ? JSON.parse(viteConfig.define["process.env"]).VITE_APP_VERSION
      : "";
    fs.writeFileSync(swPath, content.replace(swVersionPattern, `// @sw-version ${version || Date.now().toString()}`));
  },
} satisfies Config;
