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
// local imports
import { EpicUpdateCommentPermissionsInstance } from "./comment";
import type { EpicUpdateCommentPermissions } from "./comment";

export interface EpicUpdatePermissions {
  getCanCreate: () => boolean;
  getCanEdit: (updateId: string) => boolean;
  getCanDelete: (updateId: string) => boolean;
  getCanReact: (updateId: string) => boolean;
  getCommentPermissions: (updateId: string) => EpicUpdateCommentPermissions;
}

export type EpicUpdatePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  projectId: string;
  isEpicArchived: boolean;
  getUpdateConditionContext: (updateId: string) => { creator: boolean };
  getUpdateCommentConditionContext: (updateId: string, commentId: string) => { creator: boolean };
};

export class EpicUpdatePermissionsInstance implements EpicUpdatePermissions {
  constructor(private args: EpicUpdatePermissionsArgs) {}

  getCanCreate: EpicUpdatePermissions["getCanCreate"] = computedFn(() => {
    return (
      !this.args.isEpicArchived &&
      this.args.can({
        resource: "epic_update",
        action: "create",
        workspaceSlug: this.args.workspaceSlug,
        projectId: this.args.projectId,
      })
    );
  });

  getCanEdit: EpicUpdatePermissions["getCanEdit"] = computedFn((updateId) => {
    return (
      !this.args.isEpicArchived &&
      this.args.can({
        resource: "epic_update",
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

  getCanDelete: EpicUpdatePermissions["getCanDelete"] = computedFn((updateId) => {
    return (
      !this.args.isEpicArchived &&
      this.args.can({
        resource: "epic_update",
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

  getCanReact: EpicUpdatePermissions["getCanReact"] = computedFn((updateId) => {
    return this.args.can({
      resource: "epic_update",
      action: "react",
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      resourceMeta: {
        resourceId: updateId,
      },
    });
  });

  getCommentPermissions: EpicUpdatePermissions["getCommentPermissions"] = computedFn((updateId) => {
    return new EpicUpdateCommentPermissionsInstance({
      can: this.args.can,
      workspaceSlug: this.args.workspaceSlug,
      projectId: this.args.projectId,
      isWorkItemArchived: this.args.isEpicArchived,
      getCommentConditionContext: (commentId) => this.args.getUpdateCommentConditionContext(updateId, commentId),
    });
  });
}
