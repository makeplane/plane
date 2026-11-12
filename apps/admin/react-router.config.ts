import type { Config } from "@react-router/dev/config";
import { joinUrlPath } from "@plane/utils";

const basePath = joinUrlPath(process.env.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";

export default {
  appDirectory: "app",
  basename: basePath,
  future: {
    // Without this Vite's dep scanner has no entries, so deps behind route chunks
    // are discovered mid-session, forcing a re-optimization + full page reload.
    unstable_optimizeDeps: true,
  },
  // Admin runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
