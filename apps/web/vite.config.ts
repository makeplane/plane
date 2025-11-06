import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const PUBLIC_ENV_KEYS = [
  "ENABLE_EXPERIMENTAL_COREPACK",
  "NEXT_PUBLIC_ADMIN_BASE_PATH",
  "NEXT_PUBLIC_ADMIN_BASE_URL",
  "NEXT_PUBLIC_API_BASE_PATH",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_CRISP_ID",
  "NEXT_PUBLIC_ENABLE_SESSION_RECORDER",
  "NEXT_PUBLIC_EXTRA_IMAGE_DOMAINS",
  "NEXT_PUBLIC_LIVE_BASE_PATH",
  "NEXT_PUBLIC_LIVE_BASE_URL",
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
  "NEXT_PUBLIC_POSTHOG_DEBUG",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_SESSION_RECORDER_KEY",
  "NEXT_PUBLIC_SPACE_BASE_PATH",
  "NEXT_PUBLIC_SPACE_BASE_URL",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "NEXT_PUBLIC_WEB_BASE_PATH",
  "NEXT_PUBLIC_WEB_BASE_URL",
  "NEXT_PUBLIC_WEBSITE_URL",
  "NODE_ENV",
];

const publicEnv = PUBLIC_ENV_KEYS.reduce<Record<string, string>>((acc, key) => {
  acc[key] = process.env[key] ?? "";
  return acc;
}, {});

export default defineConfig(({ isSsrBuild }) => {
  // Only produce an SSR bundle when explicitly enabled.
  // For static deployments (default), we skip the server build entirely.
  const enableSsrBuild = process.env.WEB_ENABLE_SSR_BUILD === "true";

  return {
    define: {
      "process.env": JSON.stringify(publicEnv),
    },
    build: {
      assetsInlineLimit: 0,
      rollupOptions:
        isSsrBuild && enableSsrBuild
          ? {
              input: path.resolve(__dirname, "server/app.ts"),
            }
          : undefined,
    },
    plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
    resolve: {
      alias: {
        // Next.js compatibility shims used within web
        "next/image": path.resolve(__dirname, "app/compat/next/image.tsx"),
        "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
        "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
        "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
      },
      dedupe: ["react", "react-dom", "@headlessui/react"],
    },
    // No SSR-specific overrides needed; alias resolves to ESM build
  };
});
