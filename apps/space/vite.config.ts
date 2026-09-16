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
// Object storage (MinIO/S3) target. Attachments in spaces are uploaded straight
// from the browser with a presigned POST, so routing that traffic through this
// origin keeps every request on a single, already reachable port.
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

const basePath = joinUrlPath(process.env.VITE_SPACE_BASE_PATH ?? "", "/") ?? "/";

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
      // Next.js compatibility shims used within space
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: process.env.HOST || "127.0.0.1",
    proxy,
  },
}));
