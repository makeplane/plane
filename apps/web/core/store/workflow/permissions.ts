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
import type { PermissionCheckArgs, TWorkflowInstancePermissions } from "@plane/types";

export type WorkflowPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export interface WorkflowPermissions {
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanManage: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, workflowId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, workflowId: string) => boolean;
  getWorkflowPermissions: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string
  ) => TWorkflowInstancePermissions;
}

export class WorkflowPermissionsInstance implements WorkflowPermissions {
  constructor(private args: WorkflowPermissionsArgs) {}

  private checkWorkflowPermission = computedFn(
    (workspaceSlug: string, projectId: string, workflowId: string, action: "edit" | "delete"): boolean =>
      this.args.can({
        resource: "workflow",
        action,
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: workflowId,
        },
      })
  );

  getCanView: WorkflowPermissions["getCanView"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "workflow",
      action: "view",
      projectId,
      workspaceSlug,
    })
  );

  getCanCreate: WorkflowPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "workflow",
      action: "create",
      projectId,
      workspaceSlug,
    })
  );

  getCanManage: WorkflowPermissions["getCanManage"] = computedFn(
    (workspaceSlug, projectId) =>
      this.getCanView(workspaceSlug, projectId) && this.getCanCreate(workspaceSlug, projectId)
  );

  getCanEdit: WorkflowPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, workflowId) =>
    this.checkWorkflowPermission(workspaceSlug, projectId, workflowId, "edit")
  );

  getCanDelete: WorkflowPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, workflowId) =>
    this.checkWorkflowPermission(workspaceSlug, projectId, workflowId, "delete")
  );

  getWorkflowPermissions: WorkflowPermissions["getWorkflowPermissions"] = computedFn(
    (workspaceSlug, projectId, workflowId) => ({
      canEdit: this.getCanEdit(workspaceSlug, projectId, workflowId),
      canDelete: this.getCanDelete(workspaceSlug, projectId, workflowId),
    })
  );
}
