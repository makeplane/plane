/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

// Fork-only routes. They nest under the same layout files as the core routes so mergeRoutes deep-merges them.
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // Time tracking: timesheet, entries, reports
        layout("./(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/layout.tsx", [
          route(
            ":workspaceSlug/time-tracking/:tabId",
            "./(all)/[workspaceSlug]/(projects)/time-tracking/[tabId]/page.tsx"
          ),
        ]),
      ]),
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
            route(
              ":workspaceSlug/settings/projects/:projectId/features/time-tracking",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx"
            ),
          ]),
        ]),
      ]),
    ]),
  ]),
  // /:workspaceSlug/time-tracking → /:workspaceSlug/time-tracking/timesheet/
  route(":workspaceSlug/time-tracking", "routes/redirects/extended/time-tracking.tsx"),
];
