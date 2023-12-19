import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { RootStore } from "../root.store";
import keyBy from "lodash/keyBy";
import set from "lodash/set";
// types
import { IWorkspace } from "types";
// services
import { WorkspaceService } from "services/workspace.service";
// sub-stores
import { IWebhookStore, WebhookStore } from "./webhook.store";
import { ApiTokenStore, IApiTokenStore } from "./api-token.store";

export interface IWorkspaceRootStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  workspaces: Record<string, IWorkspace>;
  // computed
  currentWorkspace: IWorkspace | null;
  workspacesCreatedByCurrentUser: IWorkspace[] | null;
  // computed actions
  getWorkspaceBySlug: (workspaceSlug: string) => IWorkspace | null;
  getWorkspaceById: (workspaceId: string) => IWorkspace | null;
  // actions
  fetchWorkspaces: () => Promise<IWorkspace[]>;
  createWorkspace: (data: Partial<IWorkspace>) => Promise<IWorkspace>;
  updateWorkspace: (workspaceSlug: string, data: Partial<IWorkspace>) => Promise<IWorkspace>;
  deleteWorkspace: (workspaceSlug: string) => Promise<void>;
  // sub-stores
  webhook: IWebhookStore;
  apiToken: IApiTokenStore;
}

export class WorkspaceRootStore implements IWorkspaceRootStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  workspaces: Record<string, IWorkspace> = {};
  // services
  workspaceService;
  // root store
  router;
  user;
  // sub-stores
  webhook: IWebhookStore;
  apiToken: IApiTokenStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      workspaces: observable,
      // computed
      currentWorkspace: computed,
      workspacesCreatedByCurrentUser: computed,
      // computed actions
      getWorkspaceBySlug: action,
      getWorkspaceById: action,
      // actions
      fetchWorkspaces: action,
      createWorkspace: action,
      updateWorkspace: action,
      deleteWorkspace: action,
    });

    // services
    this.workspaceService = new WorkspaceService();
    // root store
    this.router = _rootStore.app.router;
    this.user = _rootStore.user;
    // sub-stores
    this.webhook = new WebhookStore(_rootStore);
    this.apiToken = new ApiTokenStore(_rootStore);
  }

  /**
   * computed value of current workspace based on workspace slug saved in the query store
   */
  get currentWorkspace() {
    const workspaceSlug = this.router.workspaceSlug;
    if (!workspaceSlug) return null;
    const workspaceDetails = Object.values(this.workspaces ?? {})?.find((w) => w.slug === workspaceSlug);
    return workspaceDetails || null;
  }

  /**
   * computed value of all the workspaces created by the current logged in user
   */
  get workspacesCreatedByCurrentUser() {
    if (!this.workspaces) return null;
    const user = this.user.currentUser;
    if (!user) return null;
    const userWorkspaces = Object.values(this.workspaces ?? {})?.filter((w) => w.created_by === user?.id);
    return userWorkspaces || null;
  }

  /**
   * get workspace info from the array of workspaces in the store using workspace slug
   * @param workspaceSlug
   */
  getWorkspaceBySlug = (workspaceSlug: string) =>
    Object.values(this.workspaces ?? {})?.find((w) => w.slug == workspaceSlug) || null;

  /**
   * get workspace info from the array of workspaces in the store using workspace id
   * @param workspaceId
   */
  getWorkspaceById = (workspaceId: string) => this.workspaces?.[workspaceId] || null; // TODO: use undefined instead of null

  /**
   * fetch user workspaces from API
   */
  fetchWorkspaces = async () => {
    const workspaceResponse = await this.workspaceService.userWorkspaces();
    runInAction(() => {
      this.workspaces = keyBy(workspaceResponse, "id");
    });
    return workspaceResponse;
  };

  /**
   * create workspace using the workspace data
   * @param data
   */
  createWorkspace = async (data: Partial<IWorkspace>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.workspaceService.createWorkspace(data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.workspaces = set(this.workspaces, response.id, response);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * update workspace using the workspace slug and new workspace data
   * @param workspaceSlug
   * @param data
   */
  updateWorkspace = async (workspaceSlug: string, data: Partial<IWorkspace>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.workspaceService.updateWorkspace(workspaceSlug, data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        set(this.workspaces, response.id, data);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * delete workspace using the workspace slug
   * @param workspaceSlug
   */
  deleteWorkspace = async (workspaceSlug: string) => {
    try {
      await this.workspaceService.deleteWorkspace(workspaceSlug);

      const updatedWorkspacesList = this.workspaces;
      const workspaceId = this.getWorkspaceBySlug(workspaceSlug)?.id;

      delete updatedWorkspacesList[`${workspaceId}`];

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.workspaces = updatedWorkspacesList;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
