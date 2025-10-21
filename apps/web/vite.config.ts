import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_API_BASE_PATH",
  "NEXT_PUBLIC_ADMIN_BASE_URL",
  "NEXT_PUBLIC_ADMIN_BASE_PATH",
  "NEXT_PUBLIC_SPACE_BASE_URL",
  "NEXT_PUBLIC_SPACE_BASE_PATH",
  "NEXT_PUBLIC_LIVE_BASE_URL",
  "NEXT_PUBLIC_LIVE_BASE_PATH",
  "NEXT_PUBLIC_WEB_BASE_URL",
  "NEXT_PUBLIC_WEB_BASE_PATH",
  "NEXT_PUBLIC_WEBSITE_URL",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
];

const publicEnv = PUBLIC_ENV_KEYS.reduce<Record<string, string>>((acc, key) => {
  acc[key] = process.env[key] ?? "";
  return acc;
}, {});

export default defineConfig(({ isSsrBuild }) => {
  const enableSsrBuild = process.env.WEB_ENABLE_SSR_BUILD === "true";

  return {
    server: {
      port: 3000,
    },
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
        "next/head": path.resolve(__dirname, "app/compat/next/head.tsx"),
        "next/image": path.resolve(__dirname, "app/compat/next/image.tsx"),
        "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
        "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
        "next/dynamic": path.resolve(__dirname, "app/compat/next/dynamic.tsx"),
      },
      preserveSymlinks: true,
      dedupe: ["react", "react-dom"],
    },
  };
});
