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

export interface LabelPermissions {
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, labelId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, labelId: string) => boolean;
  getCanDragAndDrop: (workspaceSlug: string, projectId: string, labelId: string) => boolean;
}

type LabelPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export class LabelPermissionsInstance implements LabelPermissions {
  constructor(private args: LabelPermissionsArgs) {}

  getCanCreate: LabelPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "label",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEdit: LabelPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, labelId) => {
    return this.args.can({
      resource: "label",
      action: "edit",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    });
  });

  getCanDelete: LabelPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, labelId) => {
    return this.args.can({
      resource: "label",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    });
  });

  getCanDragAndDrop: LabelPermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, projectId, labelId) => {
    return this.getCanEdit(workspaceSlug, projectId, labelId);
  });
}
