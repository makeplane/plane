import { route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "../../utils";

export const coreAccountSettingsRoutes: RouteConfigEntry[] = [
  route(workspaceRoute("settings/account"), "./(all)/[workspaceSlug]/(settings)/settings/account/page.tsx"),
  route(
    workspaceRoute("settings/account/activity"),
    "./(all)/[workspaceSlug]/(settings)/settings/account/activity/page.tsx"
  ),
  route(
    workspaceRoute("settings/account/preferences"),
    "./(all)/[workspaceSlug]/(settings)/settings/account/preferences/page.tsx"
  ),
  route(
    workspaceRoute("settings/account/notifications"),
    "./(all)/[workspaceSlug]/(settings)/settings/account/notifications/page.tsx"
  ),
  route(
    workspaceRoute("settings/account/security"),
    "./(all)/[workspaceSlug]/(settings)/settings/account/security/page.tsx"
  ),
  route(
    workspaceRoute("settings/account/api-tokens"),
    "./(all)/[workspaceSlug]/(settings)/settings/account/api-tokens/page.tsx"
  ),
] as const;
