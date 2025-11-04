import { layout } from "@react-router/dev/routes";
import { coreWorkspaceSettingsRoutes } from "./core";
import { extendedWorkspaceSettingsRoutes } from "./extended";

/**
 * WORKSPACE SETTINGS ROUTES
 * All workspace-related settings routes
 */
export const workspaceSettingsRoutes = [
  // ========================================================================
  // WORKSPACE SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
    ...coreWorkspaceSettingsRoutes,
    ...extendedWorkspaceSettingsRoutes,
  ]),
] as const;
