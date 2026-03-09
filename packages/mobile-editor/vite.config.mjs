import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const viteConfig = ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return defineConfig({
    define: {
      "process.env": env,
      "process.browser": true,
    },
    server: {
      port: 3001,
    },
    plugins: [tailwindcss(), react(), tsconfigPaths()],
    build: {
      chunkSizeWarningLimit: 10000,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          entryFileNames: "assets/mobile-editor.js",
        },
      },
    },
  });
};

export default viteConfig;
