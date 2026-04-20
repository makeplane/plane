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

export interface FavoritePermissions {
  getCanView: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, favoriteId: string) => boolean;
  getCanDelete: (workspaceSlug: string, favoriteId: string) => boolean;
}

type FavoritePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export class FavoritePermissionsInstance implements FavoritePermissions {
  constructor(private args: FavoritePermissionsArgs) {}

  getCanView: FavoritePermissions["getCanView"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "favorite", action: "view", workspaceSlug })
  );

  getCanCreate: FavoritePermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "favorite", action: "create", workspaceSlug })
  );

  getCanEdit: FavoritePermissions["getCanEdit"] = computedFn((workspaceSlug, favoriteId) =>
    this.args.can({
      resource: "favorite",
      action: "edit",
      workspaceSlug,
      resourceMeta: { resourceId: favoriteId },
    })
  );

  getCanDelete: FavoritePermissions["getCanDelete"] = computedFn((workspaceSlug, favoriteId) =>
    this.args.can({
      resource: "favorite",
      action: "delete",
      workspaceSlug,
      resourceMeta: { resourceId: favoriteId },
    })
  );
}
