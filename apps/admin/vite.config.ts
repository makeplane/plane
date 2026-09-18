import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type ProxyOptions } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@plane/utils";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Backend targets for the dev-server proxy. Keeping the browser on the same
// origin lets the app work no matter which host/IP/hostname it is opened from.
const apiProxyTarget = process.env.API_PROXY_TARGET || "http://localhost:8001";
const liveProxyTarget = process.env.LIVE_PROXY_TARGET || "http://localhost:3100";

// Django builds its redirects from the configured WEB_URL/ADMIN_BASE_URL, so a
// browser that opened the app through another host (LAN IP, Tailscale name)
// would be sent to a host it cannot reach — after sign-out or a failed sign-in,
// for example. Rewrite those redirects back to the origin the browser actually
// used. Only the configured base URLs are rewritten, so unrelated redirects
// (OAuth providers and the like) pass through untouched.
const redirectBaseUrls = [process.env.VITE_WEB_BASE_URL, process.env.VITE_ADMIN_BASE_URL]
  .map((url) => (url || "").replace(/\/+$/, ""))
  .filter(Boolean);

const rewriteRedirectHost: NonNullable<ProxyOptions["configure"]> = (proxy, _options) => {
  proxy.on("proxyRes", (proxyRes, req) => {
    const location = proxyRes.headers.location;
    const host = req.headers.host;
    if (!host || typeof location !== "string") return;
    const base = redirectBaseUrls.find((url) => location.startsWith(url));
    if (!base) return;
    const scheme = (req.headers["x-forwarded-proto"] as string) || "http";
    proxyRes.headers.location = `${scheme}://${host}${location.slice(base.length)}`;
  });
};

const proxy = {
  // Keep the Host header the browser used: Django compares the Origin of unsafe
  // requests (login form POSTs) with the request host, so rewriting Host to
  // localhost makes every other IP/hostname the app is opened from fail with
  // "CSRF Verification Failed".
  "/api": { target: apiProxyTarget, changeOrigin: false, configure: rewriteRedirectHost },
  "/auth": { target: apiProxyTarget, changeOrigin: false, configure: rewriteRedirectHost },
  "/live": { target: liveProxyTarget, changeOrigin: true, ws: true },
};

// Hosts the dev server answers to. Vite rejects requests whose Host header is
// not listed here, which blocks opening the app by name from another machine
// (LAN hostnames, Tailscale MagicDNS names such as *.ts.net). IP addresses are
// always allowed. Add more names with DEV_ALLOWED_HOSTS="foo,bar".
const allowedHosts = [
  "localhost",
  ".localhost",
  ".local",
  ".ts.net",
  ...(process.env.DEV_ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
];

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
    allowedHosts,
    proxy,
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
