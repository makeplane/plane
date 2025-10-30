import { layout } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { coreProfileRoutes } from "./core";
import { extendedProfileRoutes } from "./extended";

export const profileRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // PROFILE SETTINGS (Standalone, outside workspace)
  // ========================================================================
  layout("./(all)/profile/layout.tsx", [...coreProfileRoutes, ...extendedProfileRoutes]),
] as const;
