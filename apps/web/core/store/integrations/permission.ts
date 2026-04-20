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
import type { PermissionActionForResource } from "@plane/types";
// store
import type { RootStore } from "@/plane-web/store/root.store";

export interface IntegrationPermissions {
  getCanView: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, integrationId: string) => boolean;
  getCanConnect: (workspaceSlug: string, integrationId: string) => boolean;
  getCanManage: (workspaceSlug: string, integrationId: string) => boolean;
  getCanDelete: (workspaceSlug: string, integrationId: string) => boolean;
}

export class IntegrationPermissionsStore implements IntegrationPermissions {
  constructor(private rootStore: RootStore) {}

  private checkIntegrationPermission = computedFn(
    (workspaceSlug: string, integrationId: string, action: PermissionActionForResource<"integration">): boolean => {
      return this.rootStore.permissionAccessStore.can({
        resource: "integration",
        action,
        workspaceSlug,
        resourceMeta: { resourceId: integrationId },
      });
    }
  );

  // computed functions
  getCanView: IntegrationPermissions["getCanView"] = computedFn((workspaceSlug) =>
    this.rootStore.permissionAccessStore.can({
      resource: "integration",
      action: "view",
      workspaceSlug,
    })
  );

  getCanCreate: IntegrationPermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.rootStore.permissionAccessStore.can({
      resource: "integration",
      action: "create",
      workspaceSlug,
    })
  );

  getCanEdit: IntegrationPermissions["getCanEdit"] = computedFn((workspaceSlug, integrationId) =>
    this.checkIntegrationPermission(workspaceSlug, integrationId, "edit")
  );

  getCanConnect: IntegrationPermissions["getCanConnect"] = computedFn((workspaceSlug, integrationId) =>
    this.checkIntegrationPermission(workspaceSlug, integrationId, "connect")
  );

  getCanManage: IntegrationPermissions["getCanManage"] = computedFn((workspaceSlug, integrationId) =>
    this.checkIntegrationPermission(workspaceSlug, integrationId, "manage")
  );

  getCanDelete: IntegrationPermissions["getCanDelete"] = computedFn((workspaceSlug, integrationId) =>
    this.checkIntegrationPermission(workspaceSlug, integrationId, "delete")
  );
}
