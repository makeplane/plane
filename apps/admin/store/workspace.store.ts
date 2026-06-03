/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// plane imports
import { InstanceWorkspaceService } from "@plane/services";
import type {
  IWorkspaceBulkCreateResponse,
  IWorkspaceBulkAssignResponse,
  IWorkspaceBulkRemoveResponse,
  IWorkspaceProjectBulkImportResponse,
  IWorkspaceProjectExportResponse,
  IWorkspaceModuleBulkImportResponse,
  IWorkspaceOwnerOptionsResponse,
  TWorkspaceCreatePayload,
} from "@plane/services";
import type { IWorkspace, TLoader, TPaginationInfo } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export type {
  IWorkspaceBulkCreateResponse,
  IWorkspaceBulkAssignResponse,
  IWorkspaceBulkRemoveResponse,
  IWorkspaceProjectBulkImportResponse,
  IWorkspaceProjectExportResponse,
  IWorkspaceModuleBulkImportResponse,
  IWorkspaceOwnerOptionsResponse,
};

export interface IWorkspaceStore {
  // observables
  loader: TLoader;
  workspaces: Record<string, IWorkspace>;
  paginationInfo: TPaginationInfo | undefined;
  searchQuery: string;
  ownerOptions: IWorkspaceOwnerOptionsResponse | undefined;
  // computed
  workspaceIds: string[];
  // helper actions
  hydrate: (data: Record<string, IWorkspace>) => void;
  getWorkspaceById: (workspaceId: string) => IWorkspace | undefined;
  // fetch actions
  fetchWorkspaces: (search?: string) => Promise<IWorkspace[]>;
  fetchNextWorkspaces: () => Promise<IWorkspace[]>;
  fetchAllWorkspaces: () => Promise<void>;
  fetchOwnerOptions: (search?: string) => Promise<IWorkspaceOwnerOptionsResponse>;
  // curd actions
  createWorkspace: (data: TWorkspaceCreatePayload) => Promise<IWorkspace>;
  bulkCreateWorkspaces: (
    workspaces: Array<{ name: string; organization_size?: string }>
  ) => Promise<IWorkspaceBulkCreateResponse>;
  bulkAssignMembers: (
    members: Array<{ email: string; workspace_slug: string; role: number }>
  ) => Promise<IWorkspaceBulkAssignResponse>;
  bulkRemoveMembers: (
    members: Array<{ workspace_slug: string; email: string }>
  ) => Promise<IWorkspaceBulkRemoveResponse>;
  bulkImportProjects: (
    projects: Array<{
      workspace_slug: string;
      name: string;
      description?: string;
      network?: number;
      project_leader?: string;
      members?: string;
      member_roles?: string;
    }>
  ) => Promise<IWorkspaceProjectBulkImportResponse>;
  exportProjects: (workspaceSlugs?: string[]) => Promise<IWorkspaceProjectExportResponse>;
  bulkImportModules: (
    modules: Array<{
      workspace_slug: string;
      project_name: string;
      name: string;
      description?: string;
      status?: string;
      start_date?: string;
      target_date?: string;
    }>
  ) => Promise<IWorkspaceModuleBulkImportResponse>;
  deleteWorkspace: (workspaceId: string, workspaceSlug: string) => Promise<void>;
}

