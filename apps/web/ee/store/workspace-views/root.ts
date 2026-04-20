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

import { set } from "lodash-es";
import { action, runInAction } from "mobx";
import type { IWorkspaceView } from "@plane/types";
import { EViewAccess } from "@plane/types";
import type { IGlobalViewStore as ICoreGlobalViewStore } from "@/ce/store/global-view.store";
import { GlobalViewStore as CoreGlobalViewStore } from "@/ce/store/global-view.store";
import type { RootStore } from "@/ce/store/root.store";
// local imports
import { WorkspaceViewPermissionsStore } from "./permissions";
import type { WorkspaceViewPermissions } from "./permissions";
import { computedFn } from "mobx-utils";

export interface IGlobalViewStore extends ICoreGlobalViewStore {
  permissions: WorkspaceViewPermissions;
  lockView: (workspaceSlug: string, viewId: string) => Promise<void>;
  unLockView: (workspaceSlug: string, viewId: string) => Promise<void>;
  updateViewAccess: (workspaceSlug: string, viewId: string, access: EViewAccess) => Promise<void>;
}

export class GlobalViewStore extends CoreGlobalViewStore implements IGlobalViewStore {
  permissions: WorkspaceViewPermissions;

  constructor(_rootStore: RootStore) {
    super(_rootStore);
    this.permissions = new WorkspaceViewPermissionsStore({
      can: _rootStore.permissionAccessStore.can,
      getWorkspaceViewMetaById: this.getWorkspaceViewMetaById,
    });
  }

  // private helper to get workspace view meta by workspace view ID
  private getWorkspaceViewMetaById = computedFn((workspaceViewId: string) => {
    const workspaceView = this.getViewDetailsById(workspaceViewId);
    if (!workspaceView) return undefined;
    const workspaceSlug = this.rootStore.workspaceRoot.getWorkspaceById(workspaceView.workspace)?.slug;
    if (!workspaceSlug) return undefined;
    const isCreator = workspaceView.created_by === this.rootStore.user.data?.id;
    return {
      workspaceSlug,
      conditionContext: {
        creator: isCreator,
      },
    };
  });

  override createGlobalView = action(
    async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
      try {
        const response = await super.createGlobalView(workspaceSlug, data);

        if (data.access === EViewAccess.PRIVATE) {
          await this.updateViewAccess(workspaceSlug, response.id, EViewAccess.PRIVATE);
        }

        return response;
      } catch (error) {
        console.error("Failed to create global view in global view store", error);
        throw error;
      }
    }
  );

  override updateGlobalView = action(
    async (
      workspaceSlug: string,
      viewId: string,
      data: Partial<IWorkspaceView>,
      shouldSyncFilters: boolean = true
    ): Promise<IWorkspaceView | undefined> => {
      try {
        const response = await super.updateGlobalView(workspaceSlug, viewId, data, shouldSyncFilters);
        if (data.access === EViewAccess.PRIVATE) {
          await this.updateViewAccess(workspaceSlug, viewId, EViewAccess.PRIVATE);
        }
        return response;
      } catch (error) {
        console.error("Failed to update global view in global view store", error);
        throw error;
      }
    }
  );

  /** Locks view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  lockView = async (workspaceSlug: string, viewId: string) => {
    try {
      const currentView = this.getViewDetailsById(viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], true);
      });
      await this.workspaceService.lockView(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], false);
      });
    }
  };

  /**
   * unlocks View
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  unLockView = async (workspaceSlug: string, viewId: string) => {
    try {
      const currentView = this.getViewDetailsById(viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], false);
      });
      await this.workspaceService.unLockView(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], true);
      });
    }
  };

  /**
   * Updates View access
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @param access
   * @returns
   */
  updateViewAccess = async (workspaceSlug: string, viewId: string, access: EViewAccess) => {
    const currentView = this.getViewDetailsById(viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.globalViewMap, [viewId, "access"], access);
      });
      await this.workspaceService.updateViewAccess(workspaceSlug, viewId, access);
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "access"], currentAccess);
      });
    }
  };
}
