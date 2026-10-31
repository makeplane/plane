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
        layout("./(all)/[workspaceSlug]/(projects)/team-ops/time/layout.tsx", [
          route(":workspaceSlug/team-ops/time", "./(all)/[workspaceSlug]/(projects)/team-ops/time/page.tsx"),
        ]),
      ]),
    ]),
  ]),
];