export class WorkspaceStore implements IWorkspaceStore {
  // observables
  loader: TLoader = "init-loader";
  workspaces: Record<string, IWorkspace> = {};
  paginationInfo: TPaginationInfo | undefined = undefined;
  searchQuery: string = "";
  ownerOptions: IWorkspaceOwnerOptionsResponse | undefined = undefined;
  // services
  instanceWorkspaceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      workspaces: observable,
      paginationInfo: observable,
      searchQuery: observable,
      ownerOptions: observable,
      // computed
      workspaceIds: computed,
      // helper actions
      hydrate: action,
      getWorkspaceById: action,
      // fetch actions
      fetchWorkspaces: action,
      fetchNextWorkspaces: action,
      fetchAllWorkspaces: action,
      fetchOwnerOptions: action,
      // curd actions
      createWorkspace: action,
      bulkCreateWorkspaces: action,
      bulkAssignMembers: action,
      bulkRemoveMembers: action,
      bulkImportProjects: action,
      exportProjects: action,
      bulkImportModules: action,
      deleteWorkspace: action,
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
  fetchWorkspaces = async (search?: string): Promise<IWorkspace[]> => {
    try {
      const isNewSearch = search !== undefined && search !== this.searchQuery;
      if (isNewSearch || this.workspaceIds.length === 0) {
        this.loader = "init-loader";
      } else {
        this.loader = "mutation";
      }
      if (search !== undefined) this.searchQuery = search;
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list({ search: this.searchQuery });
      runInAction(() => {
        const { results, ...paginationInfo } = paginatedWorkspaceData;
        if (isNewSearch) this.workspaces = {};
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
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list({
        search: this.searchQuery,
        cursor: this.paginationInfo.next_cursor,
      });
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

  /**
   * @description Fetches all workspaces across all pages
   */
  fetchAllWorkspaces = async (): Promise<void> => {
    await this.fetchWorkspaces();
    while (this.paginationInfo?.next_page_results) {
      await this.fetchNextWorkspaces();
    }
  };

  /**
   * @description Fetches the default owner (the General Director) + candidate
   * users for the create-workspace owner picker
   * @param search - optional staff-directory search query
   */
  fetchOwnerOptions = async (search?: string): Promise<IWorkspaceOwnerOptionsResponse> => {
    const options = await this.instanceWorkspaceService.getOwnerOptions(search);
    runInAction(() => {
      this.ownerOptions = options;
    });
    return options;
  };

  // curd actions
  /**
   * @description Creates a new workspace
   * @param data - workspace payload (optional owner_id; backend defaults owner to the GD)
   * @returns Promise<IWorkspace>
   */
  createWorkspace = async (data: TWorkspaceCreatePayload): Promise<IWorkspace> => {
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
    this.loader = "mutation";
    try {
      const result = await this.instanceWorkspaceService.bulkCreate(workspaces);
      runInAction(() => {
        result.created.forEach((ws: IWorkspace) => set(this.workspaces, [ws.id], ws));
      });
      return result;
    } finally {
      this.loader = "loaded";
    }
  };

  bulkAssignMembers = (
    members: Array<{ email: string; workspace_slug: string; role: number }>
  ): Promise<IWorkspaceBulkAssignResponse> => {
    return this.instanceWorkspaceService.bulkAssignMembers(members);
  };

  bulkRemoveMembers = (
    members: Array<{ workspace_slug: string; email: string }>
  ): Promise<IWorkspaceBulkRemoveResponse> => {
    return this.instanceWorkspaceService.bulkRemoveMembers(members);
  };

  bulkImportProjects = (
    projects: Array<{
      workspace_slug: string;
      name: string;
      description?: string;
      network?: number;
      project_leader?: string;
      members?: string;
      member_roles?: string;
    }>
  ): Promise<IWorkspaceProjectBulkImportResponse> => {
    return this.instanceWorkspaceService.bulkImportProjects(projects);
  };

  exportProjects = (workspaceSlugs?: string[]): Promise<IWorkspaceProjectExportResponse> => {
    return this.instanceWorkspaceService.exportProjects(workspaceSlugs);
  };

  bulkImportModules = (
    modules: Array<{
      workspace_slug: string;
      project_name: string;
      name: string;
      description?: string;
      status?: string;
      start_date?: string;
      target_date?: string;
    }>
  ): Promise<IWorkspaceModuleBulkImportResponse> => {
    return this.instanceWorkspaceService.bulkImportModules(modules);
  };

  deleteWorkspace = async (workspaceId: string, workspaceSlug: string): Promise<void> => {
    await this.instanceWorkspaceService.destroy(workspaceSlug);
    runInAction(() => {
      delete this.workspaces[workspaceId];
    });
  };
}
