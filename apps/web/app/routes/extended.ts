/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Nested to match core.ts so mergeRoutes deep-merges into the existing
 * project-detail layout instead of registering a duplicate layout id.
 */
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          layout("./testhub/layout.tsx", [
            route(":workspaceSlug/projects/:projectId/testhub", "./testhub/pages/overview.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/bind", "./testhub/pages/bind.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/knowledge", "./testhub/pages/knowledge.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/components", "./testhub/pages/components.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/tools", "./testhub/pages/tools.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/actions", "./testhub/pages/actions.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/tests", "./testhub/pages/tests.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/jobs/:jobId", "./testhub/pages/job-detail.tsx"),
            route(":workspaceSlug/projects/:projectId/testhub/jobs", "./testhub/pages/jobs.tsx"),
          ]),
        ]),
      ]),
    ]),
  ]),
];
