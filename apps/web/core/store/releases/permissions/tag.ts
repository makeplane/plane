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

export interface ReleaseTagPermissions {
  canView: boolean;
  canCreate: boolean;
  getCanEdit: (tagId: string) => boolean;
  getCanDelete: (tagId: string) => boolean;
}

type ReleaseTagPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
};

export class ReleaseTagPermissionsInstance implements ReleaseTagPermissions {
  constructor(private args: ReleaseTagPermissionsArgs) {
    makeObservable(this, {
      canView: computed,
      canCreate: computed,
    });
  }

  get canView(): boolean {
    return this.args.can({
      resource: "release",
      action: "view",
      workspaceSlug: this.args.workspaceSlug,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "release",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
    });
  }

  getCanEdit: ReleaseTagPermissions["getCanEdit"] = computedFn((tagId) =>
    this.args.can({
      resource: "release",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: tagId,
      },
    })
  );

  getCanDelete: ReleaseTagPermissions["getCanDelete"] = computedFn((tagId) =>
    this.args.can({
      resource: "release",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: tagId,
      },
    })
  );
}
