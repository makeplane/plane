import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { IIssueFilterOptions, IWorkspaceView } from "@plane/types";
// constants
import { EIssueFilterType } from "@/constants/issue";
import { EViewAccess } from "@/constants/views";
// services
import { WorkspaceService } from "@/plane-web/services";
// store
import { CoreRootStore } from "./root.store";

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
    data: Partial<IWorkspaceView>
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
  createGlobalView = async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
    const response = await this.workspaceService.createView(workspaceSlug, data);
    runInAction(() => {
      set(this.globalViewMap, response.id, response);
    });

    if (data.access === EViewAccess.PRIVATE) {
      await this.updateViewAccess(workspaceSlug, response.id, EViewAccess.PRIVATE);
    }

    return response;
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
  ): Promise<IWorkspaceView | undefined> => {
    const currentViewData = this.getViewDetailsById(viewId) ? cloneDeep(this.getViewDetailsById(viewId)) : undefined;
    try {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        set(this.globalViewMap, [viewId, currentKey], data[currentKey]);
      });

      const promiseRequests = [];
      promiseRequests.push(this.workspaceService.updateView(workspaceSlug, viewId, data));

      if (data.access !== undefined && data.access !== currentViewData?.access) {
        promiseRequests.push(this.updateViewAccess(workspaceSlug, viewId, data.access));
      }

      const [currentView] = await Promise.all(promiseRequests);

      // applying the filters in the global view
      if (!isEqual(currentViewData?.filters || {}, currentView?.filters || {})) {
        if (isEmpty(currentView?.filters)) {
          const currentGlobalViewFilters: IIssueFilterOptions = this.rootStore.issue.workspaceIssuesFilter.filters[
            viewId
          ].filters as IIssueFilterOptions;
          const newFilters: IIssueFilterOptions = {};
          Object.keys(currentGlobalViewFilters ?? {}).forEach((key) => {
            newFilters[key as keyof IIssueFilterOptions] = [];
          });
          await this.rootStore.issue.workspaceIssuesFilter.updateFilters(
            workspaceSlug,
            undefined,
            EIssueFilterType.FILTERS,
            newFilters,
            viewId
          );
        } else {
          await this.rootStore.issue.workspaceIssuesFilter.updateFilters(
            workspaceSlug,
            undefined,
            EIssueFilterType.FILTERS,
            currentView?.filters,
            viewId
          );
        }
        this.rootStore.issue.workspaceIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");
      }
      return currentView as IWorkspaceView;
    } catch {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        if (currentViewData) set(this.globalViewMap, [viewId, currentKey], currentViewData[currentKey]);
      });
    }
  };

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
