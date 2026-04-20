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

import { computedFn } from "mobx-utils";
// store
import type { IPermissionAccessStore } from "@/store/permission-access.store";

type WorkspaceViewMeta = {
  workspaceSlug: string;
  conditionContext: { creator: boolean };
};

export type WorkspaceViewPermissionsArgs = {
  can: IPermissionAccessStore["can"];
  getWorkspaceViewMetaById: (workspaceViewId: string) => WorkspaceViewMeta | undefined;
};

export interface WorkspaceViewPermissions {
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceViewId: string) => boolean;
  getCanLock: (workspaceViewId: string) => boolean;
  getCanDelete: (workspaceViewId: string) => boolean;
  getCanExport: (workspaceViewId: string) => boolean;
}

export class WorkspaceViewPermissionsStore implements WorkspaceViewPermissions {
  constructor(private args: WorkspaceViewPermissionsArgs) {}

  // private helper to check workspace view permissions
  private checkWorkspaceViewPermission = computedFn((workspaceViewId: string, action: "edit" | "delete"): boolean => {
    const workspaceViewMeta = this.args.getWorkspaceViewMetaById(workspaceViewId);
    if (!workspaceViewMeta) return false;
    return this.args.can({
      resource: "workspace_workitem_view",
      action,
      workspaceSlug: workspaceViewMeta.workspaceSlug,
      resourceMeta: { resourceId: workspaceViewId, conditionContext: workspaceViewMeta.conditionContext },
    });
  });

  // computed functions
  getCanCreate: WorkspaceViewPermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({
      resource: "workspace_workitem_view",
      action: "create",
      workspaceSlug,
    })
  );

  getCanEdit: WorkspaceViewPermissions["getCanEdit"] = computedFn((workspaceViewId: string) =>
    this.checkWorkspaceViewPermission(workspaceViewId, "edit")
  );

  getCanLock: WorkspaceViewPermissions["getCanLock"] = computedFn((workspaceViewId: string) =>
    this.getCanEdit(workspaceViewId)
  );

  getCanDelete: WorkspaceViewPermissions["getCanDelete"] = computedFn((workspaceViewId: string) =>
    this.checkWorkspaceViewPermission(workspaceViewId, "delete")
  );

  getCanExport: WorkspaceViewPermissions["getCanExport"] = computedFn((workspaceViewId: string) => {
    const workspaceViewMeta = this.args.getWorkspaceViewMetaById(workspaceViewId);
    if (!workspaceViewMeta) return false;

    return this.args.can({
      resource: "workspace_workitem_view",
      action: "export",
      workspaceSlug: workspaceViewMeta.workspaceSlug,
      resourceMeta: { resourceId: workspaceViewId },
    });
  });
}
