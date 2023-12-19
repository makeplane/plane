import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { set } from "lodash";
// services
import { WorkspaceService } from "services/workspace.service";
// types
import { RootStore } from "store/root.store";
import { IWorkspaceView } from "types/workspace-views";

export interface IGlobalViewStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  globalViewMap: Record<string, IWorkspaceView>;
  // computed
  currentWorkspaceViews: string[] | null;
  // computed actions
  getSearchedViews: (searchQuery: string) => string[] | null;
  getViewDetailsById: (viewId: string) => IWorkspaceView | null;
  // actions
  fetchAllGlobalViews: (workspaceSlug: string) => Promise<IWorkspaceView[]>;
  fetchGlobalViewDetails: (workspaceSlug: string, viewId: string) => Promise<IWorkspaceView>;
  createGlobalView: (workspaceSlug: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  updateGlobalView: (workspaceSlug: string, viewId: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  deleteGlobalView: (workspaceSlug: string, viewId: string) => Promise<any>;
}

export class GlobalViewStore implements IGlobalViewStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  globalViewMap: Record<string, IWorkspaceView> = {};
  // root store
  rootStore;
  // services
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      globalViewMap: observable,
      // computed
      currentWorkspaceViews: computed,
      // computed actions
      getSearchedViews: action,
      getViewDetailsById: action,
      // actions
      fetchAllGlobalViews: action,
      fetchGlobalViewDetails: action,
      createGlobalView: action,
      updateGlobalView: action,
      deleteGlobalView: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description returns list of views for current workspace
   */
  get currentWorkspaceViews() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return null;

    return (
      Object.keys(this.globalViewMap ?? {})?.filter(
        (viewId) => this.globalViewMap[viewId]?.workspace === currentWorkspaceDetails.id
      ) ?? null
    );
  }

  getSearchedViews = (searchQuery: string) => {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return null;

    return (
      Object.keys(this.globalViewMap ?? {})?.filter(
        (viewId) =>
          this.globalViewMap[viewId]?.workspace === currentWorkspaceDetails.id &&
          this.globalViewMap[viewId]?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? null
    );
  };

  /**
   * @description returns view details for given viewId
   * @param viewId
   */
  getViewDetailsById = (viewId: string): IWorkspaceView | null => this.globalViewMap[viewId] ?? null;

  /**
   * @description fetch all global views for given workspace
   * @param workspaceSlug
   */
  fetchAllGlobalViews = async (workspaceSlug: string): Promise<IWorkspaceView[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.workspaceService.getAllViews(workspaceSlug);

      runInAction(() => {
        this.loader = false;
        response.forEach((view) => {
          set(this.globalViewMap, view.id, view);
        });
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
   * @description fetch view details for given viewId
   * @param viewId
   */
  fetchGlobalViewDetails = async (workspaceSlug: string, viewId: string): Promise<IWorkspaceView> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.workspaceService.getViewDetails(workspaceSlug, viewId);

      runInAction(() => {
        this.loader = false;
        set(this.globalViewMap, viewId, response);
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
   * @description create new global view
   * @param workspaceSlug
   * @param data
   */
  createGlobalView = async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
    try {
      const response = await this.workspaceService.createView(workspaceSlug, data);

      runInAction(() => {
        set(this.globalViewMap, response.id, response);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * @description update global view
   * @param workspaceSlug
   * @param viewId
   * @param data
   */
  updateGlobalView = async (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>
  ): Promise<IWorkspaceView> => {
    const viewToUpdate = { ...this.getViewDetailsById(viewId), ...data };

    try {
      runInAction(() => {
        set(this.globalViewMap, viewId, viewToUpdate);
      });

      const response = await this.workspaceService.updateView(workspaceSlug, viewId, data);

      return response;
    } catch (error) {
      this.fetchGlobalViewDetails(workspaceSlug, viewId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * @description delete global view
   * @param workspaceSlug
   * @param viewId
   */
  deleteGlobalView = async (workspaceSlug: string, viewId: string): Promise<any> => {
    try {
      runInAction(() => {
        delete this.globalViewMap[viewId];
      });

      await this.workspaceService.deleteView(workspaceSlug, viewId);
    } catch (error) {
      this.fetchAllGlobalViews(workspaceSlug);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };
}
