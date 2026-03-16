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

import { lazy, Suspense } from "react";
import { useFlag } from "@/plane-web/hooks/store";

// Module-level lazy imports so React sees stable component references across renders/remounts.
// This prevents the active-cycle collapsible state from resetting.
const ActiveCycleV1 = lazy(() => import("./v1/root").then((module) => ({ default: module["ActiveCycleRoot"] })));
const ActiveCycleV2 = lazy(() => import("./v2/root").then((module) => ({ default: module["ActiveCycleRoot"] })));

type ProjectActiveCycleRootProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  cycleIds?: string[];
  showHeader?: boolean;
};

export function ProjectActiveCycleRoot(props: ProjectActiveCycleRootProps) {
  const { workspaceSlug, projectId, cycleId, cycleIds, showHeader = true } = props;
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug, "CYCLE_PROGRESS_CHARTS");
  const ActiveCycle = isFeatureEnabled ? ActiveCycleV2 : ActiveCycleV1;

  return (
    <Suspense fallback={<></>}>
      <ActiveCycle
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        cycleId={cycleId}
        cycleIds={cycleIds}
        showHeader={showHeader}
      />
    </Suspense>
  );
}
