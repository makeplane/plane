import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  basename: process.env.NEXT_PUBLIC_SPACE_BASE_PATH,
  // Space runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
