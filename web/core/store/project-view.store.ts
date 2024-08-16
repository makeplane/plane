import { set } from "lodash";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IProjectView, TPublishViewDetails, TPublishViewSettings, TViewFilters } from "@plane/types";
// constants
import { EViewAccess } from "@/constants/views";
// helpers
import { getValidatedViewFilters, getViewName, orderViews, shouldFilterView } from "@/helpers/project-views.helpers";
// services
import { ViewService } from "@/plane-web/services";
// store
import { CoreRootStore } from "./root.store";

export interface IProjectViewStore {
  //Loaders
  loader: boolean;
  fetchedMap: Record<string, boolean>;
  // observables
  viewMap: Record<string, IProjectView>;
  filters: TViewFilters;
  // computed
  projectViewIds: string[] | null;
  // computed actions
  getProjectViews: (projectId: string) => IProjectView[] | undefined;
  getFilteredProjectViews: (projectId: string) => IProjectView[] | undefined;
  getViewById: (viewId: string) => IProjectView;
  // fetch actions
  fetchViews: (workspaceSlug: string, projectId: string) => Promise<undefined | IProjectView[]>;
  fetchViewDetails: (workspaceSlug: string, projectId: string, viewId: string) => Promise<IProjectView>;
  // CRUD actions
  createView: (workspaceSlug: string, projectId: string, data: Partial<IProjectView>) => Promise<IProjectView>;
  updateView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IProjectView>
  ) => Promise<IProjectView>;
  deleteView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
  updateFilters: <T extends keyof TViewFilters>(filterKey: T, filterValue: TViewFilters[T]) => void;
  clearAllFilters: () => void;
  // favorites actions
  addViewToFavorites: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
  removeViewFromFavorites: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
  // publish
  publishView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: TPublishViewSettings
  ) => Promise<TPublishViewDetails | undefined>;
  fetchPublishDetails: (
    workspaceSlug: string,
    projectId: string,
    viewId: string
  ) => Promise<TPublishViewDetails | undefined>;
  updatePublishedView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => Promise<void>;
  unPublishView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<void>;
}

