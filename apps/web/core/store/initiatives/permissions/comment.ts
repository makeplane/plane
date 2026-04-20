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
import type { PermissionCheckArgs } from "@plane/types";

export interface InitiativeCommentPermissions {
  canCreate: boolean;
  getCanEdit: (commentId: string) => boolean;
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type InitiativeCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};

export class InitiativeCommentPermissionsInstance implements InitiativeCommentPermissions {
  constructor(protected args: InitiativeCommentPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "initiative_comment",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
    });
  }

  getCanEdit: InitiativeCommentPermissions["getCanEdit"] = computedFn((commentId) =>
    this.args.can({
      resource: "initiative_comment",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    })
  );

  getCanDelete: InitiativeCommentPermissions["getCanDelete"] = computedFn((commentId) =>
    this.args.can({
      resource: "initiative_comment",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    })
  );

  getCanReact: InitiativeCommentPermissions["getCanReact"] = computedFn((commentId) =>
    this.args.can({
      resource: "initiative_comment",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: commentId,
      },
    })
  );
}
