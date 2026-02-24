import type { Config } from "@react-router/dev/config";
import { joinUrlPath } from "@plane/utils";

const basePath = (joinUrlPath(process.env.VITE_WEB_BASE_PATH ?? "") ?? "/").replace(/\/$/, "") || "/";

export default {
  appDirectory: "app",
  basename: basePath,
  // Web runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
