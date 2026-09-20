import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const browserFixtureDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(browserFixtureDir, "../..");

export default defineConfig({
  root: browserFixtureDir,
  define: {
    "process.env": JSON.stringify({}),
  },
  plugins: [tsconfigPaths({ projects: [path.join(webRoot, "tsconfig.json")] })],
  resolve: {
    alias: {
      "@": path.join(webRoot, "core"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: {
    host: "127.0.0.1",
    port: 4175,
    strictPort: true,
  },
});
