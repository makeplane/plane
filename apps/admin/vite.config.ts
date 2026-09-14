import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@plane/utils";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Backend targets for the dev-server proxy. Keeping the browser on the same
// origin lets the app work no matter which host/IP/hostname it is opened from.
const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:8001";
const liveProxyTarget = process.env.LIVE_PROXY_TARGET || "http://localhost:3100";
const proxy = {
  "/api": { target: apiProxyTarget, changeOrigin: true },
  "/auth": { target: apiProxyTarget, changeOrigin: true },
  "/live": { target: liveProxyTarget, changeOrigin: true, ws: true },
};

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

const basePath = joinUrlPath(process.env.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";

export default defineConfig(() => ({
  base: basePath,
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      // Next.js compatibility shims used within admin
      "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: process.env.HOST || "127.0.0.1",
    proxy,
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
