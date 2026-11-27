/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

// Liviere/plane fork: our routes. mergeRoutes (./helper.ts) merges a layout that also exists in core.ts,
// so each route repeats the chain of layouts above it and only adds its own leaf.
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // "New" work items of the workspace (liviere/unread)
        layout("./(all)/[workspaceSlug]/(projects)/new-work-items/layout.tsx", [
          route(":workspaceSlug/new-work-items", "./(all)/[workspaceSlug]/(projects)/new-work-items/page.tsx"),
        ]),
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          // Project activity heatmap (core/liviere/activity)
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/activity/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/activity",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/activity/page.tsx"
            ),
          ]),
          // Decision register (liviere/decisions)
          layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/decisions/layout.tsx", [
            route(
              ":workspaceSlug/projects/:projectId/decisions",
              "./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/decisions/page.tsx"
            ),
          ]),
        ]),
      ]),
      layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
          layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
            route(
              ":workspaceSlug/settings/projects/:projectId/features/activity",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/activity/page.tsx"
            ),
            route(
              ":workspaceSlug/settings/projects/:projectId/features/decisions",
              "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/decisions/page.tsx"
            ),
          ]),
        ]),
      ]),
    ]),
  ]),
];
