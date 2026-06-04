import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@plane/utils";

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

const basePath = joinUrlPath(process.env.VITE_SPACE_BASE_PATH ?? "", "/") ?? "/";

export default defineConfig(() => ({
  base: basePath,
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "swr",
      "mobx",
      "mobx-react",
      "axios",
      "lodash-es",
      "lucide-react",
      "@headlessui/react",
      "next-themes",
      "@bprogress/core"
    ]
  },
  plugins: [
    secureServerPlugin(),
    reactRouter(),
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
  ],
  resolve: {
    alias: {
      // Next.js compatibility shims used within space
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true as const,
    fs: {
      deny: [".env", ".env.*", ".git", "CVS", "vite.config.ts", "vite.config.js"],
    },
  },
}));
