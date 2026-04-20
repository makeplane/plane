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
// local imports
import { ArchivedIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";
import { useIssues } from "@/hooks/store/use-issues";
import { EIssuesStoreType } from "@plane/types";
// constants
import {
  DEFAULT_WORK_ITEM_PERMISSIONS,
  DEFAULT_QUICK_ACTION_PERMISSIONS,
} from "@/components/issues/issue-layouts/constants";

type TArchivedIssueListLayoutProps = {
  workspaceSlug: string;
};

export const ArchivedIssueListLayout = observer(function ArchivedIssueListLayout(props: TArchivedIssueListLayoutProps) {
  const { workspaceSlug } = props;
  // store hooks
  const { permissions } = useIssues(EIssuesStoreType.ARCHIVED);

  return (
    <BaseListRoot
      QuickActions={(props) => (
        <ArchivedIssueQuickActions
          {...props}
          permissions={
            props.issue.project_id
              ? {
                  canEdit: permissions.getCanEdit(workspaceSlug, props.issue.project_id, props.issue.id),
                  canDelete: permissions.getCanDelete(workspaceSlug, props.issue.project_id, props.issue.id),
                  canRestore: permissions.getCanRestore(workspaceSlug, props.issue.project_id, props.issue.id),
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
        canPerformBulkOps: false,
      }}
      getWorkItemPermissions={() => DEFAULT_WORK_ITEM_PERMISSIONS}
    />
  );
});
