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
// local imports
import type { CollectionActionsForResource, PermissionCheckArgs } from "@plane/types";

export type ModuleMeta = {
  conditionContext: { creator: boolean };
};

export interface ModulePermissions {
  getCanViewModule: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreateModule: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditModule: (workspaceSlug: string, projectId: string, moduleId: string) => boolean;
  getCanArchiveModule: (workspaceSlug: string, projectId: string, moduleId: string) => boolean;
  getCanRestoreModule: (workspaceSlug: string, projectId: string, moduleId: string) => boolean;
  getCanDeleteModule: (workspaceSlug: string, projectId: string, moduleId: string) => boolean;
  getCanAddWorkItemsToModule: (workspaceSlug: string, projectId: string, moduleId: string) => boolean;
  getProjectIdsWithModulePermission: (
    workspaceSlug: string,
    projectIds: string[],
    action: CollectionActionsForResource<"module">
  ) => Set<string>;
}

type ModulePermissionInstanceArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getModuleMetaById: (moduleId: string) => ModuleMeta | undefined;
};

export class ModulePermissionsInstance implements ModulePermissions {
  constructor(private args: ModulePermissionInstanceArgs) {}

  getCanViewModule: ModulePermissions["getCanViewModule"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "module",
      action: "view",
      projectId,
      workspaceSlug,
    });
  });

  getCanCreateModule: ModulePermissions["getCanCreateModule"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "module",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEditModule: ModulePermissions["getCanEditModule"] = computedFn((workspaceSlug, projectId, moduleId) => {
    const moduleMeta = this.args.getModuleMetaById(moduleId);
    if (!moduleMeta) return false;
    return this.args.can({
      resource: "module",
      action: "edit",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: moduleId,
      },
    });
  });

  getCanArchiveModule: ModulePermissions["getCanArchiveModule"] = computedFn((workspaceSlug, projectId, moduleId) => {
    const moduleMeta = this.args.getModuleMetaById(moduleId);
    if (!moduleMeta) return false;
    return this.args.can({
      resource: "module",
      action: "archive",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: moduleId,
      },
    });
  });

  getCanRestoreModule: ModulePermissions["getCanRestoreModule"] = computedFn((workspaceSlug, projectId, moduleId) => {
    return this.getCanArchiveModule(workspaceSlug, projectId, moduleId);
  });

  getCanDeleteModule: ModulePermissions["getCanDeleteModule"] = computedFn((workspaceSlug, projectId, moduleId) => {
    const moduleMeta = this.args.getModuleMetaById(moduleId);
    if (!moduleMeta) return false;
    return this.args.can({
      resource: "module",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: moduleId,
        conditionContext: moduleMeta.conditionContext,
      },
    });
  });

  getCanAddWorkItemsToModule: ModulePermissions["getCanAddWorkItemsToModule"] = computedFn(
    (workspaceSlug, projectId, moduleId) => {
      const moduleMeta = this.args.getModuleMetaById(moduleId);
      if (!moduleMeta) return false;
      return (
        this.args.can({
          resource: "workitem",
          action: "create",
          projectId,
          workspaceSlug,
        }) || this.getCanEditModule(workspaceSlug, projectId, moduleId)
      );
    }
  );

  getProjectIdsWithModulePermission: ModulePermissions["getProjectIdsWithModulePermission"] = computedFn(
    (workspaceSlug, projectIds, action) =>
      new Set(projectIds.filter((projectId) => this.args.can({ resource: "module", action, projectId, workspaceSlug })))
  );
}
