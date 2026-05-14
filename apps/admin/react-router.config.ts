import type { Config } from "@react-router/dev/config";

const rawBasePath = process.env.VITE_ADMIN_BASE_PATH ?? "";

const basePath = rawBasePath === "/" || rawBasePath === "" ? "/" : rawBasePath.replace(/\/+$/, "");

export default {
  appDirectory: "app",
  basename: basePath,
  // Admin runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
