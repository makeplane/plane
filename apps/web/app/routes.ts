import { index, layout, route, prefix } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  // Home
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]),

  // App Root (all)
  layout("./(all)/layout.tsx", [
    // Auth / invitations (leaf pages)
    route("sign-up", "./(all)/sign-up/page.tsx"),
    route("invitations", "./(all)/invitations/page.tsx"),
    route("workspace-invitations", "./(all)/workspace-invitations/page.tsx"),
    route("create-workspace", "./(all)/create-workspace/page.tsx"),
    route("installations/:provider", "./(all)/installations/[provider]/page.tsx"),
    route("accounts/forgot-password", "./(all)/accounts/forgot-password/page.tsx"),
    route("accounts/reset-password", "./(all)/accounts/reset-password/page.tsx"),
    route("accounts/set-password", "./(all)/accounts/set-password/page.tsx"),
    route("onboarding", "./(all)/onboarding/page.tsx"),

    // Profile
    layout("./(all)/profile/layout.tsx", [
      route("profile", "./(all)/profile/page.tsx"),
      route("profile/appearance", "./(all)/profile/appearance/page.tsx"),
      route("profile/notifications", "./(all)/profile/notifications/page.tsx"),
      route("profile/activity", "./(all)/profile/activity/page.tsx"),
      route("profile/security", "./(all)/profile/security/page.tsx"),
    ]),

    // Workspace scope
    route(":workspaceSlug", "./(all)/[workspaceSlug]/layout.tsx", [
      // Settings
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(settings)/settings/account/layout.tsx", [
          route("settings/account", "./(all)/[workspaceSlug]/(settings)/settings/account/page.tsx"),
          route("settings/account/activity", "./(all)/[workspaceSlug]/(settings)/settings/account/activity/page.tsx"),
          route(
            "settings/account/api-tokens",
            "./(all)/[workspaceSlug]/(settings)/settings/account/api-tokens/page.tsx"
          ),
          route(
            "settings/account/notifications",
            "./(all)/[workspaceSlug]/(settings)/settings/account/notifications/page.tsx"
          ),
          route(
            "settings/account/preferences",
            "./(all)/[workspaceSlug]/(settings)/settings/account/preferences/page.tsx"
          ),
          route("settings/account/security", "./(all)/[workspaceSlug]/(settings)/settings/account/security/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
          route("settings", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"),
          route("settings/members", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"),
          route("settings/billing", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"),
          route("settings/exports", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"),
          route("settings/imports", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx"),
          route(
            "settings/integrations",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx"
          ),
          route("settings/webhooks", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"),
          route(
            "settings/webhooks/:webhookId",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
          ),
        ]),
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          route("settings/projects", "./(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx"),
          route(
            "settings/projects/:projectId",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/page.tsx"
          ),
          route(
            "settings/projects/:projectId/automations",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
          ),
          route(
            "settings/projects/:projectId/estimates",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/estimates/page.tsx"
          ),
          route(
            "settings/projects/:projectId/features",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/page.tsx"
          ),
          route(
            "settings/projects/:projectId/labels",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/labels/page.tsx"
          ),
          route(
            "settings/projects/:projectId/members",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/members/page.tsx"
          ),
          route(
            "settings/projects/:projectId/states",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/page.tsx"
          ),
        ]),
      ]),

      // Projects scope
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // Top-level project sections
        index("./(all)/[workspaceSlug]/(projects)/page.tsx"),
        route("active-cycles", "./(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx"),
        route("drafts", "./(all)/[workspaceSlug]/(projects)/drafts/page.tsx"),
        route("notifications", "./(all)/[workspaceSlug]/(projects)/notifications/page.tsx"),
        route("stickies", "./(all)/[workspaceSlug]/(projects)/stickies/page.tsx"),
        route("workspace-views", "./(all)/[workspaceSlug]/(projects)/workspace-views/page.tsx"),
        route(
          "workspace-views/:globalViewId",
          "./(all)/[workspaceSlug]/(projects)/workspace-views/[globalViewId]/page.tsx"
        ),
        route("analytics/:tabId", "./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/layout.tsx", [
          index("./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx"),
        ]),
        route("browse/:workItem", "./(all)/[workspaceSlug]/(projects)/browse/[workItem]/layout.tsx", [
          index("./(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx"),
        ]),

        // Projects list
        layout("./(all)/[workspaceSlug]/(projects)/projects/(list)/layout.tsx", [
          route("projects", "./(all)/[workspaceSlug]/(projects)/projects/(list)/page.tsx"),
        ]),

        // Workspace-level Archives (not tied to a project)
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/layout.tsx", [
          route("projects/archives", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/page.tsx"),
        ]),

        // Project detail (attach :projectId at this layout level)
        route("projects/:projectId", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/layout.tsx", [
          // Intake
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/layout.tsx", [
            route("intake", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/page.tsx"),
          ]),

          // Cycles
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/layout.tsx", [
            route("cycles", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/page.tsx"),
          ]),
          route(
            "cycles/:cycleId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/layout.tsx",
            [
              index(
                "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/[cycleId]/page.tsx"
              ),
            ]
          ),

          // Issues
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/layout.tsx", [
            route("issues", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/page.tsx"),
            route(
              "issues/:issueId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(detail)/[issueId]/page.tsx"
            ),
          ]),

          // Modules
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/layout.tsx", [
            route(
              "modules",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/page.tsx"
            ),
          ]),
          route(
            "modules/:moduleId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/layout.tsx",
            [
              index(
                "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx"
              ),
            ]
          ),

          // Pages
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/layout.tsx", [
            route("pages", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/page.tsx"),
          ]),
          route(
            "pages/:pageId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/layout.tsx",
            [index("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/[pageId]/page.tsx")]
          ),

          // Views
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/layout.tsx", [
            route("views", "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx"),
          ]),
          route(
            "views/:viewId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/layout.tsx",
            [index("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/[viewId]/page.tsx")]
          ),

          // Archives under project
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/layout.tsx", [
            route(
              "archives/cycles",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/page.tsx"
            ),
          ]),
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/layout.tsx", [
            route(
              "archives/modules",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/page.tsx"
            ),
          ]),
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/layout.tsx", [
            route(
              "archives/issues",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/page.tsx"
            ),
          ]),
          route(
            "archives/issues/:archivedIssueId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/layout.tsx",
            [
              index(
                "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/[archivedIssueId]/page.tsx"
              ),
            ]
          ),
        ]),

        // Project profile pages
        route("profile/:userId", "./(all)/[workspaceSlug]/(projects)/profile/[userId]/layout.tsx", [
          index("./(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx"),
          route("activity", "./(all)/[workspaceSlug]/(projects)/profile/[userId]/activity/page.tsx"),
          route(":profileViewId", "./(all)/[workspaceSlug]/(projects)/profile/[userId]/[profileViewId]/page.tsx"),
        ]),
      ]),
    ]),
  ]),

  // 404 fallback
  route("*", "./components/404.tsx"),
] satisfies RouteConfig;
