import { layout } from "@react-router/dev/routes";
import { coreProjectSettingsRoutes } from "./core";
import { extendedProjectSettingsRoutes } from "./extended";

/**
 * PROJECT SETTINGS ROUTES
 * All project-related settings routes
 */
export const projectSettingsRoutes = [
  // ========================================================================
  // PROJECT SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
    ...coreProjectSettingsRoutes,
    ...extendedProjectSettingsRoutes,
  ]),
] as const;

