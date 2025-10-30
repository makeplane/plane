import { layout } from "@react-router/dev/routes";
import { coreAccountSettingsRoutes } from "./core";
import { extendedAccountSettingsRoutes } from "./extended";

/**
 * ACCOUNT SETTINGS ROUTES
 * All account-related settings routes
 */
export const accountSettingsRoutes = [
  // ========================================================================
  // ACCOUNT SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/account/layout.tsx", [
    ...coreAccountSettingsRoutes,
    ...extendedAccountSettingsRoutes,
  ]),
] as const;
