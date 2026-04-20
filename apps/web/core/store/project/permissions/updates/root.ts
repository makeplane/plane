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

import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { PermissionCheckArgs } from "@plane/types";
// local imports
import { ProjectUpdateCommentPermissionsInstance } from "./comment";
import type { ProjectUpdateCommentPermissions } from "./comment";

export interface ProjectUpdatePermissions {
  canCreate: boolean;
  getCanEdit: (updateId: string) => boolean;
  getCanDelete: (updateId: string) => boolean;
  getCanReact: (updateId: string) => boolean;
  getCommentPermissions: (updateId: string) => ProjectUpdateCommentPermissions;
}

export type ProjectUpdatePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  isProjectArchived: boolean;
  getUpdateConditionContext: (updateId: string) => { creator: boolean };
  getCommentConditionContext?: (updateId: string, commentId: string) => { creator: boolean };
};

export class ProjectUpdatePermissionsInstance implements ProjectUpdatePermissions {
  constructor(protected args: ProjectUpdatePermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): ProjectUpdatePermissions["canCreate"] {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update",
        action: "create",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
      })
    );
  }

  getCanEdit: ProjectUpdatePermissions["getCanEdit"] = computedFn((updateId) => {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update",
        action: "edit",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
        resourceMeta: {
          resourceId: updateId,
          conditionContext: this.args.getUpdateConditionContext(updateId),
        },
      })
    );
  });

  getCanDelete: ProjectUpdatePermissions["getCanDelete"] = computedFn((updateId) => {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update",
        action: "delete",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
        resourceMeta: {
          resourceId: updateId,
          conditionContext: this.args.getUpdateConditionContext(updateId),
        },
      })
    );
  });

  getCanReact: ProjectUpdatePermissions["getCanReact"] = computedFn((updateId) => {
    return this.args.can({
      resource: "project_update",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: updateId,
      },
    });
  });

  getCommentPermissions: ProjectUpdatePermissions["getCommentPermissions"] = computedFn((updateId) => {
    return new ProjectUpdateCommentPermissionsInstance({
      can: this.args.can,
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      isProjectArchived: this.args.isProjectArchived,
      getCommentConditionContext: (commentId) =>
        this.args.getCommentConditionContext?.(updateId, commentId) ?? { creator: false },
    });
  });
}
