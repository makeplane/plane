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
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
  "NEXT_PUBLIC_ENABLE_SESSION_RECORDER",
  "NEXT_PUBLIC_SESSION_RECORDER_KEY",
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
        // Tiptap prosemirror compatibility
        "@tiptap/pm/state": "prosemirror-state",
        "@tiptap/pm/view": "prosemirror-view",
        "@tiptap/pm/model": "prosemirror-model",
        "@tiptap/pm/transform": "prosemirror-transform",
        "@tiptap/pm/keymap": "prosemirror-keymap",
        "@tiptap/pm/commands": "prosemirror-commands",
        "@tiptap/pm/schema-list": "prosemirror-schema-list",
        "@tiptap/pm/tables": "prosemirror-tables",
        // lodash compatibility
        lodash: "lodash-es",
        // Victory vendor compatibility
        "victory-vendor/d3-scale": "d3-scale",
        "victory-vendor/d3-shape": "d3-shape",
        "victory-vendor/d3-array": "d3-array",
        "victory-vendor/d3-interpolate": "d3-interpolate",
        "victory-vendor/d3-time": "d3-time",
        "victory-vendor/d3-color": "d3-color",
        "victory-vendor/d3-format": "d3-format",
        "victory-vendor/d3-time-format": "d3-time-format",
        "victory-vendor/d3-path": "d3-path",
        // swc helpers compatibility
        "@swc/helpers/_/_define_property": "@swc/helpers/esm/_define_property.js",
        "@swc/helpers/_/_ts_decorate": "@swc/helpers/esm/_ts_decorate.js",
        // Next.js compatibility shims used within web
        "next/image": path.resolve(__dirname, "app/compat/next/image.tsx"),
        "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
        "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
        "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
      },
      // When building inside Docker with pnpm workspaces, symlinks may be used
      // for workspace packages. Preserve them so Vite can resolve their exports
      // correctly instead of attempting to follow to source paths.
      preserveSymlinks: true,
      dedupe: ["react", "react-dom", "@headlessui/react"],
    },
    // No SSR-specific overrides needed; alias resolves to ESM build
  };
});
