/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Projects routes — wrapped in the (projects) layout.
 *
 * Contains workspace-level routes (home, get-started, cycles, analytics, etc.),
 * project-level routes (list, detail, archives), and enterprise features
 * (dashboards, initiatives, customers, teamspaces, ai).
 */
export const projectRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
    // ====================================================================
    // WORKSPACE LEVEL ROUTES
    // ====================================================================

    // Workspace Home
    route(":workspaceSlug", "./(all)/[workspaceSlug]/(projects)/page.tsx"),

    // Get Started
    route(":workspaceSlug/get-started", "./(all)/[workspaceSlug]/(projects)/get-started/page.tsx"),

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

    // ====================================================================
    // PROJECT LEVEL ROUTES
    // ====================================================================

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

      // Project Overview
      layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/overview/(list)/layout.tsx", [
        route(
          ":workspaceSlug/projects/:projectId/overview",
          "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/overview/(list)/page.tsx"
        ),
      ]),

      // Project Epics
      layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics/layout.tsx", [
        // Epics List
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics/(list)/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/epics",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics/(list)/page.tsx"
          ),
        ]),

        // Project Epic Detail
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics/(detail)/layout.tsx", [
          route(
            ":workspaceSlug/projects/:projectId/epics/:epicId",
            "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/epics/(detail)/[epicId]/page.tsx"
          ),
        ]),
      ]),

      // Project Automations
      layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/automations/[automationId]/layout.tsx", [
        route(
          ":workspaceSlug/projects/:projectId/automations/:automationId",
          "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/automations/[automationId]/page.tsx"
        ),
      ]),

      // Project Archives - Epics - List
      layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/epics/(list)/layout.tsx", [
        route(
          ":workspaceSlug/projects/:projectId/archives/epics",
          "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/archives/epics/(list)/page.tsx"
        ),
      ]),

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
    // DASHBOARDS
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx", [
      // Dashboards List
      layout("./(all)/[workspaceSlug]/(projects)/dashboards/(list)/layout.tsx", [
        route(":workspaceSlug/dashboards", "./(all)/[workspaceSlug]/(projects)/dashboards/(list)/page.tsx"),
      ]),

      // Dashboard Detail
      layout("./(all)/[workspaceSlug]/(projects)/dashboards/(detail)/[dashboardId]/layout.tsx", [
        route(
          ":workspaceSlug/dashboards/:dashboardId",
          "./(all)/[workspaceSlug]/(projects)/dashboards/(detail)/[dashboardId]/page.tsx"
        ),
      ]),
    ]),

    // ====================================================================
    // INITIATIVES
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/initiatives/layout.tsx", [
      // Initiatives List
      layout("./(all)/[workspaceSlug]/(projects)/initiatives/(list)/layout.tsx", [
        route(":workspaceSlug/initiatives", "./(all)/[workspaceSlug]/(projects)/initiatives/(list)/page.tsx"),
      ]),

      // Initiative Detail
      layout("./(all)/[workspaceSlug]/(projects)/initiatives/(detail)/[initiativeId]/layout.tsx", [
        // Initiative Overview
        layout("./(all)/[workspaceSlug]/(projects)/initiatives/(detail)/[initiativeId]/(overview)/layout.tsx", [
          route(
            ":workspaceSlug/initiatives/:initiativeId",
            "./(all)/[workspaceSlug]/(projects)/initiatives/(detail)/[initiativeId]/(overview)/page.tsx"
          ),
        ]),

        // Initiative Scope
        layout("./(all)/[workspaceSlug]/(projects)/initiatives/(detail)/[initiativeId]/scope/layout.tsx", [
          route(
            ":workspaceSlug/initiatives/:initiativeId/scope",
            "./(all)/[workspaceSlug]/(projects)/initiatives/(detail)/[initiativeId]/scope/page.tsx"
          ),
        ]),
      ]),
    ]),

    // ====================================================================
    // RELEASES
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/releases/layout.tsx", [
      route(":workspaceSlug/releases", "./(all)/[workspaceSlug]/(projects)/releases/page.tsx"),

      // Release Detail
      layout("./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/layout.tsx", [
        // Release index → redirects to scope
        route(
          ":workspaceSlug/releases/:releaseId",
          "./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/page.tsx"
        ),

        // Release Overview
        layout("./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/overview/layout.tsx", [
          route(
            ":workspaceSlug/releases/:releaseId/overview",
            "./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/overview/page.tsx"
          ),
        ]),

        // Release Scope
        layout("./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/scope/layout.tsx", [
          route(
            ":workspaceSlug/releases/:releaseId/scope",
            "./(all)/[workspaceSlug]/(projects)/releases/(detail)/[releaseId]/scope/page.tsx"
          ),
        ]),
      ]),
    ]),

    // ====================================================================
    // CUSTOMERS
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/customers/layout.tsx", [
      // Customers List
      layout("./(all)/[workspaceSlug]/(projects)/customers/(list)/layout.tsx", [
        route(":workspaceSlug/customers", "./(all)/[workspaceSlug]/(projects)/customers/(list)/page.tsx"),
      ]),

      // Customer Detail
      layout("./(all)/[workspaceSlug]/(projects)/customers/(detail)/[customerId]/layout.tsx", [
        route(
          ":workspaceSlug/customers/:customerId",
          "./(all)/[workspaceSlug]/(projects)/customers/(detail)/[customerId]/page.tsx"
        ),
      ]),
    ]),

    // Advanced Search
    route(":workspaceSlug/search", "./(all)/[workspaceSlug]/(projects)/search/page.tsx"),

    // ====================================================================
    // TEAMSPACES
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/teamspaces/layout.tsx", [
      // Teamspaces List
      layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(list)/layout.tsx", [
        route(":workspaceSlug/teamspaces", "./(all)/[workspaceSlug]/(projects)/teamspaces/(list)/page.tsx"),
      ]),

      // Teamspace Detail
      layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/layout.tsx", [
        // Teamspace Overview
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/(overview)/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/(overview)/page.tsx"
          ),
        ]),

        // Teamspace Cycles
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/cycles/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/cycles",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/cycles/page.tsx"
          ),
        ]),

        // Teamspace Issues
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/issues/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/issues",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/issues/page.tsx"
          ),
        ]),

        // Teamspace Projects
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/projects/(list)/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/projects",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/projects/(list)/page.tsx"
          ),
        ]),

        // Teamspace Project Detail
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/projects/(detail)/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/projects/:projectId",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/projects/(detail)/[projectId]/page.tsx"
          ),
        ]),

        // Teamspace Pages
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/pages/layout.tsx", [
          // Pages List
          layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/pages/(list)/layout.tsx", [
            route(
              ":workspaceSlug/teamspaces/:teamspaceId/pages",
              "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/pages/(list)/page.tsx"
            ),
          ]),

          // Teamspace Page Detail
          layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/pages/(detail)/layout.tsx", [
            route(
              ":workspaceSlug/teamspaces/:teamspaceId/pages/:pageId",
              "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/pages/(detail)/[pageId]/page.tsx"
            ),
          ]),
        ]),

        // Teamspace Views
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/views/(list)/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/views",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/views/(list)/page.tsx"
          ),
        ]),

        // Teamspace View Detail
        layout("./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/views/(detail)/layout.tsx", [
          route(
            ":workspaceSlug/teamspaces/:teamspaceId/views/:viewId",
            "./(all)/[workspaceSlug]/(projects)/teamspaces/(detail)/[teamspaceId]/views/(detail)/[viewId]/page.tsx"
          ),
        ]),
      ]),
    ]),

    // ====================================================================
    // PI CHAT (Project Level)
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(projects)/projects/pi-chat/layout.tsx", [
      route(":workspaceSlug/projects/ai-chat", "./(all)/[workspaceSlug]/(projects)/projects/pi-chat/page.tsx"),
      route(":workspaceSlug/projects/ai-chat/new", "./(all)/[workspaceSlug]/(projects)/projects/pi-chat/new/page.tsx"),
      route(
        ":workspaceSlug/projects/ai-chat/:chatId",
        "./(all)/[workspaceSlug]/(projects)/projects/pi-chat/[chatId]/page.tsx"
      ),
    ]),
  ]),
];
