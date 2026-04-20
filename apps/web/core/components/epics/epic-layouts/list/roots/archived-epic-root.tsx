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
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
import { ArchivedEpicQuickActions } from "@/components/epics/quick-actions/archived-epic";
// hooks
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
import { DEFAULT_WORK_ITEM_PERMISSIONS } from "@/components/issues/issue-layouts/constants";

type TArchivedEpicListLayoutProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ArchivedEpicListLayout = observer(function ArchivedEpicListLayout(props: TArchivedEpicListLayoutProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { permissions } = useEpics();

  return (
    <BaseListRoot
      QuickActions={(props) => (
        <ArchivedEpicQuickActions
          {...props}
          permissions={{
            canEdit: permissions.getCanEdit(workspaceSlug, projectId, props.issue.id),
            canDelete: permissions.getCanDelete(workspaceSlug, projectId, props.issue.id),
            canRestore: permissions.getCanRestore(workspaceSlug, projectId, props.issue.id),
          }}
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
      isEpic
    />
  );
});
