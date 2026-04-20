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
// components
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { CycleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";
// constants
import {
  DEFAULT_WORK_ITEM_PERMISSIONS,
  DEFAULT_QUICK_ACTION_PERMISSIONS,
} from "@/components/issues/issue-layouts/constants";

type TCycleKanBanLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const CycleKanBanLayout = observer(function CycleKanBanLayout(props: TCycleKanBanLayoutProps) {
  const { workspaceSlug, projectId, cycleId } = props;
  // store hooks
  const {
    issues: { addIssueToCycle },
    permissions,
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    currentProjectCompletedCycleIds,
    permissions: { getCanEditCycle },
  } = useCycle();
  // permissions
  const isCompletedCycle =
    cycleId && currentProjectCompletedCycleIds ? currentProjectCompletedCycleIds.includes(cycleId) : false;
  const canEditWorkItemProperties = useCallback(
    () => !isCompletedCycle && getCanEditCycle(workspaceSlug, projectId, cycleId),
    [cycleId, getCanEditCycle, isCompletedCycle, projectId, workspaceSlug]
  );

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !cycleId) throw new Error();
      return addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
    },
    [workspaceSlug, projectId, cycleId, addIssueToCycle]
  );

  return (
    <BaseKanBanRoot
      QuickActions={(props) => (
        <CycleIssueQuickActions
          {...props}
          permissions={
            props.issue.project_id
              ? {
                  canEdit: permissions.getCanEdit(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDelete: permissions.getCanDelete(workspaceSlug, props.issue.project_id, props.issue.id),
                  canArchive: permissions.getCanArchive(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDuplicate: permissions.getCanDuplicate(workspaceSlug, props.issue.project_id),
                  canRemoveFromView:
                    !isCompletedCycle && permissions.getCanCreate(workspaceSlug, props.issue.project_id),
                }
              : DEFAULT_QUICK_ACTION_PERMISSIONS
          }
        />
      )}
      layoutPermissions={{
        canCreateWorkItem: {
          viaHeader: canEditWorkItemProperties(),
          viaQuickAdd: canEditWorkItemProperties(),
        },
      }}
      getWorkItemPermissions={(workItem) =>
        workItem.project_id
          ? {
              canEditProperty: (property: TWorkItemProperty) =>
                permissions.getCanEditProperty(workspaceSlug, projectId, workItem.id, property),
              canDragAndDrop: permissions.getCanDragAndDrop(workspaceSlug, projectId, workItem.id),
            }
          : DEFAULT_WORK_ITEM_PERMISSIONS
      }
      addIssuesToView={addIssuesToView}
      viewId={cycleId}
    />
  );
});
