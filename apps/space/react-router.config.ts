import type { Config } from "@react-router/dev/config";
import { joinUrlPath } from "@plane/utils";

const basePath = joinUrlPath(process.env.NEXT_PUBLIC_SPACE_BASE_PATH ?? "", "/") ?? "/";

export default {
  appDirectory: "app",
  basename: basePath,
  ssr: true,
} satisfies Config;
