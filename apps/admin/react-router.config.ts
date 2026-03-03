import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { joinUrlPath } from "@plane/utils";

const basePath = joinUrlPath(process.env.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";

export default {
  appDirectory: "app",
  basename: basePath,
  // If running on Vercel, use the Vercel preset
  presets: process.env.VERCEL === "1" ? [vercelPreset()] : [],
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
  },
  // Admin runs as a client-side app; build a static client bundle only
  ssr: false,
} satisfies Config;
