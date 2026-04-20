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

export interface TeamspaceCommentPermissions {
  canCreate: boolean;
  getCanEdit: (commentId: string) => boolean;
  getCanDelete: (commentId: string) => boolean;
  getCanReact: (commentId: string) => boolean;
}

export type TeamspaceCommentPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  teamspaceId: string;
  getCommentConditionContext: (commentId: string) => { creator: boolean };
};

export class TeamspaceCommentPermissionsInstance implements TeamspaceCommentPermissions {
  constructor(private args: TeamspaceCommentPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "teamspace_comment",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
    });
  }

  getCanEdit: TeamspaceCommentPermissions["getCanEdit"] = computedFn((commentId) => {
    return this.args.can({
      resource: "teamspace_comment",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    });
  });

  getCanDelete: TeamspaceCommentPermissions["getCanDelete"] = computedFn((commentId) => {
    return this.args.can({
      resource: "teamspace_comment",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
      resourceMeta: {
        resourceId: commentId,
        conditionContext: this.args.getCommentConditionContext(commentId),
      },
    });
  });

  getCanReact: TeamspaceCommentPermissions["getCanReact"] = computedFn((commentId) =>
    this.args.can({
      resource: "teamspace_comment",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
      resourceMeta: { resourceId: commentId },
    })
  );
}
