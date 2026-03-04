/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// plane imports
import { InstanceWorkspaceService } from "@plane/services";
import type { IWorkspaceBulkCreateResponse, IWorkspaceBulkAssignResponse } from "@plane/services";
import type { IWorkspace, TLoader, TPaginationInfo } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export type { IWorkspaceBulkCreateResponse, IWorkspaceBulkAssignResponse };

export interface IWorkspaceStore {
  // observables
  loader: TLoader;
  workspaces: Record<string, IWorkspace>;
  paginationInfo: TPaginationInfo | undefined;
  // computed
  workspaceIds: string[];
  // helper actions
  hydrate: (data: Record<string, IWorkspace>) => void;
  getWorkspaceById: (workspaceId: string) => IWorkspace | undefined;
  // fetch actions
  fetchWorkspaces: () => Promise<IWorkspace[]>;
  fetchNextWorkspaces: () => Promise<IWorkspace[]>;
  // curd actions
  createWorkspace: (data: IWorkspace) => Promise<IWorkspace>;
  bulkCreateWorkspaces: (workspaces: Array<{ name: string; organization_size?: string }>) => Promise<IWorkspaceBulkCreateResponse>;
  bulkAssignMembers: (members: Array<{ email: string; workspace_slug: string; role: number }>) => Promise<IWorkspaceBulkAssignResponse>;
}

export class WorkspaceStore implements IWorkspaceStore {
  // observables
  loader: TLoader = "init-loader";
  workspaces: Record<string, IWorkspace> = {};
  paginationInfo: TPaginationInfo | undefined = undefined;
  // services
  instanceWorkspaceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      workspaces: observable,
      paginationInfo: observable,
      // computed
      workspaceIds: computed,
      // helper actions
      hydrate: action,
      getWorkspaceById: action,
      // fetch actions
      fetchWorkspaces: action,
      fetchNextWorkspaces: action,
      // curd actions
      createWorkspace: action,
      bulkCreateWorkspaces: action,
      bulkAssignMembers: action,
    });
    this.instanceWorkspaceService = new InstanceWorkspaceService();
  }

  // computed
  get workspaceIds() {
    return Object.keys(this.workspaces);
  }

  // helper actions
  /**
   * @description Hydrates the workspaces
   * @param data - Record<string, IWorkspace>
   */
  hydrate = (data: Record<string, IWorkspace>) => {
    if (data) this.workspaces = data;
  };

  /**
   * @description Gets a workspace by id
   * @param workspaceId - string
   * @returns IWorkspace | undefined
   */
  getWorkspaceById = (workspaceId: string) => this.workspaces[workspaceId];

  // fetch actions
  /**
   * @description Fetches all workspaces
   * @returns Promise<>
   */
  fetchWorkspaces = async (): Promise<IWorkspace[]> => {
    try {
      if (this.workspaceIds.length > 0) {
        this.loader = "mutation";
      } else {
        this.loader = "init-loader";
      }
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list();
      runInAction(() => {
        const { results, ...paginationInfo } = paginatedWorkspaceData;
        results.forEach((workspace: IWorkspace) => {
          set(this.workspaces, [workspace.id], workspace);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return paginatedWorkspaceData.results;
    } catch (error) {
      console.error("Error fetching workspaces", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  /**
   * @description Fetches the next page of workspaces
   * @returns Promise<IWorkspace[]>
   */
  fetchNextWorkspaces = async (): Promise<IWorkspace[]> => {
    if (!this.paginationInfo || this.paginationInfo.next_page_results === false) return [];
    try {
      this.loader = "pagination";
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list(this.paginationInfo.next_cursor);
      runInAction(() => {
        const { results, ...paginationInfo } = paginatedWorkspaceData;
        results.forEach((workspace: IWorkspace) => {
          set(this.workspaces, [workspace.id], workspace);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return paginatedWorkspaceData.results;
    } catch (error) {
      console.error("Error fetching next workspaces", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  // curd actions
  /**
   * @description Creates a new workspace
   * @param data - IWorkspace
   * @returns Promise<IWorkspace>
   */
  createWorkspace = async (data: IWorkspace): Promise<IWorkspace> => {
    try {
      this.loader = "mutation";
      const workspace = await this.instanceWorkspaceService.create(data);
      runInAction(() => {
        set(this.workspaces, [workspace.id], workspace);
      });
      return workspace;
    } catch (error) {
      console.error("Error creating workspace", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  /**
   * @description Bulk creates workspaces from a parsed Excel row array.
   * Uses the InstanceWorkspaceService.bulkCreate() method.
   */
  bulkCreateWorkspaces = async (
    workspaces: Array<{ name: string; organization_size?: string }>
  ): Promise<IWorkspaceBulkCreateResponse> => {
    try {
      this.loader = "mutation";
      const result = await this.instanceWorkspaceService.bulkCreate(workspaces);
      runInAction(() => {
        result.created.forEach((ws: IWorkspace) => set(this.workspaces, [ws.id], ws));
      });
      return result;
    } catch (error) {
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  bulkAssignMembers = async (
    members: Array<{ email: string; workspace_slug: string; role: number }>
  ): Promise<IWorkspaceBulkAssignResponse> => {
    try {
      return await this.instanceWorkspaceService.bulkAssignMembers(members);
    } catch (error) {
      throw error;
    }
  };
}
