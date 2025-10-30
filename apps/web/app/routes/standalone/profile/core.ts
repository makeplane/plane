import { route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const coreProfileRoutes: RouteConfigEntry[] = [
  route("profile", "./(all)/profile/page.tsx"),
  route("profile/activity", "./(all)/profile/activity/page.tsx"),
  route("profile/appearance", "./(all)/profile/appearance/page.tsx"),
  route("profile/notifications", "./(all)/profile/notifications/page.tsx"),
  route("profile/security", "./(all)/profile/security/page.tsx"),
] as const;
