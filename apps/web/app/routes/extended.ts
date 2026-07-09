/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Extended routes are deep-merged into {@link coreRoutes} by `mergeRoutes` (keyed by file path).
 * The nested `layout(...)` chain below re-declares the same layout files as core so the wiki
 * routes are grafted as siblings of the other workspace-level routes under `(projects)/layout.tsx`.
 */
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // Workspace Wiki - List
        layout("./(all)/[workspaceSlug]/(projects)/wiki/(list)/layout.tsx", [
          route(":workspaceSlug/wiki", "./(all)/[workspaceSlug]/(projects)/wiki/(list)/page.tsx"),
        ]),
        // Workspace Wiki - Detail
        layout("./(all)/[workspaceSlug]/(projects)/wiki/(detail)/layout.tsx", [
          route(
            ":workspaceSlug/wiki/:pageId",
            "./(all)/[workspaceSlug]/(projects)/wiki/(detail)/[pageId]/page.tsx"
          ),
        ]),
      ]),
    ]),
  ]),
];
