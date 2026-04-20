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

export interface WorkspaceLabelPermissions {
  canCreate: boolean;
  getCanEdit: (labelId: string) => boolean;
  getCanDelete: (labelId: string) => boolean;
  getCanReorder: (labelId: string) => boolean;
}

export type WorkspaceLabelPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
};

export class WorkspaceLabelPermissionsInstance implements WorkspaceLabelPermissions {
  constructor(private args: WorkspaceLabelPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "workspace",
      action: "manage",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: this.args.workspaceSlug,
      },
    });
  }

  getCanEdit: WorkspaceLabelPermissions["getCanEdit"] = computedFn((labelId) =>
    this.args.can({
      resource: "workspace",
      action: "manage",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    })
  );

  getCanDelete: WorkspaceLabelPermissions["getCanDelete"] = computedFn((labelId) =>
    this.args.can({
      resource: "workspace",
      action: "manage",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    })
  );

  getCanReorder: WorkspaceLabelPermissions["getCanReorder"] = computedFn((labelId) => this.getCanEdit(labelId));
}
