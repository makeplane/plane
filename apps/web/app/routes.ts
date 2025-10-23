import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  // ============================================================================
  // HOME ROUTE - Sign-in at root
  // ============================================================================
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]), // ✅

  // ============================================================================
  // ALL APP ROUTES - Under (all) layout for CSS imports and preloading
  // ============================================================================
  layout("./(all)/layout.tsx", [
    // ==========================================================================
    // WORKSPACE-SCOPED ROUTES - All under /:workspaceSlug
    // ==========================================================================
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      // ========================================================================
      // PROJECTS SECTION - With sidebar, auth wrapper, and command palette
      // ========================================================================
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // Workspace dashboard/home
        route(":workspaceSlug", "./(all)/[workspaceSlug]/(projects)/page.tsx"), // ✅

        // Active Cycles
        layout("./(all)/[workspaceSlug]/(projects)/active-cycles/layout.tsx", [
          route(":workspaceSlug/active-cycles", "./(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx"),
        ]),

        // Analytics
        layout("./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/layout.tsx", [
          route(":workspaceSlug/analytics/:tabId", "./(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx"),
        ]),

        // Browse
        layout("./(all)/[workspaceSlug]/(projects)/browse/[workItem]/layout.tsx", [
          route(":workspaceSlug/browse/:workItem", "./(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx"), // ✅
        ]),

        // Drafts
        layout("./(all)/[workspaceSlug]/(projects)/drafts/layout.tsx", [
          route(":workspaceSlug/drafts", "./(all)/[workspaceSlug]/(projects)/drafts/page.tsx"), // ✅
        ]),

        // Notifications
        layout("./(all)/[workspaceSlug]/(projects)/notifications/layout.tsx", [
          route(":workspaceSlug/notifications", "./(all)/[workspaceSlug]/(projects)/notifications/page.tsx"), // ✅
        ]),

        // Profile (within workspace context)
        layout("./(all)/[workspaceSlug]/(projects)/profile/[userId]/layout.tsx", [
          route(":workspaceSlug/profile/:userId", "./(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx"), // ✅
          route(
            ":workspaceSlug/profile/:userId/:profileViewId",
            "./(all)/[workspaceSlug]/(projects)/profile/[userId]/[profileViewId]/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/profile/:userId/activity",
            "./(all)/[workspaceSlug]/(projects)/profile/[userId]/activity/page.tsx"
          ),
        ]), // ✅

        // Stickies
        layout("./(all)/[workspaceSlug]/(projects)/stickies/layout.tsx", [
          route(":workspaceSlug/stickies", "./(all)/[workspaceSlug]/(projects)/stickies/page.tsx"),
        ]),

        // Workspace Views
        layout("./(all)/[workspaceSlug]/(projects)/workspace-views/layout.tsx", [
          route(":workspaceSlug/workspace-views", "./(all)/[workspaceSlug]/(projects)/workspace-views/page.tsx"),
          route(
            ":workspaceSlug/workspace-views/:globalViewId",
            "./(all)/[workspaceSlug]/(projects)/workspace-views/[globalViewId]/page.tsx"
          ),
        ]), // ✅

        // ======================================================================
        // PROJECTS - List and Detail Views
        // ======================================================================
        // Project List
        layout("./(all)/[workspaceSlug]/(projects)/projects/(list)/layout.tsx", [
          route(":workspaceSlug/projects", "./(all)/[workspaceSlug]/(projects)/projects/(list)/page.tsx"), // ✅
        ]),

        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/layout.tsx", [
          // Project Archives (top-level)
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/layout.tsx", [
            route(
              ":workspaceSlug/projects/archives",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/page.tsx"
            ), // ✅
          ]),

          // Project Issues - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/issues",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/page.tsx"
            ), // ✅
          ]),

          // Project Issues - Detail
          route(
            ":workspaceSlug/projects/:projectId/issues/:issueId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(detail)/[issueId]/page.tsx"
          ), // ✅

          // Project Cycles - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/cycles",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/page.tsx"
            ), // ✅
          ]),

          // Project Cycles - Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/cycles/:cycleId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/[cycleId]/page.tsx"
            ), // ✅
          ]),

          // Project Modules - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/modules",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/page.tsx"
            ), // ✅
          ]),

          // Project Modules - Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/modules/:moduleId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx"
            ), // ✅
          ]),

          // Project Views - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/views",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx"
            ), // ✅
          ]),

          // Project Views - Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/views/:viewId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/[viewId]/page.tsx"
            ), // ✅
          ]),

          // Project Pages - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/pages",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/page.tsx"
            ), // ✅
          ]),

          // Project Pages - Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/pages/:pageId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/[pageId]/page.tsx"
            ), // ✅
          ]),

          // Project Intake
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/intake",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/page.tsx"
            ), // ✅
          ]),

          // ==================================================================
          // PROJECT ARCHIVES - Issues, Cycles, Modules
          // ==================================================================

          // Archived Issues - List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/archives/issues",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/page.tsx"
            ), // ✅
          ]),

          // Archived Issues - Detail
          layout(
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/layout.tsx",
            [
              route(
                ":workspaceSlug/projects/:projectId/archives/issues/:archivedIssueId",
                "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/[archivedIssueId]/page.tsx"
              ), // ✅
            ]
          ),

          // Archived Cycles
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/archives/cycles",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/page.tsx"
            ), // ✅
          ]),

          // Archived Modules
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/archives/modules",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/page.tsx"
            ), // ✅
          ]),
        ]),
      ]),

      // ========================================================================
      // SETTINGS SECTION - With settings header and auth wrapper
      // ========================================================================
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        // Workspace Settings
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
          route(":workspaceSlug/settings", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"), // ✅
          route(
            ":workspaceSlug/settings/members",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/billing",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/integrations",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/imports",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/exports",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/webhooks",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/webhooks/:webhookId",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
          ), // ✅
        ]),

        // Account Settings
        layout("./(all)/[workspaceSlug]/(settings)/settings/account/layout.tsx", [
          route(":workspaceSlug/settings/account", "./(all)/[workspaceSlug]/(settings)/settings/account/page.tsx"), // ✅
          route(
            ":workspaceSlug/settings/account/activity",
            "./(all)/[workspaceSlug]/(settings)/settings/account/activity/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/account/preferences",
            "./(all)/[workspaceSlug]/(settings)/settings/account/preferences/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/account/notifications",
            "./(all)/[workspaceSlug]/(settings)/settings/account/notifications/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/account/security",
            "./(all)/[workspaceSlug]/(settings)/settings/account/security/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/account/api-tokens",
            "./(all)/[workspaceSlug]/(settings)/settings/account/api-tokens/page.tsx"
          ), // ✅
        ]),

        // Project Settings - List
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          route(":workspaceSlug/settings/projects", "./(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx"), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/members",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/members/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/features",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/states",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/labels",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/labels/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/estimates",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/estimates/page.tsx"
          ), // ✅
          route(
            ":workspaceSlug/settings/projects/:projectId/automations",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
          ), // ✅
        ]),
      ]),
    ]),

    // ==========================================================================
    // STANDALONE ROUTES - Outside workspace context
    // ==========================================================================

    // Onboarding
    layout("./(all)/onboarding/layout.tsx", [route("onboarding", "./(all)/onboarding/page.tsx")]),

    // Create Workspace
    layout("./(all)/create-workspace/layout.tsx", [route("create-workspace", "./(all)/create-workspace/page.tsx")]), // ✅

    // Sign Up
    layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]), // ✅

    // Invitations
    layout("./(all)/invitations/layout.tsx", [route("invitations", "./(all)/invitations/page.tsx")]), // ✅

    // Workspace Invitations
    layout("./(all)/workspace-invitations/layout.tsx", [
      route("workspace-invitations", "./(all)/workspace-invitations/page.tsx"), // ✅
    ]),

    // Account Routes - Password Management
    layout("./(all)/accounts/forgot-password/layout.tsx", [
      route("accounts/forgot-password", "./(all)/accounts/forgot-password/page.tsx"), // ✅
    ]),
    layout("./(all)/accounts/reset-password/layout.tsx", [
      route("accounts/reset-password", "./(all)/accounts/reset-password/page.tsx"), // ✅
    ]),
    layout("./(all)/accounts/set-password/layout.tsx", [
      route("accounts/set-password", "./(all)/accounts/set-password/page.tsx"), // ✅
    ]),

    // OAuth Installations
    layout("./(all)/installations/[provider]/layout.tsx", [
      route("installations/:provider", "./(all)/installations/[provider]/page.tsx"),
    ]),
  ]),

  // ============================================================================
  // ERROR HANDLING - 404 Catch-all (must be last)
  // ============================================================================
  route("*", "./not-found.tsx"),
] satisfies RouteConfig;
