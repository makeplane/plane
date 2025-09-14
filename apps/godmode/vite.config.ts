import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import commonjs from "vite-plugin-commonjs";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), commonjs()],
  define: {
    global: "globalThis",
    "process.env": JSON.stringify(process.env),
  },
  resolve: {
    alias: {
      process: "process/browser",
    },
  },
  optimizeDeps: {
    include: [
      "process",
      "@plane/constants",
      "@plane/services",
      "@plane/types",
      "@plane/hooks",
      "@plane/ui",
      "@plane/utils",
      "@plane/i18n",
    ],
  },
  build: {
    commonjsOptions: {
      include: [
        /node_modules/,
        /@plane\/constants/,
        /@plane\/services/,
        /@plane\/types/,
        /@plane\/hooks/,
        /@plane\/ui/,
        /@plane\/utils/,
        /@plane\/i18n/,
      ],
    },
  },
});
