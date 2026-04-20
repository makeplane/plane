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

export interface CustomerRequestPermissions {
  canCreate: boolean;
  getCanEdit: (requestId: string) => boolean;
  getCanDelete: (requestId: string) => boolean;
  getCanAddAttachment: (requestId: string) => boolean;
  getCanDeleteAttachment: (requestId: string) => boolean;
}

export type CustomerRequestPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  customerId: string;
};

export class CustomerRequestPermissionsInstance implements CustomerRequestPermissions {
  constructor(private args: CustomerRequestPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({ resource: "customer", action: "create", workspaceSlug: this.args.workspaceSlug });
  }

  getCanEdit: CustomerRequestPermissions["getCanEdit"] = computedFn((requestId: string) => {
    return this.args.can({
      resource: "customer",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: requestId,
      },
    });
  });

  getCanDelete: CustomerRequestPermissions["getCanDelete"] = computedFn((requestId: string) => {
    return this.args.can({
      resource: "customer",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: requestId,
      },
    });
  });

  getCanAddAttachment: CustomerRequestPermissions["getCanAddAttachment"] = computedFn((requestId: string) => {
    return this.getCanEdit(requestId);
  });

  getCanDeleteAttachment: CustomerRequestPermissions["getCanDeleteAttachment"] = computedFn((requestId: string) => {
    return this.getCanDelete(requestId);
  });
}
