import { route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "../../utils";

export const coreWorkspaceSettingsRoutes: RouteConfigEntry[] = [
  route(workspaceRoute("settings"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"),
  route(workspaceRoute("settings/members"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"),
  route(workspaceRoute("settings/billing"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"),
  route(
    workspaceRoute("settings/integrations"),
    "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx"
  ),
  route(workspaceRoute("settings/imports"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx"),
  route(workspaceRoute("settings/exports"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"),
  route(
    workspaceRoute("settings/webhooks"),
    "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"
  ),
  route(
    workspaceRoute("settings/webhooks/:webhookId"),
    "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
  ),
] as const;
