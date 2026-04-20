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

export interface RelationDefinitionPermissions {
  getCanView: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, relationDefinitionId: string) => boolean;
  getCanDelete: (workspaceSlug: string, relationDefinitionId: string) => boolean;
}

type RelationDefinitionPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export class RelationDefinitionPermissionsInstance implements RelationDefinitionPermissions {
  constructor(private args: RelationDefinitionPermissionsArgs) {}

  getCanView: RelationDefinitionPermissions["getCanView"] = computedFn((workspaceSlug) =>
    this.args.can({
      resource: "workitem_relation",
      action: "view",
      workspaceSlug,
    })
  );

  getCanCreate: RelationDefinitionPermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({
      resource: "workitem_relation",
      action: "create",
      workspaceSlug,
    })
  );

  getCanEdit: RelationDefinitionPermissions["getCanEdit"] = computedFn((workspaceSlug, relationDefinitionId) =>
    this.args.can({
      resource: "workitem_relation",
      action: "edit",
      workspaceSlug,
      resourceMeta: {
        resourceId: relationDefinitionId,
      },
    })
  );

  getCanDelete: RelationDefinitionPermissions["getCanDelete"] = computedFn((workspaceSlug, relationDefinitionId) =>
    this.args.can({
      resource: "workitem_relation",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: relationDefinitionId,
      },
    })
  );
}
