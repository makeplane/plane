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

export interface ProjectUpdateCommentPermissions {
  canCreate: boolean;
  getCanEdit: (commentId: string) => boolean;
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type ProjectUpdateCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  isProjectArchived: boolean;
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};

export class ProjectUpdateCommentPermissionsInstance implements ProjectUpdateCommentPermissions {
  constructor(protected args: ProjectUpdateCommentPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): ProjectUpdateCommentPermissions["canCreate"] {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update_comment",
        action: "create",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
      })
    );
  }

  getCanEdit: ProjectUpdateCommentPermissions["getCanEdit"] = computedFn((commentId) => {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update_comment",
        action: "edit",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
        resourceMeta: {
          resourceId: commentId,
          conditionContext: this.args.getCommentConditionContext(commentId),
        },
      })
    );
  });

  getCanDelete: ProjectUpdateCommentPermissions["getCanDelete"] = computedFn((commentId) => {
    return (
      !this.args.isProjectArchived &&
      this.args.can({
        resource: "project_update_comment",
        action: "delete",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
        resourceMeta: {
          resourceId: commentId,
          conditionContext: this.args.getCommentConditionContext(commentId),
        },
      })
    );
  });

  getCanReact: ProjectUpdateCommentPermissions["getCanReact"] = computedFn((commentId) => {
    return this.args.can({
      resource: "project_update_comment",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: commentId,
      },
    });
  });
}
