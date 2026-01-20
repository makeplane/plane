import { index, layout, route } from "@react-router/dev/routes";
import type { RouteConfig, RouteConfigEntry } from "@react-router/dev/routes";

export const coreRoutes: RouteConfigEntry[] = [
  // ========================================================================
  // USER MANAGEMENT ROUTES
  // ========================================================================

  // Home - Sign In
  layout("./(home)/layout.tsx", [index("./(home)/page.tsx")]),

  // Sign Up
  layout("./(all)/sign-up/layout.tsx", [route("sign-up", "./(all)/sign-up/page.tsx")]),

  // Account Routes - Password Management
  layout("./(all)/accounts/forgot-password/layout.tsx", [
    route("accounts/forgot-password", "./(all)/accounts/forgot-password/page.tsx"),
  ]),
  layout("./(all)/accounts/reset-password/layout.tsx", [
    route("accounts/reset-password", "./(all)/accounts/reset-password/page.tsx"),
  ]),
  layout("./(all)/accounts/set-password/layout.tsx", [
    route("accounts/set-password", "./(all)/accounts/set-password/page.tsx"),
  ]),

  // Create Workspace
  layout("./(all)/create-workspace/layout.tsx", [route("create-workspace", "./(all)/create-workspace/page.tsx")]),

  // Onboarding
  layout("./(all)/onboarding/layout.tsx", [route("onboarding", "./(all)/onboarding/page.tsx")]),

  // Invitations
  layout("./(all)/invitations/layout.tsx", [route("invitations", "./(all)/invitations/page.tsx")]),

  // Workspace Invitations
  layout("./(all)/workspace-invitations/layout.tsx", [
    route("workspace-invitations", "./(all)/workspace-invitations/page.tsx"),
  ]),

  // ========================================================================
  // ALL APP ROUTES
  // ========================================================================
  layout("./(all)/layout.tsx", [
    // ======================================================================
    // WORKSPACE-SCOPED ROUTES
    // ======================================================================
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      // ====================================================================
      // PROJECTS APP SECTION - WORKSPACE LEVEL ROUTES
      // ====================================================================
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // --------------------------------------------------------------------
        // WORKSPACE LEVEL ROUTES
        // --------------------------------------------------------------------

        // Workspace Home
        route(":workspaceSlug", "./(all)/[workspaceSlug]/(projects)/page.tsx"),

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
          route(":workspaceSlug/browse/:workItem", "./(all)/[workspaceSlug]/(projects)/browse/[workItem]/page.tsx"),
        ]),

        // Drafts
        layout("./(all)/[workspaceSlug]/(projects)/drafts/layout.tsx", [
          route(":workspaceSlug/drafts", "./(all)/[workspaceSlug]/(projects)/drafts/page.tsx"),
        ]),

        // Notifications
        layout("./(all)/[workspaceSlug]/(projects)/notifications/layout.tsx", [
          route(":workspaceSlug/notifications", "./(all)/[workspaceSlug]/(projects)/notifications/page.tsx"),
        ]),

        // Profile
        layout("./(all)/[workspaceSlug]/(projects)/profile/[userId]/layout.tsx", [
          route(":workspaceSlug/profile/:userId", "./(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx"),
          route(
            ":workspaceSlug/profile/:userId/:profileViewId",
            "./(all)/[workspaceSlug]/(projects)/profile/[userId]/[profileViewId]/page.tsx"
          ),
          route(
            ":workspaceSlug/profile/:userId/activity",
            "./(all)/[workspaceSlug]/(projects)/profile/[userId]/activity/page.tsx"
          ),
        ]),

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
        ]),

        // Archived Projects
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/layout.tsx", [
          route(
            ":workspaceSlug/projects/archives",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/archives/page.tsx"
          ),
        ]),

        // --------------------------------------------------------------------
        // PROJECT LEVEL ROUTES
        // --------------------------------------------------------------------

        // Project List
        layout("./(all)/[workspaceSlug]/(projects)/projects/(list)/layout.tsx", [
          route(":workspaceSlug/projects", "./(all)/[workspaceSlug]/(projects)/projects/(list)/page.tsx"),
        ]),

        // Project Detail
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          // Project Issues List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/issues",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/page.tsx"
            ),
          ]),
          // Issue Detail
          route(
            ":workspaceSlug/projects/:projectId/issues/:issueId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(detail)/[issueId]/page.tsx"
          ),

          // Cycle Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/cycles/:cycleId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(detail)/[cycleId]/page.tsx"
            ),
          ]),

          // Cycles List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/cycles",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/cycles/(list)/page.tsx"
            ),
          ]),

          // Module Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/modules/:moduleId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx"
            ),
          ]),

          // Modules List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/modules",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(list)/page.tsx"
            ),
          ]),

          // View Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/views/:viewId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(detail)/[viewId]/page.tsx"
            ),
          ]),

          // Views List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/views",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx"
            ),
          ]),

          // Page Detail
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/pages/:pageId",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(detail)/[pageId]/page.tsx"
            ),
          ]),

          // Pages List
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/pages",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/pages/(list)/page.tsx"
            ),
          ]),
          // Intake list
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/intake",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/intake/page.tsx"
            ),
          ]),
        ]),

        // Project Archives - Issues, Cycles, Modules
        // Project Archives - Issues - List
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/archives/issues",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(list)/page.tsx"
          ),
        ]),

        // Project Archives - Issues - Detail
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/archives/issues/:archivedIssueId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/issues/(detail)/[archivedIssueId]/page.tsx"
          ),
        ]),

        // Project Archives - Cycles
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/archives/cycles",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/cycles/page.tsx"
          ),
        ]),

        // Project Archives - Modules
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/archives/modules",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/modules/page.tsx"
          ),
        ]),
      ]),

      // ====================================================================
      // SETTINGS SECTION
      // ====================================================================
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        // --------------------------------------------------------------------
        // WORKSPACE SETTINGS
        // --------------------------------------------------------------------

        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
          route(":workspaceSlug/settings", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"),
          route(
            ":workspaceSlug/settings/members",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/billing",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/exports",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/webhooks",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/webhooks/:webhookId",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
          ),
        ]),

        // --------------------------------------------------------------------
        // PROJECT SETTINGS
        // --------------------------------------------------------------------

        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          // No Projects available page
          route(":workspaceSlug/settings/projects", "./(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx"),
          layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
            // Project Settings
            route(
              ":workspaceSlug/settings/projects/:projectId",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/page.tsx"
            ),
            // Project Members
            route(
              ":workspaceSlug/settings/projects/:projectId/members",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/members/page.tsx"
            ),
            // Project Features
            route(
              ":workspaceSlug/settings/projects/:projectId/features/cycles",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/cycles/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/modules",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/modules/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/views",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/views/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/pages",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/pages/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/intake",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/intake/page.tsx"
            ),
            // Project States
            route(
              ":workspaceSlug/settings/projects/:projectId/states",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/page.tsx"
            ),
            // Project Labels
            route(
              ":workspaceSlug/settings/projects/:projectId/labels",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/labels/page.tsx"
            ),
            // Project Estimates
            route(
              ":workspaceSlug/settings/projects/:projectId/estimates",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/estimates/page.tsx"
            ),
            // Project Automations
            layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/layout.tsx", [
              route(
                ":workspaceSlug/settings/projects/:projectId/automations",
                "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
              ),
            ]),
          ]),
        ]),
      ]),
    ]),
    // ======================================================================
    // STANDALONE ROUTES (outside workspace context)
    // ======================================================================

    // --------------------------------------------------------------------
    // PROFILE SETTINGS
    // --------------------------------------------------------------------

    layout("./(all)/settings/profile/layout.tsx", [
      route("settings/profile/:profileTabId", "./(all)/settings/profile/[profileTabId]/page.tsx"),
    ]),
  ]),

  // ========================================================================
  // REDIRECT ROUTES
  // ========================================================================
  // Legacy URL redirects for backward compatibility

  // --------------------------------------------------------------------
  // REDIRECT ROUTES
  // --------------------------------------------------------------------

  // Project settings redirect: /:workspaceSlug/projects/:projectId/settings/:path*
  // → /:workspaceSlug/settings/projects/:projectId/:path*
  route(":workspaceSlug/projects/:projectId/settings/*", "routes/redirects/core/project-settings.tsx"),

  // Analytics redirect: /:workspaceSlug/analytics → /:workspaceSlug/analytics/overview
  route(":workspaceSlug/analytics", "routes/redirects/core/analytics.tsx"),

  // API tokens redirect: /:workspaceSlug/settings/api-tokens
  // → /settings/profile/api-tokens
  route(":workspaceSlug/settings/api-tokens", "routes/redirects/core/api-tokens.tsx"),

  // Inbox redirect: /:workspaceSlug/projects/:projectId/inbox
  // → /:workspaceSlug/projects/:projectId/intake
  route(":workspaceSlug/projects/:projectId/inbox", "routes/redirects/core/inbox.tsx"),

  // Sign-up redirects
  route("accounts/sign-up", "routes/redirects/core/accounts-signup.tsx"),

  // Sign-in redirects (all redirect to home page)
  route("sign-in", "routes/redirects/core/sign-in.tsx"),
  route("signin", "routes/redirects/core/signin.tsx"),
  route("login", "routes/redirects/core/login.tsx"),

  // Register redirect
  route("register", "routes/redirects/core/register.tsx"),

  // Profile settings redirects
  route("profile/*", "routes/redirects/core/profile-settings.tsx"),

  // Account settings redirects
  route(":workspaceSlug/settings/account/*", "routes/redirects/core/workspace-account-settings.tsx"),
] satisfies RouteConfig;
