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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { BaseTimelineRoot } from "../base-timeline-root";

type TCycleTimelineLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const CycleTimelineLayout = observer(function CycleTimelineLayout(props: TCycleTimelineLayoutProps) {
  const { workspaceSlug, projectId, cycleId } = props;
  // store hooks
  const { permissions } = useIssues(EIssuesStoreType.CYCLE);
  const {
    currentProjectCompletedCycleIds,
    permissions: { getCanEditCycle },
  } = useCycle();
  // auth
  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId) : false;
  const canEditWorkItemProperties = useCallback(
    () => !isCompletedCycle && getCanEditCycle(workspaceSlug, projectId, cycleId),
    [cycleId, getCanEditCycle, isCompletedCycle, projectId, workspaceSlug]
  );

  return (
    <BaseTimelineRoot
      layoutPermissions={{
        canCreateWorkItem: {
          viaQuickAdd: canEditWorkItemProperties(),
        },
        canEditViaTimeline: (blockId, meta) =>
          meta?.project_id ? permissions.getCanEdit(workspaceSlug, meta.project_id, blockId) : false,
      }}
      viewId={cycleId}
    />
  );
});
