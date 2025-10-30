import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "../../utils";

export const coreProjectSettingsRoutes: RouteConfigEntry[] = [
  route(workspaceRoute("settings/projects"), "./(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx"),
  route(
    workspaceRoute("settings/projects/:projectId"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/page.tsx"
  ),
  route(
    workspaceRoute("settings/projects/:projectId/members"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/members/page.tsx"
  ),
  route(
    workspaceRoute("settings/projects/:projectId/features"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/page.tsx"
  ),
  route(
    workspaceRoute("settings/projects/:projectId/states"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/page.tsx"
  ),
  route(
    workspaceRoute("settings/projects/:projectId/labels"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/labels/page.tsx"
  ),
  route(
    workspaceRoute("settings/projects/:projectId/estimates"),
    "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/estimates/page.tsx"
  ),
  // Automations
  layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/layout.tsx", [
    route(
      workspaceRoute("settings/projects/:projectId/automations"),
      "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
    ),
  ]),
] as const;
