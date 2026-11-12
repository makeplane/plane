import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "app",
  future: {
    // Without this Vite's dep scanner has no entries, so deps behind route chunks
    // are discovered mid-session, forcing a re-optimization + full page reload.
    unstable_optimizeDeps: true,
  },
  // Web runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
