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
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { GroupSyncConfig, GroupMap, TLoader } from "@plane/types";
// services
import { GroupSyncService } from "@/services/group-sync.service";

import type { CoreRootStore } from "./root.store";

export interface IGroupSyncStore {
  // computed functions
  getLoader: () => TLoader;
  getGroupSyncConfigByWorkspaceSlug: (workspaceSlug: string) => GroupSyncConfig | undefined;
  getMappingsByWorkspaceSlug: (workspaceSlug: string) => GroupMap[] | undefined;
  // actions
  fetchGroupSyncConfigByWorkspaceSlug: (workspaceSlug: string) => Promise<void>;
  updateGroupSyncConfigByWorkspaceSlug: (workspaceSlug: string, payload: Partial<GroupSyncConfig>) => Promise<void>;
  fetchGroupMappingsByWorkspaceSlug: (workspaceSlug: string) => Promise<void>;
  createGroupMappingByWorkspaceSlug: (workspaceSlug: string, payload: Partial<GroupMap>) => Promise<void>;
  updateGroupMappingByWorkspaceSlug: (
    workspaceSlug: string,
    mappingId: string,
    payload: Partial<GroupMap>
  ) => Promise<void>;
  deleteGroupMappingByWorkspaceSlug: (workspaceSlug: string, mappingId: string) => Promise<void>;
}

export class GroupSyncStore implements IGroupSyncStore {
  // observables
  private loader: TLoader = undefined;
  private groupSyncConfig: Record<string, GroupSyncConfig> = {};
  private groupMappings: Record<string, GroupMap[]> = {};
  // service
  groupSyncService: GroupSyncService;

  constructor(protected store: CoreRootStore) {
    // service
    this.groupSyncService = new GroupSyncService();
    // observables
    makeObservable<GroupSyncStore, "loader" | "groupSyncConfig" | "groupMappings">(this, {
      // observables
      loader: observable.ref,
      groupSyncConfig: observable,
      groupMappings: observable,
      // actions
      fetchGroupSyncConfigByWorkspaceSlug: action,
      updateGroupSyncConfigByWorkspaceSlug: action,
      fetchGroupMappingsByWorkspaceSlug: action,
      createGroupMappingByWorkspaceSlug: action,
      updateGroupMappingByWorkspaceSlug: action,
      deleteGroupMappingByWorkspaceSlug: action,
    });
  }

  // computed functions
  /**
   * Get group mappings loader
   */
  getLoader = computedFn(() => this.loader);

  /**
   * Get group sync
   * @param workspaceSlug
   */
  getGroupSyncConfigByWorkspaceSlug = computedFn((workspaceSlug: string) => this.groupSyncConfig[workspaceSlug]);

  /**
   * Get group mappings
   * @param workspaceSlug
   */
  getMappingsByWorkspaceSlug = computedFn((workspaceSlug: string) => this.groupMappings[workspaceSlug]);

  fetchGroupSyncConfigByWorkspaceSlug = async (workspaceSlug: string): Promise<void> => {
    try {
      const response = await this.groupSyncService.fetchGroupSyncConfigByWorkspaceSlug(workspaceSlug);

      runInAction(() => {
        set(this.groupSyncConfig, workspaceSlug, response);
      });
    } catch (error) {
      console.error("group syncing --> fetchGroupSyncConfigByWorkspaceSlug", error);
      throw error;
    }
  };

  updateGroupSyncConfigByWorkspaceSlug = async (
    workspaceSlug: string,
    payload: Partial<GroupSyncConfig>
  ): Promise<void> => {
    try {
      const initialData = { ...this.groupSyncConfig[workspaceSlug] };
      runInAction(() => {
        set(this.groupSyncConfig, workspaceSlug, { ...initialData, ...payload });
      });

      const response = await this.groupSyncService.updateGroupSyncConfigByWorkspaceSlug(workspaceSlug, payload);
      runInAction(() => {
        set(this.groupSyncConfig, workspaceSlug, response);
      });
    } catch (error) {
      console.error("group syncing --> updateGroupSyncConfigByWorkspaceSlug", error);
      void this.fetchGroupSyncConfigByWorkspaceSlug(workspaceSlug);
      throw error;
    }
  };

  fetchGroupMappingsByWorkspaceSlug = async (workspaceSlug: string): Promise<void> => {
    const hasMappings = this.groupMappings[workspaceSlug];
    try {
      runInAction(() => {
        this.loader = hasMappings ? "mutation" : "init-loader";
      });

      const mappings = await this.groupSyncService.fetchGroupMappingsByWorkspaceSlug(workspaceSlug);

      runInAction(() => {
        set(this.groupMappings, workspaceSlug, mappings);
      });
    } catch (error) {
      if (!hasMappings) runInAction(() => set(this.groupMappings, workspaceSlug, []));
      console.error("group syncing --> fetchGroupMappingsByWorkspaceSlug", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  createGroupMappingByWorkspaceSlug = async (workspaceSlug: string, payload: Partial<GroupMap>): Promise<void> => {
    try {
      const mapping = await this.groupSyncService.createGroupMappingByWorkspaceSlug(workspaceSlug, payload);

      runInAction(() => {
        const list = this.groupMappings[workspaceSlug] ?? [];
        set(this.groupMappings, workspaceSlug, [...list, mapping]);
      });
    } catch (error) {
      console.error("group syncing --> createGroupMappingByWorkspaceSlug", error);
      throw error;
    }
  };

  updateGroupMappingByWorkspaceSlug = async (
    workspaceSlug: string,
    mappingId: string,
    payload: Partial<GroupMap>
  ): Promise<void> => {
    try {
      const mapping = await this.groupSyncService.updateGroupMappingByWorkspaceSlug(workspaceSlug, mappingId, payload);

      runInAction(() => {
        const list = this.groupMappings[workspaceSlug] ?? [];
        const index = list.findIndex((m) => m.id === mappingId);
        if (index >= 0) {
          const next = [...list];
          next[index] = mapping;
          set(this.groupMappings, workspaceSlug, next);
        }
      });
    } catch (error) {
      console.error("group syncing --> updateGroupMappingByWorkspaceSlug", error);
      throw error;
    }
  };

  deleteGroupMappingByWorkspaceSlug = async (workspaceSlug: string, mappingId: string): Promise<void> => {
    try {
      await this.groupSyncService.deleteGroupMappingByWorkspaceSlug(workspaceSlug, mappingId);

      runInAction(() => {
        const list = this.groupMappings[workspaceSlug] ?? [];
        set(
          this.groupMappings,
          workspaceSlug,
          list.filter((m) => m.id !== mappingId)
        );
      });
    } catch (error) {
      console.error("group syncing --> deleteGroupMappingByWorkspaceSlug", error);
      throw error;
    }
  };
}
