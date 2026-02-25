import path from "node:path";
import * as dotenv from "@dotenvx/dotenvx";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

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
    host: "127.0.0.1",
    proxy: {
      // Mirror Caddy's production reverse proxy setup for local dev:
      // All requests go through Vite so relative redirects (e.g. /uploads/...)
      // resolve to the same origin and get proxied correctly.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: false, // preserve Host header for presigned URL signature consistency
      },
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: false,
      },
      "/uploads": {
        target: "http://localhost:9000",
        changeOrigin: false,
      },
    },
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
