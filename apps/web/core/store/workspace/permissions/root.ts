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
// plane imports
import type { PermissionCheckArgs } from "@plane/types";
import { canManageWorkspaceRole } from "@plane/utils";
// helpers
import { getIsWorkspaceCreationDisabled } from "@/helpers/workspace";
import { WorkspaceLabelPermissionsInstance } from "./label";

export interface WorkspacePermissions {
  getCanCreate: () => boolean;
  getCanView: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string) => boolean;
  getCanDelete: (workspaceSlug: string) => boolean;
  getCanManage: (workspaceSlug: string) => boolean;
  getCanViewMembers: (workspaceSlug: string) => boolean;
  getCanChangeRole: (workspaceSlug: string, targetRoleSlug: string) => boolean;
  getCanRemoveMember: (workspaceSlug: string) => boolean;
  getCanImportMembers: (workspaceSlug: string) => boolean;
  getCanViewInvitations: (workspaceSlug: string) => boolean;
  getCanInviteMembers: (workspaceSlug: string) => boolean;
  getCanRemoveInvitation: (workspaceSlug: string) => boolean;
  getCanViewBilling: (workspaceSlug: string) => boolean;
  getCanManageBilling: (workspaceSlug: string) => boolean;
  getCanViewWorkspaceWorklogs: (workspaceSlug: string) => boolean;
  getCanJoinAnyProject: (workspaceSlug: string) => boolean;
  getLabelPermissions: (workspaceSlug: string) => WorkspaceLabelPermissionsInstance;
}

type WorkspacePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getCurrentUserRoleSlug: (workspaceSlug: string) => string | null | undefined;
};

export class WorkspacePermissionsInstance implements WorkspacePermissions {
  constructor(private args: WorkspacePermissionsArgs) {}

  getCanCreate = computedFn(() => {
    return getIsWorkspaceCreationDisabled() === false;
  });

  getCanView = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace",
      action: "view",
      workspaceSlug,
    });
  });

  getCanEdit = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace",
      action: "edit",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanDelete = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace",
      action: "delete",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanManage = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace",
      action: "manage",
      workspaceSlug,
      resourceMeta: {
        resourceId: workspaceSlug,
      },
    });
  });

  getCanViewMembers = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_member",
      action: "view",
      workspaceSlug,
    });
  });

  getCanChangeRole = computedFn((workspaceSlug: string, targetRoleSlug: string) => {
    const hasPermission = this.args.can({
      resource: "workspace_member",
      action: "change_role",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
    if (!hasPermission) return false;
    return canManageWorkspaceRole(this.args.getCurrentUserRoleSlug(workspaceSlug), targetRoleSlug);
  });

  getCanRemoveMember = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_member",
      action: "remove",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanImportMembers = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_member",
      action: "import",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanViewInvitations = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_member",
      action: "invite",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanInviteMembers = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_member",
      action: "invite",
      workspaceSlug,
      resourceMeta: { resourceId: workspaceSlug },
    });
  });

  getCanRemoveInvitation = computedFn((workspaceSlug: string) => {
    return this.getCanInviteMembers(workspaceSlug);
  });

  getCanViewBilling = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "billing",
      action: "view",
      workspaceSlug,
    });
  });

  getCanManageBilling = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "billing",
      action: "manage",
      workspaceSlug,
      resourceMeta: {
        resourceId: workspaceSlug,
      },
    });
  });

  getCanViewWorkspaceWorklogs = computedFn((workspaceSlug: string) => {
    return this.args.can({
      resource: "workspace_worklog",
      action: "view",
      workspaceSlug,
    });
  });

  getCanJoinAnyProject = computedFn((workspaceSlug: string) => {
    return this.getCanEdit(workspaceSlug);
  });

  getLabelPermissions = computedFn((workspaceSlug: string) => {
    return new WorkspaceLabelPermissionsInstance({
      can: this.args.can,
      workspaceSlug,
    });
  });
}
