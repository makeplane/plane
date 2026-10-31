/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Team Ops routes. The nesting mirrors the core workspace layouts so `mergeRoutes` slots these
 * under them instead of creating a second tree.
 */
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/workday/layout.tsx", [
          route(":workspaceSlug/team-ops/workday", "./(all)/[workspaceSlug]/(projects)/team-ops/workday/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/hub/layout.tsx", [
          route(":workspaceSlug/team-ops/hub", "./(all)/[workspaceSlug]/(projects)/team-ops/hub/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/teamflow/layout.tsx", [
          route(":workspaceSlug/team-ops/teamflow", "./(all)/[workspaceSlug]/(projects)/team-ops/teamflow/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/time/layout.tsx", [
          route(":workspaceSlug/team-ops/time", "./(all)/[workspaceSlug]/(projects)/team-ops/time/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/leave/layout.tsx", [
          route(":workspaceSlug/team-ops/leave", "./(all)/[workspaceSlug]/(projects)/team-ops/leave/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/teamspaces/layout.tsx", [
          route(
            ":workspaceSlug/team-ops/teamspaces",
            "./(all)/[workspaceSlug]/(projects)/team-ops/teamspaces/page.tsx"
          ),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/dashboard/layout.tsx", [
          route(":workspaceSlug/team-ops/dashboard", "./(all)/[workspaceSlug]/(projects)/team-ops/dashboard/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/reports/layout.tsx", [
          route(":workspaceSlug/team-ops/reports", "./(all)/[workspaceSlug]/(projects)/team-ops/reports/page.tsx"),
          route(
            ":workspaceSlug/team-ops/reports/board",
            "./(all)/[workspaceSlug]/(projects)/team-ops/reports/board/page.tsx"
          ),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/calendar/layout.tsx", [
          route(":workspaceSlug/team-ops/calendar", "./(all)/[workspaceSlug]/(projects)/team-ops/calendar/page.tsx"),
          route(
            ":workspaceSlug/team-ops/calendar/team",
            "./(all)/[workspaceSlug]/(projects)/team-ops/calendar/team/page.tsx"
          ),
          route(
            ":workspaceSlug/team-ops/calendar/reports",
            "./(all)/[workspaceSlug]/(projects)/team-ops/calendar/reports/page.tsx"
          ),
          route(
            ":workspaceSlug/team-ops/calendar/settings",
            "./(all)/[workspaceSlug]/(projects)/team-ops/calendar/settings/page.tsx"
          ),
        ]),
      ]),
    ]),
  ]),
];
