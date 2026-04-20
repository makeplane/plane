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

import type { FC } from "react";
import { observer } from "mobx-react";
// components
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/board/base-kanban-root";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// constants
import {
  DEFAULT_WORK_ITEM_PERMISSIONS,
  DEFAULT_QUICK_ACTION_PERMISSIONS,
} from "@/components/issues/issue-layouts/constants";

type Props = {
  globalViewId: string;
  workspaceSlug: string;
};

export const WorkspaceViewBoardLayout: FC<Props> = observer(function WorkspaceViewBoardLayout(props: Props) {
  // props
  const { globalViewId, workspaceSlug } = props;
  // hooks
  const { permissions } = useIssues(EIssuesStoreType.GLOBAL);

  return (
    <BaseKanBanRoot
      QuickActions={(props) => (
        <AllIssueQuickActions
          {...props}
          permissions={
            props.issue.project_id
              ? {
                  canEdit: permissions.getCanEdit(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDelete: permissions.getCanDelete(workspaceSlug, props.issue.project_id, props.issue.id),
                  canArchive: permissions.getCanArchive(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDuplicate: permissions.getCanDuplicate(workspaceSlug, props.issue.project_id),
                }
              : DEFAULT_QUICK_ACTION_PERMISSIONS
          }
        />
      )}
      layoutPermissions={{
        canCreateWorkItem: {
          viaHeader: false,
          viaQuickAdd: false,
        },
      }}
      getWorkItemPermissions={(workItem) =>
        workItem.project_id
          ? {
              canEditProperty: (property: TWorkItemProperty) =>
                permissions.getCanEditProperty(workspaceSlug, workItem.project_id!, workItem.id, property),
              canDragAndDrop: permissions.getCanDragAndDrop(workspaceSlug, workItem.project_id, workItem.id),
            }
          : DEFAULT_WORK_ITEM_PERMISSIONS
      }
      viewId={globalViewId}
    />
  );
});
