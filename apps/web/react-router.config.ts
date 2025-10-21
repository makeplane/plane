import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  // Base path for the app (web)
  basename: process.env.NEXT_PUBLIC_WEB_BASE_PATH || "/",
  ssr: false,
} satisfies Config;
