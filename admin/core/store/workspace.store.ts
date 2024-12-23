import set from "lodash/set";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
import { IWorkspace, TLoader, TPaginationInfo } from "@plane/types";
// services
import { WorkspaceService } from "@/services/workspace.service";
// root store
import { CoreRootStore } from "@/store/root.store";

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
}

export class WorkspaceStore implements IWorkspaceStore {
  // observables
  loader: TLoader = "init-loader";
  workspaces: Record<string, IWorkspace> = {};
  paginationInfo: TPaginationInfo | undefined = undefined;
  // services
  workspaceService;

  constructor(private store: CoreRootStore) {
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
    });
    this.workspaceService = new WorkspaceService();
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
      const paginatedWorkspaceData = await this.workspaceService.getWorkspaces();
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
      const paginatedWorkspaceData = await this.workspaceService.getWorkspaces(this.paginationInfo.next_cursor);
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
      const workspace = await this.workspaceService.createWorkspace(data);
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
}
