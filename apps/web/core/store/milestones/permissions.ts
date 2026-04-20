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

export type MilestonePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export interface MilestonePermissions {
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, milestoneId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, milestoneId: string) => boolean;
  getCanAddWorkItems: (workspaceSlug: string, projectId: string, milestoneId: string) => boolean;
  getCanRemoveWorkItems: (workspaceSlug: string, projectId: string, milestoneId: string) => boolean;
}

export class MilestonePermissionsInstance implements MilestonePermissions {
  constructor(private args: MilestonePermissionsArgs) {}

  // private helper to check milestone permissions
  private checkMilestonePermission = computedFn(
    (workspaceSlug: string, projectId: string, milestoneId: string, action: "edit" | "delete"): boolean => {
      return this.args.can({
        resource: "milestone",
        action,
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: milestoneId,
        },
      });
    }
  );

  getCanView: MilestonePermissions["getCanView"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "milestone",
      action: "view",
      projectId,
      workspaceSlug,
    });
  });

  getCanCreate: MilestonePermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "milestone",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEdit: MilestonePermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, milestoneId) => {
    return this.checkMilestonePermission(workspaceSlug, projectId, milestoneId, "edit");
  });

  getCanDelete: MilestonePermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, milestoneId) => {
    return this.checkMilestonePermission(workspaceSlug, projectId, milestoneId, "delete");
  });

  getCanAddWorkItems: MilestonePermissions["getCanAddWorkItems"] = computedFn(
    (workspaceSlug, projectId, milestoneId) => {
      return this.getCanEdit(workspaceSlug, projectId, milestoneId);
    }
  );

  getCanRemoveWorkItems: MilestonePermissions["getCanRemoveWorkItems"] = computedFn(
    (workspaceSlug, projectId, milestoneId) => {
      return this.getCanEdit(workspaceSlug, projectId, milestoneId);
    }
  );
}
