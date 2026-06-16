import path from "node:path";
import * as dotenv from "dotenv";
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

// Custom plugin to deny access to sensitive and SCM files in development
const secureServerPlugin = () => ({
  name: "secure-server-plugin",
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url ? new URL(req.url, "http://localhost").pathname.toLowerCase() : "";

      if (url.includes("vite.config.ts") || url.includes("vite.config.js")) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Access Denied: Configuration file exposure is blocked." }));
        return;
      }

      if (
        url.includes(".git") ||
        url.includes("cvs/") ||
        url.includes("cvs/entries") ||
        url.split("/").some((part: string) => part === ".git" || part === "cvs")
      ) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Access Denied: SCM directory exposure is blocked." }));
        return;
      }

      next();
    });
  }
});

export default defineConfig(() => ({
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    entries: [
      "app/**/*.{ts,tsx}",
      "core/**/*.{ts,tsx}",
      "ce/**/*.{ts,tsx}",
      "helpers/**/*.{ts,tsx}",
      "../../packages/ui/src/**/*.{ts,tsx}",
      "../../packages/editor/src/**/*.{ts,tsx}",
      "../../packages/i18n/src/**/*.{ts,tsx}",
      "../../packages/propel/src/**/*.{ts,tsx}",
      "../../packages/hooks/src/**/*.{ts,tsx}",
      "../../packages/utils/src/**/*.{ts,tsx}"
    ],
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-markdown",
      "swr",
      "mobx",
      "mobx-react",
      "mobx-utils",
      "axios",
      "lodash-es",
      "lodash-es/uniq",
      "lucide-react",
      "@headlessui/react",
      "next-themes",
      "@bprogress/core",
      "date-fns",
      "date-fns/differenceInCalendarDays",
      "clsx",
      "uuid",
      "cmdk",
      "react-hook-form",
      "react-popper",
      "react-color",
      "react-dropzone",
      "react-masonry-component",
      "recharts",
      "smooth-scroll-into-view-if-needed",
      "use-font-face-observer",
      "@react-pdf/renderer",
      "@atlaskit/pragmatic-drag-and-drop/combine",
      "@atlaskit/pragmatic-drag-and-drop/element/adapter",
      "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview",
      "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview",
      "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item",
      "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/cjs/closest-edge.js",
      "@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/adapter.js",
      "@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/combine.js",
      "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element",
      "extend"
    ]
  },
  plugins: [
    secureServerPlugin(),
    reactRouter(),
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
  ],
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
    host: "0.0.0.0",
    allowedHosts: true as const,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: [
        "**/apps/api/**",
        "**/apps/live/dist/**",
        "**/.git/**",
        "**/node_modules/.cache/**",
      ],
    },
    fs: {
      deny: [".env", ".env.*", ".git", "CVS", "vite.config.ts", "vite.config.js"],
    },
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
// Force Vite restart to clear cache
