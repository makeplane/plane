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

export type StatePermissions = {
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, stateId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, stateId: string) => boolean;
  getCanMarkAsDefault: (workspaceSlug: string, projectId: string, stateId: string) => boolean;
  getCanDragAndDrop: (workspaceSlug: string, projectId: string, stateId: string) => boolean;
};

type StatePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export class StatePermissionsInstance implements StatePermissions {
  constructor(private args: StatePermissionsArgs) {}

  getCanCreate: StatePermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "state",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEdit: StatePermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, stateId) => {
    return this.args.can({
      resource: "state",
      action: "edit",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: stateId,
      },
    });
  });

  getCanDelete: StatePermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, stateId) => {
    return this.args.can({
      resource: "state",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: stateId,
      },
    });
  });

  getCanMarkAsDefault: StatePermissions["getCanMarkAsDefault"] = computedFn((workspaceSlug, projectId, stateId) => {
    return this.getCanEdit(workspaceSlug, projectId, stateId);
  });

  getCanDragAndDrop: StatePermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, projectId, stateId) => {
    return this.getCanEdit(workspaceSlug, projectId, stateId);
  });
}
