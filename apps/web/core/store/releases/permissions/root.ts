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
import type { PermissionCheckArgs } from "@plane/types";
import { ReleaseTagPermissionsInstance } from "./tag";
import { ReleaseLabelPermissionsInstance } from "./label";

export interface ReleasePermissions {
  canView: boolean;
  canCreate: boolean;
  getCanEdit: (releaseId: string) => boolean;
  getCanDelete: (releaseId: string) => boolean;
  getTagPermissions: () => ReleaseTagPermissionsInstance;
  getLabelPermissions: () => ReleaseLabelPermissionsInstance;
}

type ReleasePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
};

export class ReleasePermissionsInstance implements ReleasePermissions {
  constructor(private args: ReleasePermissionsArgs) {}

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

  getCanEdit: ReleasePermissions["getCanEdit"] = computedFn((releaseId) =>
    this.args.can({
      resource: "release",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: releaseId,
      },
    })
  );

  getCanDelete: ReleasePermissions["getCanDelete"] = computedFn((releaseId) =>
    this.args.can({
      resource: "release",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      resourceMeta: {
        resourceId: releaseId,
      },
    })
  );

  getTagPermissions: ReleasePermissions["getTagPermissions"] = computedFn(
    () =>
      new ReleaseTagPermissionsInstance({
        can: this.args.can,
        workspaceSlug: this.args.workspaceSlug,
      })
  );

  getLabelPermissions: ReleasePermissions["getLabelPermissions"] = computedFn(
    () =>
      new ReleaseLabelPermissionsInstance({
        can: this.args.can,
        workspaceSlug: this.args.workspaceSlug,
      })
  );
}
