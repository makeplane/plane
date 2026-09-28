import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Expose VITE_* vars to `process.env` in app code (see @plane/constants).
function viteClientEnv(mode: string): Record<string, string> {
  const env = loadEnv(mode, __dirname, "");
  return Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith("VITE_")));
}

export default defineConfig(({ mode }) => {
  const isDashboardQa = mode === "dashboard-qa";
  const qaApiTarget = process.env.DASHBOARD_QA_PROXY_TARGET ?? "http://127.0.0.1:8100";

  return {
    define: {
      "process.env": JSON.stringify(viteClientEnv(mode)),
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
      // dashboard-qa: same-origin proxy to :8100 so sign-in form POST keeps CSRF cookies.
      host: isDashboardQa ? "localhost" : "127.0.0.1",
      proxy: isDashboardQa
        ? {
            "/api": { target: qaApiTarget, changeOrigin: true, secure: false },
            "/auth": { target: qaApiTarget, changeOrigin: true, secure: false },
          }
        : undefined,
    },
    // No SSR-specific overrides needed; alias resolves to ESM build
  };
});