export class ProjectViewStore implements IProjectViewStore {
  // observables
  loader: boolean = false;
  viewMap: Record<string, IProjectView> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  filters: TViewFilters = { searchQuery: "", sortBy: "desc", sortKey: "updated_at" };
  // root store
  rootStore;
  // services
  viewService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      viewMap: observable,
      fetchedMap: observable,
      filters: observable,
      // computed
      projectViewIds: computed,
      // fetch actions
      fetchViews: action,
      fetchViewDetails: action,
      // CRUD actions
      createView: action,
      updateView: action,
      deleteView: action,
      // actions
      updateFilters: action,
      clearAllFilters: action,
      // favorites actions
      addViewToFavorites: action,
      removeViewFromFavorites: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.viewService = new ViewService();
  }

  /**
   * Returns array of view ids for current project
   */
  get projectViewIds() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    const viewIds = Object.keys(this.viewMap ?? {})?.filter((viewId) => this.viewMap?.[viewId]?.project === projectId);
    return viewIds;
  }

  getProjectViews = computedFn((projectId: string) => {
    if (!this.fetchedMap[projectId]) return undefined;

    const ViewsList = Object.values(this.viewMap ?? {});
    // helps to filter views based on the projectId
    let filteredViews = ViewsList.filter((view) => view?.project === projectId);
    filteredViews = orderViews(filteredViews, this.filters.sortKey, this.filters.sortBy);

    return filteredViews ?? undefined;
  });
  /**
   * returns viewsIds of issues
   */
  getFilteredProjectViews = computedFn((projectId: string) => {
    if (!this.fetchedMap[projectId]) return undefined;

    const ViewsList = Object.values(this.viewMap ?? {});
    // helps to filter views based on the projectId, searchQuery and filters
    let filteredViews = ViewsList.filter(
      (view) =>
        view?.project === projectId &&
        getViewName(view.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterView(view, this.filters.filters)
    );
    filteredViews = orderViews(filteredViews, this.filters.sortKey, this.filters.sortBy);

    return filteredViews ?? undefined;
  });

  /**
   * Returns view details by id
   */
  getViewById = computedFn((viewId: string) => this.viewMap?.[viewId] ?? null);

  /**
   * Updates the filter
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TViewFilters>(filterKey: T, filterValue: TViewFilters[T]) => {
    runInAction(() => {
      set(this.filters, [filterKey], filterValue);
    });
  };

  /**
   * @description clears all the filters
   */
  clearAllFilters = () =>
    runInAction(() => {
      set(this.filters, ["filters"], {});
    });

  /**
   * Fetches views for current project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IProjectView[]>
   */
  fetchViews = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      await this.viewService.getViews(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          response.forEach((view) => {
            set(this.viewMap, [view.id], view);
          });
          set(this.fetchedMap, projectId, true);
          this.loader = false;
        });
        return response;
      });
    } catch (error) {
      this.loader = false;
      return undefined;
    }
  };

  /**
   * Fetches view details for a specific view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns Promise<IProjectView>
   */
  fetchViewDetails = async (workspaceSlug: string, projectId: string, viewId: string): Promise<IProjectView> =>
    await this.viewService.getViewDetails(workspaceSlug, projectId, viewId).then((response) => {
      runInAction(() => {
        set(this.viewMap, [viewId], response);
      });
      return response;
    });

  /**
   * Creates a new view for a specific project and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IProjectView>
   */
  createView = async (workspaceSlug: string, projectId: string, data: Partial<IProjectView>): Promise<IProjectView> => {
    const response = await this.viewService.createView(workspaceSlug, projectId, getValidatedViewFilters(data));

    runInAction(() => {
      set(this.viewMap, [response.id], response);
    });

    if (data.access === EViewAccess.PRIVATE) {
      await this.updateViewAccess(workspaceSlug, projectId, response.id, EViewAccess.PRIVATE);
    }

    return response;
  };

  /**
   * Updates a view details of specific view and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @param data
   * @returns Promise<IProjectView>
   */
  updateView = async (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IProjectView>
  ): Promise<IProjectView> => {
    const currentView = this.getViewById(viewId);

    const promiseRequests = [];
    promiseRequests.push(this.viewService.patchView(workspaceSlug, projectId, viewId, data));

    runInAction(() => {
      set(this.viewMap, [viewId], { ...currentView, ...data });
    });

    if (data.access !== undefined && data.access !== currentView.access) {
      promiseRequests.push(this.updateViewAccess(workspaceSlug, projectId, viewId, data.access));
    }

    const [response] = await Promise.all(promiseRequests);

    return response;
  };

  /**
   * Deletes a view and removes it from the viewMap object
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  deleteView = async (workspaceSlug: string, projectId: string, viewId: string): Promise<any> => {
    await this.viewService.deleteView(workspaceSlug, projectId, viewId).then(() => {
      runInAction(() => {
        delete this.viewMap[viewId];
        if (this.rootStore.favorite.entityMap[viewId]) this.rootStore.favorite.removeFavoriteFromStore(viewId);
      });
    });
  };

  /** Locks view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  lockView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], true);
      });
      await this.viewService.lockView(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], false);
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
  unLockView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], false);
      });
      await this.viewService.unLockView(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], true);
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
  updateViewAccess = async (workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) => {
    const currentView = this.getViewById(viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.viewMap, [viewId, "access"], access);
      });
      await this.viewService.updateViewAccess(workspaceSlug, projectId, viewId, access);
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "access"], currentAccess);
      });
    }
  };

  /**
   * Adds a view to favorites
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  addViewToFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_favorite"], true);
      });
      await this.rootStore.favorite.addFavorite(workspaceSlug.toString(), {
        entity_type: "view",
        entity_identifier: viewId,
        project_id: projectId,
        entity_data: { name: this.viewMap[viewId].name || "" },
      });
    } catch (error) {
      console.error("Failed to add view to favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_favorite"], false);
      });
    }
  };

  /**
   * Removes a view from favorites
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  removeViewFromFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (!currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_favorite"], false);
      });
      await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to remove view from favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_favorite"], true);
      });
    }
  };

  /**
   * Publishes View to the Public
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  publishView = async (workspaceSlug: string, projectId: string, viewId: string, data: TPublishViewSettings) => {
    try {
      const response = (await this.viewService.publishView(
        workspaceSlug,
        projectId,
        viewId,
        data
      )) as TPublishViewDetails;
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], response?.anchor);
      });

      return response;
    } catch (error) {
      console.error("Failed to publish view", error);
    }
  };

  /**
   * fetches Published Details
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  fetchPublishDetails = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const response = (await this.viewService.getPublishDetails(
        workspaceSlug,
        projectId,
        viewId
      )) as TPublishViewDetails;
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], response?.anchor);
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch published view details", error);
    }
  };

  /**
   * updates already published view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  updatePublishedView = async (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => {
    try {
      return await this.viewService.updatePublishedView(workspaceSlug, projectId, viewId, data);
    } catch (error) {
      console.error("Failed to update published view details", error);
    }
  };

  /**
   * un publishes the view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  unPublishView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const response = await this.viewService.unPublishView(workspaceSlug, projectId, viewId);
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], null);
      });
      return response;
    } catch (error) {
      console.error("Failed to unPublish view", error);
    }
  };
}
