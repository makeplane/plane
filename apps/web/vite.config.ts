import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Backend targets for the dev-server proxy. Keeping the browser on the same
// origin lets the app work no matter which host/IP/hostname it is opened from.
const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:8001";
const liveProxyTarget = process.env.LIVE_PROXY_TARGET || "http://localhost:3100";
// Object storage (MinIO/S3) target. Assets are uploaded straight from the
// browser with a presigned POST, so routing that traffic through this origin
// means the browser only ever needs to reach the port the app is served on —
// no second port, no CORS hop, no cross-origin firewall/proxy surprises.
const storageProxyTarget = process.env.STORAGE_PROXY_TARGET || "http://localhost:9000";
const proxy = {
  // Keep the Host header the browser used: Django compares the Origin of unsafe
  // requests (login form POSTs) with the request host, so rewriting Host to
  // localhost makes every other IP/hostname the app is opened from fail with
  // "CSRF Verification Failed".
  "/api": { target: apiProxyTarget, changeOrigin: false },
  "/auth": { target: apiProxyTarget, changeOrigin: false },
  // Same reason for keeping the Host header: presigned S3 GET urls are signed
  // against the browser-visible host, so rewriting it invalidates the signature.
  "/uploads": { target: storageProxyTarget, changeOrigin: false },
  "/live": { target: liveProxyTarget, changeOrigin: true, ws: true },
};

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

export default defineConfig(() => ({
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      // Next.js compatibility shims used within web
      "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
      "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: {
    host: process.env.HOST || "127.0.0.1",
    proxy,
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
