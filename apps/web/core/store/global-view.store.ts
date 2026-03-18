/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, cloneDeep, isEqual } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { IWorkspaceView } from "@plane/types";
// services
import { WorkspaceService } from "@/services/workspace.service";
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
  deleteGlobalView: (workspaceSlug: string, viewId: string) => Promise<void>;
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
      // computed values
      currentWorkspaceViews: computed,
      // actions
      fetchAllGlobalViews: action,
      fetchGlobalViewDetails: action,
      createGlobalView: action,
      updateGlobalView: action,
      deleteGlobalView: action,
    });
    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description computed value to get workspace views from the global store
   */
  get currentWorkspaceViews() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return null;
    const workspaceViewsList = Object.keys(this.globalViewMap).filter((viewId) => {
      const view = this.globalViewMap[viewId];
      return view && view.workspace === currentWorkspace.id;
    });
    return workspaceViewsList;
  }

  /**
   * @description search views by query
   * @param searchQuery
   */
  getSearchedViews = (searchQuery: string) => {
    if (!searchQuery) return this.currentWorkspaceViews;
    if (!this.currentWorkspaceViews) return null;
    return this.currentWorkspaceViews.filter((viewId) => {
      const view = this.globalViewMap[viewId];
      return view && view.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  /**
   * @description get view details by view id
   * @param viewId
   */
  getViewDetailsById = (viewId: string) => this.globalViewMap?.[viewId] ?? null;

  /**
   * @description fetch all global views
   * @param workspaceSlug
   */
  fetchAllGlobalViews = async (workspaceSlug: string): Promise<IWorkspaceView[]> => {
    try {
      const response = await this.workspaceService.getAllViews(workspaceSlug);
      runInAction(() => {
        response.forEach((view: IWorkspaceView) => {
          set(this.globalViewMap, [view.id], view);
        });
      });
      return response;
    } catch (error) {
      console.error("Error fetching global views:", error);
      throw error;
    }
  };

  /**
   * @description fetch global view details
   * @param workspaceSlug
   * @param viewId
   */
  fetchGlobalViewDetails = async (workspaceSlug: string, viewId: string): Promise<IWorkspaceView> => {
    try {
      const response = await this.workspaceService.getViewDetails(workspaceSlug, viewId);
      runInAction(() => {
        set(this.globalViewMap, [viewId], response);
      });
      return response;
    } catch (error) {
      console.error("Error fetching global view details:", error);
      throw error;
    }
  };

  /**
   * @description create global view
   * @param workspaceSlug
   * @param data
   */
  createGlobalView = async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
    try {
      const response = await this.workspaceService.createView(workspaceSlug, data);
      runInAction(() => {
        set(this.globalViewMap, [response.id], response);
      });
      return response;
    } catch (error) {
      console.error("Error creating global view:", error);
      throw error;
    }
  };

  /**
   * @description update global view
   * @param workspaceSlug
   * @param viewId
   * @param data
   * @param shouldSyncFilters whether to sync filters to workspace issues
   */
  updateGlobalView = async (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>,
    shouldSyncFilters?: boolean
  ): Promise<IWorkspaceView | undefined> => {
    const currentViewData = cloneDeep(this.globalViewMap[viewId]);

    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          const currentKey = key as keyof IWorkspaceView;
          set(this.globalViewMap, [viewId, currentKey], data[currentKey]);
        });
      });

      const currentView = await this.workspaceService.updateView(workspaceSlug, viewId, data);

      // applying the filters in the global view
      if (shouldSyncFilters && !isEqual(currentViewData?.rich_filters || {}, currentView?.rich_filters || {})) {
        await this.rootStore.issue.workspaceIssuesFilter.updateFilterExpression(
          workspaceSlug,
          viewId,
          currentView?.rich_filters || {}
        );
        this.rootStore.issue.workspaceIssues
          .fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation")
          .catch(console.error);
      }
      return currentView;
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
  deleteGlobalView = async (workspaceSlug: string, viewId: string): Promise<void> => {
    const view = this.getViewDetailsById(viewId);
    if (view?.is_default) {
      throw new Error("Default views cannot be deleted");
    }
    await this.workspaceService.deleteView(workspaceSlug, viewId);
    runInAction(() => {
      delete this.globalViewMap[viewId];
    });
  };
}
