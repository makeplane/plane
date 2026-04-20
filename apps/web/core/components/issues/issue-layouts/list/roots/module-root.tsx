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
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";
// constants
import {
  DEFAULT_WORK_ITEM_PERMISSIONS,
  DEFAULT_QUICK_ACTION_PERMISSIONS,
} from "@/components/issues/issue-layouts/constants";

type TModuleListLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

export const ModuleListLayout = observer(function ModuleListLayout(props: TModuleListLayoutProps) {
  const { workspaceSlug, projectId, moduleId } = props;

  const { issues, permissions } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseListRoot
      QuickActions={(props) => (
        <ModuleIssueQuickActions
          {...props}
          permissions={
            props.issue.project_id
              ? {
                  canEdit: permissions.getCanEdit(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDelete: permissions.getCanDelete(workspaceSlug, props.issue.project_id, props.issue.id),
                  canArchive: permissions.getCanArchive(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDuplicate: permissions.getCanDuplicate(workspaceSlug, props.issue.project_id),
                  canRemoveFromView: permissions.getCanCreate(workspaceSlug, props.issue.project_id),
                }
              : DEFAULT_QUICK_ACTION_PERMISSIONS
          }
        />
      )}
      layoutPermissions={{
        canCreateWorkItem: {
          viaHeader: permissions.getCanCreate(workspaceSlug, projectId),
          viaQuickAdd: permissions.getCanCreate(workspaceSlug, projectId),
        },
        canPerformBulkOps: permissions.getCanPerformBulkOps(workspaceSlug, projectId),
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
      addIssuesToView={(issueIds: string[]) => {
        return issues.addIssuesToModule(workspaceSlug, projectId, moduleId, issueIds);
      }}
      viewId={moduleId}
    />
  );
});
