import type { Config } from "@react-router/dev/config";

const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
};

const basePath = normalizeBasePath(process.env.VITE_SPACE_BASE_PATH ?? "");

export default {
  appDirectory: "app",
  basename: basePath,
  ssr: true,
} satisfies Config;
