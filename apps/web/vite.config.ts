import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Automatically expose all environment variables prefixed with NEXT_PUBLIC_
const publicEnv = Object.keys(process.env)
  .filter((key) => key.startsWith("NEXT_PUBLIC_"))
  .reduce<Record<string, string>>((acc, key) => {
    acc[key] = process.env[key] ?? "";
    return acc;
  }, {});

export default defineConfig(() => ({
  define: {
    "process.env": JSON.stringify(publicEnv),
  },
  build: {
    assetsInlineLimit: 0,
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
}));
