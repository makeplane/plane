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
// types
import type { PermissionCheckArgs } from "@plane/types";

export interface EpicUpdateCommentPermissions {
  canCreate: boolean;
  getCanEdit: (commentId: string) => boolean;
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type EpicUpdateCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  isWorkItemArchived: boolean;
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};

export class EpicUpdateCommentPermissionsInstance implements EpicUpdateCommentPermissions {
  constructor(protected args: EpicUpdateCommentPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): EpicUpdateCommentPermissions["canCreate"] {
    return (
      !this.args.isWorkItemArchived &&
      this.args.can({
        resource: "epic_update_comment",
        action: "create",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
      })
    );
  }

  getCanEdit: EpicUpdateCommentPermissions["getCanEdit"] = computedFn((commentId) => {
    return (
      !this.args.isWorkItemArchived &&
      this.args.can({
        resource: "epic_update_comment",
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

  getCanDelete: EpicUpdateCommentPermissions["getCanDelete"] = computedFn((commentId) => {
    return this.args.can({
      resource: "epic_update_comment",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    });
  });

  getCanReact: EpicUpdateCommentPermissions["getCanReact"] = computedFn((commentId) => {
    return this.args.can({
      resource: "epic_update_comment",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: commentId,
      },
    });
  });
}
