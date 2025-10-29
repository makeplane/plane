import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "@/app/routes/utils/core";

export const coreSettingsRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // WORKSPACE SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
    route(workspaceRoute("settings"), "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"),
    route(
      workspaceRoute("settings/members"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"
    ),
    route(
      workspaceRoute("settings/billing"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"
    ),
    route(
      workspaceRoute("settings/integrations"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx"
    ),
    route(
      workspaceRoute("settings/imports"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx"
    ),
    route(
      workspaceRoute("settings/exports"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"
    ),
    route(
      workspaceRoute("settings/webhooks"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"
    ),
    route(
      workspaceRoute("settings/webhooks/:webhookId"),
      "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
    ),
  ]),

  // ========================================================================
  // ACCOUNT SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/account/layout.tsx", [
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
  ]),

  // ========================================================================
  // PROJECT SETTINGS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
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
    route(
      workspaceRoute("settings/projects/:projectId/automations"),
      "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
    ),
  ]),
] as const;
