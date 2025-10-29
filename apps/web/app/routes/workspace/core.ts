import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { workspaceRoute } from "./../utils";

export const coreWorkspaceRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // WORKSPACE DASHBOARD
  // ========================================================================
  route(":workspaceSlug", "./(all)/[workspaceSlug]/(projects)/page.tsx"),

  // ========================================================================
  // ACTIVE CYCLES
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/active-cycles/layout.tsx", [
    route(workspaceRoute("active-cycles"), "./(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx"),
  ]),

  // ========================================================================
  // ANALYTICS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/layout.tsx", [
    route(workspaceRoute("analytics/:tabId"), "./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx"),
  ]),

  // ========================================================================
  // BROWSE
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/browse/[workItem]/layout.tsx", [
    route(workspaceRoute("browse/:workItem"), "./(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx"),
  ]),

  // ========================================================================
  // DRAFTS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/drafts/layout.tsx", [
    route(workspaceRoute("drafts"), "./(all)/[workspaceSlug]/(projects)/drafts/page.tsx"),
  ]),

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/notifications/layout.tsx", [
    route(workspaceRoute("notifications"), "./(all)/[workspaceSlug]/(projects)/notifications/page.tsx"),
  ]),

  // ========================================================================
  // PROFILE
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/profile/[userId]/layout.tsx", [
    route(workspaceRoute("profile/:userId"), "./(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx"),
    route(
      workspaceRoute("profile/:userId/:profileViewId"),
      "./(all)/[workspaceSlug]/(projects)/profile/[userId]/[profileViewId]/page.tsx"
    ),
    route(
      workspaceRoute("profile/:userId/activity"),
      "./(all)/[workspaceSlug]/(projects)/profile/[userId]/activity/page.tsx"
    ),
  ]),

  // ========================================================================
  // STICKIES
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/stickies/layout.tsx", [
    route(workspaceRoute("stickies"), "./(all)/[workspaceSlug]/(projects)/stickies/page.tsx"),
  ]),

  // ========================================================================
  // WORKSPACE VIEWS
  // ========================================================================
  layout("./(all)/[workspaceSlug]/(projects)/workspace-views/layout.tsx", [
    route(workspaceRoute("workspace-views"), "./(all)/[workspaceSlug]/(projects)/workspace-views/page.tsx"),
    route(
      workspaceRoute("workspace-views/:globalViewId"),
      "./(all)/[workspaceSlug]/(projects)/workspace-views/[globalViewId]/page.tsx"
    ),
  ]),
] as const;
