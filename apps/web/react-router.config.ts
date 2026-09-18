import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  // Web runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
