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
import type { CollectionActionsForResource } from "@plane/types";
// local imports
import type { CycleStore } from "./cycle.store";
import type { CoreRootStore } from "../root.store";

export interface CyclePermissions {
  getCanViewCycle: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreateCycle: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanArchiveCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanRestoreCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanDeleteCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanAddWorkItemsToCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanTransferWorkItemsFromCycle: (workspaceSlug: string, projectId: string, cycleId: string) => boolean;
  getCanEditCycleFilters: (workspaceSlug: string, projectId: string) => boolean;
  getProjectIdsWithCyclePermission: (
    workspaceSlug: string,
    projectIds: string[],
    action: CollectionActionsForResource<"cycle">
  ) => Set<string>;
}

export class CyclePermissionsInstance implements CyclePermissions {
  rootStore: CoreRootStore;
  cyclesStore: CycleStore;

  constructor(rootStore: CoreRootStore, cyclesStore: CycleStore) {
    this.rootStore = rootStore;
    this.cyclesStore = cyclesStore;
  }

  private getCycleConditionContext(cycleId: string): { creator: boolean } {
    const cycle = this.cyclesStore.getCycleById(cycleId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(cycle?.created_by && currentUserId && cycle.created_by === currentUserId) };
  }

  getCanViewCycle: CyclePermissions["getCanViewCycle"] = computedFn((workspaceSlug, projectId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "cycle",
      action: "view",
      projectId,
      workspaceSlug,
    });
  });

  getCanCreateCycle: CyclePermissions["getCanCreateCycle"] = computedFn((workspaceSlug, projectId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "cycle",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEditCycle: CyclePermissions["getCanEditCycle"] = computedFn((workspaceSlug, projectId, cycleId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "cycle",
      action: "edit",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: cycleId,
      },
    });
  });

  getCanArchiveCycle: CyclePermissions["getCanArchiveCycle"] = computedFn((workspaceSlug, projectId, cycleId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "cycle",
      action: "archive",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: cycleId,
      },
    });
  });

  getCanRestoreCycle: CyclePermissions["getCanRestoreCycle"] = computedFn((workspaceSlug, projectId, cycleId) => {
    return this.getCanArchiveCycle(workspaceSlug, projectId, cycleId);
  });

  getCanDeleteCycle: CyclePermissions["getCanDeleteCycle"] = computedFn((workspaceSlug, projectId, cycleId) => {
    return this.rootStore.permissionAccessStore.can({
      resource: "cycle",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: cycleId,
        conditionContext: this.getCycleConditionContext(cycleId),
      },
    });
  });

  getCanAddWorkItemsToCycle: CyclePermissions["getCanAddWorkItemsToCycle"] = computedFn(
    (workspaceSlug, projectId, cycleId) => {
      return (
        this.rootStore.permissionAccessStore.can({
          resource: "workitem",
          action: "create",
          projectId,
          workspaceSlug,
        }) || this.getCanEditCycle(workspaceSlug, projectId, cycleId)
      );
    }
  );

  getCanTransferWorkItemsFromCycle: CyclePermissions["getCanTransferWorkItemsFromCycle"] = computedFn(
    (workspaceSlug, projectId, cycleId) => {
      return this.getCanEditCycle(workspaceSlug, projectId, cycleId);
    }
  );

  getCanEditCycleFilters: CyclePermissions["getCanEditCycleFilters"] = computedFn((workspaceSlug, projectId) => {
    return this.getCanCreateCycle(workspaceSlug, projectId);
  });

  getProjectIdsWithCyclePermission: CyclePermissions["getProjectIdsWithCyclePermission"] = computedFn(
    (workspaceSlug, projectIds, action) =>
      new Set(
        projectIds.filter((projectId) =>
          this.rootStore.permissionAccessStore.can({
            resource: "cycle",
            action,
            projectId,
            workspaceSlug,
          })
        )
      )
  );
}
