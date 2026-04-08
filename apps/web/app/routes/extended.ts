/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      // Nest inside (projects)/layout.tsx so it gets the workspace sidebar shell —
      // same pattern as the "ho" route in core.ts
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(projects)/bank-wide-projects/layout.tsx", [
          route(":workspaceSlug/bank-wide-projects", "./(all)/[workspaceSlug]/(projects)/bank-wide-projects/page.tsx"),
        ]),
      ]),
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
            route(
              ":workspaceSlug/settings/projects/:projectId/worklogs",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/workflows",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/workflows/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/time-tracking",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/bank-wide",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/bank-wide/page.tsx"
            ),
          ]),
        ]),
      ]),
    ]),
  ]),
];
