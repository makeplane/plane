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
import { DEFAULT_WORK_ITEM_PERMISSIONS } from "@/components/issues/issue-layouts/constants";
// hooks
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";
// types
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { InitiativeScopeEpicQuickActions } from "./quick-actions";

type Props = {
  permissions: {
    canRemoveEpic: boolean;
  };
  workspaceSlug: string;
};

export const InitiativeScopeEpicList = observer(function InitiativeScopeEpicList(props: Props) {
  const { permissions, workspaceSlug } = props;
  // store hooks
  const { permissions: epicPermissions } = useEpics();

  return (
    <BaseListRoot
      isEpic
      QuickActions={(props) => <InitiativeScopeEpicQuickActions {...props} permissions={permissions} />}
      layoutPermissions={{
        canCreateWorkItem: {
          viaHeader: false,
          viaQuickAdd: false,
        },
        canPerformBulkOps: false,
      }}
      getWorkItemPermissions={(workItem) =>
        workItem.project_id
          ? {
              canEditProperty: (property: TWorkItemProperty) =>
                epicPermissions.getCanEditProperty(workspaceSlug, workItem.project_id!, workItem.id, property),
              canDragAndDrop: epicPermissions.getCanDragAndDrop(workspaceSlug, workItem.project_id, workItem.id),
            }
          : DEFAULT_WORK_ITEM_PERMISSIONS
      }
    />
  );
});
