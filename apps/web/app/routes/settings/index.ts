import { layout } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { accountSettingsRoutes } from "./account";
import { projectSettingsRoutes } from "./project";
import { workspaceSettingsRoutes } from "./workspace";

/**
 * SETTINGS ROUTES
 * All settings-related routes including workspace, account, and project settings
 */
export const settingsRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
    ...workspaceSettingsRoutes,
    ...accountSettingsRoutes,
    ...projectSettingsRoutes,
  ]),
];
