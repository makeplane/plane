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

export interface IntakeWorkItemCommentPermissions {
  canCreate: boolean;
  getCanEdit: (commentId: string) => boolean;
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type IntakeWorkItemCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};

export class WorkItemCommentPermissionsInstance implements IntakeWorkItemCommentPermissions {
  constructor(protected args: IntakeWorkItemCommentPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): IntakeWorkItemCommentPermissions["canCreate"] {
    return this.args.can({
      resource: "comment",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
    });
  }

  getCanEdit: IntakeWorkItemCommentPermissions["getCanEdit"] = computedFn((commentId) => {
    return this.args.can({
      resource: "comment",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    });
  });

  getCanDelete: IntakeWorkItemCommentPermissions["getCanDelete"] = computedFn((commentId) => {
    return this.args.can({
      resource: "comment",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    });
  });

  getCanReact: IntakeWorkItemCommentPermissions["getCanReact"] = computedFn((commentId) => {
    return this.args.can({
      resource: "comment",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: { resourceId: commentId },
    });
  });
}
