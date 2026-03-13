import type { Config } from "@react-router/dev/config";

const rawBase = process.env.VITE_ADMIN_BASE_PATH ?? "";
const basePath = rawBase ? (rawBase.endsWith("/") ? rawBase : rawBase + "/") : "/";

export default {
  appDirectory: "app",
  basename: basePath,
  // Admin runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
