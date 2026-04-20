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

export interface DraftWorkItemPermissions {
  // helpers
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, draftWorkItemId: string) => boolean;
  getCanDelete: (workspaceSlug: string, draftWorkItemId: string) => boolean;
  getCanMoveToProject: (workspaceSlug: string, projectId: string, draftWorkItemId: string) => boolean;
  getCanDuplicate: (workspaceSlug: string) => boolean;
}

export type AdditionalDraftWorkItemPermissionMeta = {
  getCanCreateWorkItemInProject: (workspaceSlug: string, projectId: string) => boolean;
};

type DraftWorkItemPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getDraftConditionContext: (draftWorkItemId: string) => { creator: boolean };
  getAdditionalDraftWorkItemPermissionMeta: (draftWorkItemId: string) => AdditionalDraftWorkItemPermissionMeta;
};

export class DraftWorkItemPermissionsInstance implements DraftWorkItemPermissions {
  constructor(private args: DraftWorkItemPermissionsArgs) {}

  getCanCreate: DraftWorkItemPermissions["getCanCreate"] = computedFn((workspaceSlug) => {
    return this.args.can({
      resource: "workspace_draft",
      action: "create",
      workspaceSlug,
    });
  });

  getCanEdit: DraftWorkItemPermissions["getCanEdit"] = computedFn((workspaceSlug, draftWorkItemId) => {
    return this.args.can({
      resource: "workspace_draft",
      action: "edit",
      workspaceSlug,
      resourceMeta: { resourceId: draftWorkItemId },
    });
  });

  getCanDelete: DraftWorkItemPermissions["getCanDelete"] = computedFn((workspaceSlug, draftWorkItemId) => {
    return this.args.can({
      resource: "workspace_draft",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: draftWorkItemId,
        conditionContext: this.args.getDraftConditionContext(draftWorkItemId),
      },
    });
  });

  getCanMoveToProject: DraftWorkItemPermissions["getCanMoveToProject"] = computedFn(
    (workspaceSlug, projectId, draftWorkItemId) => {
      const additionalMeta = this.args.getAdditionalDraftWorkItemPermissionMeta(draftWorkItemId);
      return (
        additionalMeta.getCanCreateWorkItemInProject(workspaceSlug, projectId) &&
        this.getCanEdit(workspaceSlug, draftWorkItemId)
      );
    }
  );

  getCanDuplicate: DraftWorkItemPermissions["getCanDuplicate"] = computedFn((workspaceSlug) => {
    return this.getCanCreate(workspaceSlug);
  });
}
