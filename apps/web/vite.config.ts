import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

// Fall back to VERCEL_GIT_COMMIT_SHA so Sentry release tracking works on Vercel
viteEnv.VITE_APP_VERSION ||= process.env.VERCEL_GIT_COMMIT_SHA ?? "";

/**
 * Stamps public/sw.js with the current app version so the browser
 * detects a new service worker on every deployment.
 */
function swVersionPlugin(): PluginOption {
  let outDir: string;
  return {
    name: "sw-version",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (!outDir) return;
      const swPath = path.resolve(outDir, "sw.js");
      if (!fs.existsSync(swPath)) return;
      const content = fs.readFileSync(swPath, "utf-8");
      const swVersionPattern = /^\/\/\s*@sw-version.*$/m;
      if (!swVersionPattern.test(content)) {
        throw new Error(
          `swVersionPlugin: "@sw-version" marker not found in ${swPath}; service worker version was not stamped.`
        );
      }
      const version = viteEnv.VITE_APP_VERSION || Date.now().toString();
      fs.writeFileSync(swPath, content.replace(swVersionPattern, `// @sw-version ${version}`));
    },
  };
}

const plugins: PluginOption[] = [
  tailwindcss(),
  reactRouter(),
  tsconfigPaths({
    projects: [
      path.resolve(import.meta.dirname, "tsconfig.json"),
      // Root tsconfig references all workspace packages, enabling path alias
      // resolution when Vite consumes source files via "development" export condition.
      path.resolve(import.meta.dirname, "../../tsconfig.json"),
    ],
  }),
  swVersionPlugin(),
];

if (process.env.SENTRY_AUTH_TOKEN) {
  plugins.push(
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "plane-hq",
      project: "plane-web",
      release: {
        name: viteEnv.VITE_APP_VERSION || undefined,
        deploy: viteEnv.VITE_SENTRY_ENVIRONMENT ? { env: viteEnv.VITE_SENTRY_ENVIRONMENT } : undefined,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ["build/client/**/*.map", "build/server/**/*.map"],
      },
    })
  );
}

export default defineConfig({
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    sourcemap: "hidden",
    assetsInlineLimit: 0,
  },
  plugins,
  resolve: {
    alias: {
      // Next.js compatibility shims used within web
      "next/link": path.resolve(import.meta.dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(import.meta.dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: {
    host: "127.0.0.1",
    warmup: {
      clientFiles: ["./app/root.tsx", "./app/entry.client.tsx", "./styles/globals.css"],
    },
  },
  css: {
    devSourcemap: false,
  },
  optimizeDeps: {
    exclude: ["@plane/tailwindcss"],
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "mobx",
      "mobx-react",
      "mobx-utils",
      "react-router",
      "clsx",
      "lucide-react",
      "swr",
      "axios",
      "lodash-es",
      "date-fns",
      "uuid",
      "@headlessui/react",
      "react-hook-form",
      "fuse.js",
      "cmdk",
    ],
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
});
