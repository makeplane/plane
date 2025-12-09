import { set, cloneDeep, isEqual } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IWorkspaceView } from "@plane/types";
// services
import { WorkspaceService } from "@/plane-web/services";
// store
import type { CoreRootStore } from "./root.store";

export interface IGlobalViewStore {
  // observables
  globalViewMap: Record<string, IWorkspaceView>;
  // computed
  currentWorkspaceViews: string[] | null;
  // computed actions
  getSearchedViews: (searchQuery: string) => string[] | null;
  getViewDetailsById: (viewId: string) => IWorkspaceView | null;
  // fetch actions
  fetchAllGlobalViews: (workspaceSlug: string) => Promise<IWorkspaceView[]>;
  fetchGlobalViewDetails: (workspaceSlug: string, viewId: string) => Promise<IWorkspaceView>;
  // crud actions
  createGlobalView: (workspaceSlug: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  updateGlobalView: (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>,
    shouldSyncFilters?: boolean
  ) => Promise<IWorkspaceView | undefined>;
  deleteGlobalView: (workspaceSlug: string, viewId: string) => Promise<any>;
}

export class GlobalViewStore implements IGlobalViewStore {
  // observables
  globalViewMap: Record<string, IWorkspaceView> = {};
  // root store
  rootStore;
  // services
  workspaceService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      globalViewMap: observable,
      // computed
      currentWorkspaceViews: computed,
      // actions
      fetchAllGlobalViews: action,
      fetchGlobalViewDetails: action,
      deleteGlobalView: action,
      updateGlobalView: action,
      createGlobalView: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();

    this.createGlobalView = this.createGlobalView.bind(this);
    this.updateGlobalView = this.updateGlobalView.bind(this);
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

  /**
   * @description returns list of views for current workspace based on search query
   * @param searchQuery
   * @returns
   */
  getSearchedViews = computedFn((searchQuery: string) => {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return null;

    return (
      Object.keys(this.globalViewMap ?? {})?.filter(
        (viewId) =>
          this.globalViewMap[viewId]?.workspace === currentWorkspaceDetails.id &&
          this.globalViewMap[viewId]?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? null
    );
  });

  /**
   * @description returns view details for given viewId
   * @param viewId
   */
  getViewDetailsById = computedFn((viewId: string): IWorkspaceView | null => this.globalViewMap[viewId] ?? null);

  /**
   * @description fetch all global views for given workspace
   * @param workspaceSlug
   */
  fetchAllGlobalViews = async (workspaceSlug: string): Promise<IWorkspaceView[]> =>
    await this.workspaceService.getAllViews(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((view) => {
          set(this.globalViewMap, view.id, view);
        });
      });
      return response;
    });

  /**
   * @description fetch view details for given viewId
   * @param viewId
   */
  fetchGlobalViewDetails = async (workspaceSlug: string, viewId: string): Promise<IWorkspaceView> =>
    await this.workspaceService.getViewDetails(workspaceSlug, viewId).then((response) => {
      runInAction(() => {
        set(this.globalViewMap, viewId, response);
      });
      return response;
    });

  /**
   * @description create new global view
   * @param workspaceSlug
   * @param data
   */
  async createGlobalView(workspaceSlug: string, data: Partial<IWorkspaceView>) {
    try {
      const response = await this.workspaceService.createView(workspaceSlug, data);
      runInAction(() => {
        set(this.globalViewMap, response.id, response);
      });

      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * @description update global view
   * @param workspaceSlug
   * @param viewId
   * @param data
   */
  async updateGlobalView(
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>,
    shouldSyncFilters: boolean = true
  ): Promise<IWorkspaceView | undefined> {
    const currentViewData = this.getViewDetailsById(viewId) ? cloneDeep(this.getViewDetailsById(viewId)) : undefined;
    try {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        set(this.globalViewMap, [viewId, currentKey], data[currentKey]);
      });

      const currentView = await this.workspaceService.updateView(workspaceSlug, viewId, data);

      // applying the filters in the global view
      if (shouldSyncFilters && !isEqual(currentViewData?.rich_filters || {}, currentView?.rich_filters || {})) {
        await this.rootStore.issue.workspaceIssuesFilter.updateFilterExpression(
          workspaceSlug,
          viewId,
          currentView?.rich_filters || {}
        );
        this.rootStore.issue.workspaceIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");
      }
      return currentView;
    } catch {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        if (currentViewData) set(this.globalViewMap, [viewId, currentKey], currentViewData[currentKey]);
      });
    }
  }

  /**
   * @description delete global view
   * @param workspaceSlug
   * @param viewId
   */
  deleteGlobalView = async (workspaceSlug: string, viewId: string): Promise<any> =>
    await this.workspaceService.deleteView(workspaceSlug, viewId).then(() => {
      runInAction(() => {
        delete this.globalViewMap[viewId];
      });
    });
}
