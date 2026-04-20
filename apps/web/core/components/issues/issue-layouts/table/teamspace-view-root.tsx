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

import { observer } from "mobx-react";
// components
import { ProjectIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "@/components/issues/issue-layouts/table/base-spreadsheet-root";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { EIssuesStoreType } from "@plane/types";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// constants
import { DEFAULT_WORK_ITEM_PERMISSIONS, DEFAULT_QUICK_ACTION_PERMISSIONS } from "../constants";

type TTeamspaceViewTableLayoutProps = {
  workspaceSlug: string;
  viewId: string;
};

export const TeamspaceViewTableLayout = observer(function TeamspaceViewTableLayout(
  props: TTeamspaceViewTableLayoutProps
) {
  const { workspaceSlug, viewId } = props;
  // store hooks
  const { permissions } = useIssues(EIssuesStoreType.TEAM_VIEW);

  return (
    <BaseSpreadsheetRoot
      QuickActions={(props) => (
        <ProjectIssueQuickActions
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
        canQuickAddWorkItem: false,
        canPerformBulkOps: false,
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
      viewId={viewId}
    />
  );
});
