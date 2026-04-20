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

export interface InitiativeLabelPermissions {
  canCreate: boolean;
  getCanEdit: (labelId: string) => boolean;
  getCanDelete: (labelId: string) => boolean;
  getCanReorder: (labelId: string) => boolean;
}

export type InitiativeLabelPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
};

export class InitiativeLabelPermissionsInstance implements InitiativeLabelPermissions {
  constructor(private args: InitiativeLabelPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "initiative",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
    });
  }

  getCanEdit: InitiativeLabelPermissions["getCanEdit"] = computedFn((labelId) =>
    this.args.can({
      resource: "initiative",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    })
  );

  getCanDelete: InitiativeLabelPermissions["getCanDelete"] = computedFn((labelId) =>
    this.args.can({
      resource: "initiative",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: labelId,
      },
    })
  );

  getCanReorder: InitiativeLabelPermissions["getCanReorder"] = computedFn((labelId) => this.getCanEdit(labelId));
}
