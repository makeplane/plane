import type { Config } from "@react-router/dev/config";

const rawBase = process.env.VITE_SPACE_BASE_PATH ?? "";
const basePath = rawBase ? (rawBase.endsWith("/") ? rawBase : rawBase + "/") : "/";

export default {
  appDirectory: "app",
  basename: basePath,
  ssr: true,
} satisfies Config;
