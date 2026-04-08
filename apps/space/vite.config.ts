import { createRequire } from "node:module";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { joinUrlPath } from "@plane/utils";

const require = createRequire(import.meta.url);

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

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
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@atlaskit/pragmatic-drag-and-drop/combine":
        require.resolve("@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/combine.js"),
      "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element":
        require.resolve("@atlaskit/pragmatic-drag-and-drop-auto-scroll/dist/esm/entry-point/element.js"),
      "@atlaskit/pragmatic-drag-and-drop/element/adapter":
        require.resolve("@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element/adapter.js"),
      "@atlaskit/pragmatic-drag-and-drop/private/get-element-from-point-without-honey-pot":
        require.resolve("@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/private/get-element-from-point-without-honey-pot.js"),
      // Next.js compatibility shims used within space
      "next/link": path.resolve(import.meta.dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(import.meta.dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
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
    ],
  },
}));
