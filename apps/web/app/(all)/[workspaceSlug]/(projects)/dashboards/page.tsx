/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The Team Operations Dashboard (spec §4, §6, §7).
 *
 * The plural URL stays — spec §4.1 allows it and it keeps existing
 * bookmarks and the sidebar link working — but the route now renders
 * the operations shell directly. There is no dashboard list, no
 * builder entry point and no fallback: the route guard in the layout
 * sends the viewer away before this module is ever reached.
 *
 * The legacy `/:dashboardId` redirect remains so old bookmarks land
 * on the new dashboard rather than a 404.
 */

import { PageHead } from "@/components/core/page-title";
import { OperationsShell } from "@/components/dashboards/operations/shell";
import type { Route } from "./+types/page";

function WorkspaceDashboardsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <>
      <PageHead title="Dashboard" />
      <div className="relative h-full w-full overflow-hidden">
        <OperationsShell workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}

export default WorkspaceDashboardsPage;
