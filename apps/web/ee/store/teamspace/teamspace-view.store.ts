import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import {
  EViewAccess,
  TLoader,
  TPublishViewDetails,
  TPublishViewSettings,
  TTeamspaceView,
  TViewFilters,
} from "@plane/types";
// plane web helpers
import {
  getValidatedViewFilters,
  getViewName,
  orderViews,
  shouldFilterView,
} from "@/plane-web/helpers/teamspace-view-helper";
// plane web services
import { TeamspaceViewService } from "@/plane-web/services/teamspace/teamspace-views.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamspaceViewStore {
  // observables
  loaderMap: Record<string, TLoader>; // teamspaceId -> loader
  fetchedMap: Record<string, boolean>; // teamspaceId -> fetched
  viewMap: Record<string, Record<string, TTeamspaceView>>; // teamspaceId -> viewId -> view
  filtersMap: Record<string, TViewFilters>; // teamspaceId -> filters
  // computed functions
  getTeamspaceViewsLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceViewsFetchedStatus: (teamspaceId: string) => boolean | undefined;
  getTeamspaceViewIds: (teamspaceId: string) => string[] | undefined;
  getTeamspaceViews: (teamspaceId: string) => TTeamspaceView[] | undefined;
  getFilteredTeamspaceViews: (teamspaceId: string) => TTeamspaceView[] | undefined;
  getViewById: (teamspaceId: string, viewId: string) => TTeamspaceView | undefined;
  // helper actions
  initTeamspaceViewsFilters: (teamspaceId: string) => void;
  getTeamspaceViewsFilters: (teamspaceId: string) => TViewFilters | undefined;
  // fetch actions
  fetchTeamspaceViews: (
    workspaceSlug: string,
    teamspaceId: string,
    loader?: TLoader
  ) => Promise<TTeamspaceView[] | undefined>;
  fetchTeamspaceViewDetails: (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    loader?: TLoader
  ) => Promise<TTeamspaceView | undefined>;
  // CRUD actions
  createView: (workspaceSlug: string, teamspaceId: string, data: Partial<TTeamspaceView>) => Promise<TTeamspaceView>;
  updateView: (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TTeamspaceView>
  ) => Promise<TTeamspaceView>;
  deleteView: (workspaceSlug: string, teamspaceId: string, viewId: string) => Promise<void>;
  updateFilters: <T extends keyof TViewFilters>(
    teamspaceId: string,
    filterKey: T,
    filterValue: TViewFilters[T]
  ) => void;
  clearAllFilters: (teamspaceId: string) => void;
  // favorites actions
  addViewToFavorites: (workspaceSlug: string, teamspaceId: string, viewId: string) => Promise<void>;
  removeViewFromFavorites: (workspaceSlug: string, teamspaceId: string, viewId: string) => Promise<void>;
  // publish
  publishView: (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: TPublishViewSettings
  ) => Promise<TPublishViewDetails | undefined>;
  fetchPublishDetails: (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string
  ) => Promise<TPublishViewDetails | undefined>;
  updatePublishedView: (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => Promise<void>;
  unPublishView: (workspaceSlug: string, teamspaceId: string, viewId: string) => Promise<void>;
}

export class TeamspaceViewStore implements ITeamspaceViewStore {
  // observables
  loaderMap: Record<string, TLoader> = {}; // teamspaceId -> loader
  fetchedMap: Record<string, boolean> = {}; // teamspaceId -> fetched
  viewMap: Record<string, Record<string, TTeamspaceView>> = {}; // teamspaceId -> viewId -> view
  filtersMap: Record<string, TViewFilters> = {}; // teamspaceId -> filters
  // root store
  rootStore;
  // services
  teamspaceViewService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchedMap: observable,
      viewMap: observable,
      filtersMap: observable,
      // helper actions
      initTeamspaceViewsFilters: action,
      // fetch actions
      fetchTeamspaceViews: action,
      fetchTeamspaceViewDetails: action,
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
    this.teamspaceViewService = new TeamspaceViewService();
  }

  // computed functions
  /**
   * Returns teamspace loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceViewsLoader = computedFn((teamspaceId: string) => this.loaderMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace fetched map
   * @param teamspaceId
   * @returns boolean | undefined
   */
  getTeamspaceViewsFetchedStatus = computedFn((teamspaceId: string) => this.fetchedMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace view ids
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getTeamspaceViewIds = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const teamspaceViewIds = Object.keys(this.viewMap[teamspaceId] ?? {});
    return teamspaceViewIds;
  });

  /**
   * Returns teamspace views
   * @param teamspaceId
   * @returns TTeamspaceView[] | undefined
   */
  getTeamspaceViews = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const ViewsList = Object.values(this.viewMap[teamspaceId] ?? {}).filter(
      (view) => view.access === EViewAccess.PUBLIC
    );
    const teamspaceFilters = this.getTeamspaceViewsFilters(teamspaceId);
    // helps to filter views based on the teamspaceId
    const filteredViews = orderViews(ViewsList, teamspaceFilters.sortKey, teamspaceFilters.sortBy);
    return filteredViews ?? undefined;
  });

  /**
   * Returns filtered teamspace views
   * @param teamspaceId
   * @returns TTeamspaceView[] | undefined
   */
  getFilteredTeamspaceViews = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const ViewsList = this.getTeamspaceViews(teamspaceId);
    const teamspaceFilters = this.getTeamspaceViewsFilters(teamspaceId);
    if (!ViewsList) return undefined;
    // helps to filter views based on the teamspaceId, searchQuery and filters
    let filteredViews = ViewsList.filter(
      (view) =>
        getViewName(view.name).toLowerCase().includes(teamspaceFilters.searchQuery.toLowerCase()) &&
        shouldFilterView(view, teamspaceFilters.filters)
    );
    filteredViews = orderViews(filteredViews, teamspaceFilters.sortKey, teamspaceFilters.sortBy);
    return filteredViews ?? undefined;
  });

  /**
   * Returns view details by id
   * @param teamspaceId
   * @param viewId
   * @returns TTeamspaceView | undefined
   */
  getViewById = computedFn((teamspaceId: string, viewId: string) => this.viewMap[teamspaceId]?.[viewId] ?? undefined);

  /**
   * Initializes teamspace views filters
   * @param teamspaceId
   */
  initTeamspaceViewsFilters = (teamspaceId: string) => {
    set(this.filtersMap, [teamspaceId], {
      filters: {},
      searchQuery: "",
      sortKey: "created_at",
      sortBy: "desc",
    });
  };

  /**
   * Returns teamspace filters
   * @param teamspaceId
   * @returns TViewFilters
   */
  getTeamspaceViewsFilters = computedFn((teamspaceId: string) => {
    if (!this.filtersMap[teamspaceId]) {
      this.initTeamspaceViewsFilters(teamspaceId);
    }
    return this.filtersMap[teamspaceId];
  });

  /**
   * Fetches views for current teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspaceView[]> | undefined
   */
  fetchTeamspaceViews = async (workspaceSlug: string, teamspaceId: string, loader: TLoader = "init-loader") => {
    try {
      if (this.getTeamspaceViewsFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      // Fetch views
      await this.teamspaceViewService.getViews(workspaceSlug, teamspaceId).then((response) => {
        runInAction(() => {
          response.forEach((view) => {
            set(this.viewMap, [teamspaceId, view.id], view);
          });
          set(this.fetchedMap, teamspaceId, true);
          set(this.loaderMap, teamspaceId, "loaded");
        });
        return response;
      });
    } catch {
      // Reset loader and fetched status if fetching fails
      set(this.fetchedMap, teamspaceId, false);
      set(this.loaderMap, teamspaceId, "loaded");
      return undefined;
    }
  };

  /**
   * Fetches view details for a specific view
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns Promise<TTeamspaceView>
   */
  fetchTeamspaceViewDetails = async (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    loader: TLoader = "init-loader"
  ): Promise<TTeamspaceView | undefined> => {
    try {
      if (this.getTeamspaceViewsFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      await this.teamspaceViewService.getViewDetails(workspaceSlug, teamspaceId, viewId).then((response) => {
        runInAction(() => {
          set(this.viewMap, [teamspaceId, viewId], response);
          set(this.loaderMap, teamspaceId, "loaded");
        });
        return response;
      });
    } catch {
      set(this.loaderMap, teamspaceId, "loaded");
      return undefined;
    }
  };

  /**
   * Creates a new view for a specific teamspace and adds it to the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns Promise<TTeamspaceView>
   */
  createView = async (
    workspaceSlug: string,
    teamspaceId: string,
    data: Partial<TTeamspaceView>
  ): Promise<TTeamspaceView> => {
    const response = await this.teamspaceViewService.createView(
      workspaceSlug,
      teamspaceId,
      getValidatedViewFilters(data)
    );
    runInAction(() => {
      set(this.viewMap, [teamspaceId, response.id], response);
    });
    if (data.access === EViewAccess.PRIVATE) {
      await this.updateViewAccess(workspaceSlug, teamspaceId, response.id, EViewAccess.PRIVATE);
    }
    return response;
  };

  /**
   * Updates a view details of specific view and updates it in the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param data
   * @returns Promise<TTeamspaceView>
   */
  updateView = async (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TTeamspaceView>
  ): Promise<TTeamspaceView> => {
    const currentView = this.getViewById(teamspaceId, viewId);
    // update view
    const promiseRequests = [];
    promiseRequests.push(this.teamspaceViewService.patchView(workspaceSlug, teamspaceId, viewId, data));
    runInAction(() => {
      set(this.viewMap, [teamspaceId, viewId], { ...currentView, ...data });
    });
    // update view access
    if (data.access !== undefined && data.access !== currentView.access) {
      promiseRequests.push(this.updateViewAccess(workspaceSlug, teamspaceId, viewId, data.access));
    }
    await Promise.all(promiseRequests);
    // if the view is private, then we need to remove it from the store
    if (data.access === EViewAccess.PRIVATE) {
      runInAction(() => {
        delete this.viewMap[teamspaceId][viewId];
      });
    }
    return this.getViewById(teamspaceId, viewId);
  };

  /**
   * Deletes a view and removes it from the viewMap object
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  deleteView = async (workspaceSlug: string, teamspaceId: string, viewId: string): Promise<void> => {
    const deleteViewPromise = this.teamspaceViewService.deleteView(workspaceSlug, teamspaceId, viewId);
    // delete view
    await deleteViewPromise.then(() => {
      runInAction(() => {
        delete this.viewMap[teamspaceId][viewId];
        if (this.rootStore.favorite.entityMap[viewId]) this.rootStore.favorite.removeFavoriteFromStore(viewId);
      });
    });
  };

  /**
   * Updates the filter
   * @param teamspaceId
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TViewFilters>(teamspaceId: string, filterKey: T, filterValue: TViewFilters[T]) => {
    runInAction(() => {
      set(this.filtersMap, [teamspaceId, filterKey], filterValue);
    });
  };

  /**
   * Clears all the filters
   * @param teamspaceId
   */
  clearAllFilters = (teamspaceId: string) =>
    runInAction(() => {
      set(this.filtersMap, [teamspaceId, "filters"], {});
    });

  /** Locks view
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  lockView = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamspaceId, viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_locked"], true);
      });
      await this.teamspaceViewService.lockView(workspaceSlug, teamspaceId, viewId);
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_locked"], false);
      });
    }
  };

  /**
   * unlocks View
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  unLockView = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamspaceId, viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_locked"], false);
      });
      await this.teamspaceViewService.unLockView(workspaceSlug, teamspaceId, viewId);
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_locked"], true);
      });
    }
  };

  /**
   * Updates View access
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @param access
   * @returns
   */
  updateViewAccess = async (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    access: EViewAccess
  ): Promise<void> => {
    const currentView = this.getViewById(teamspaceId, viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "access"], access);
      });
      await this.teamspaceViewService.updateViewAccess(workspaceSlug, teamspaceId, viewId, access);
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "access"], currentAccess);
      });
    }
  };

  /**
   * Adds a view to favorites
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  addViewToFavorites = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamspaceId, viewId);
      if (currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_favorite"], true);
      });
      await this.rootStore.favorite.addFavorite(workspaceSlug.toString(), {
        entity_type: "view",
        entity_identifier: viewId,
        project_id: currentView.project,
        entity_data: { name: this.viewMap[teamspaceId][viewId].name || "" },
      });
    } catch (error) {
      console.error("Failed to add view to favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_favorite"], false);
      });
    }
  };

  /**
   * Removes a view from favorites
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  removeViewFromFavorites = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamspaceId, viewId);
      if (!currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_favorite"], false);
      });
      await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to remove view from favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "is_favorite"], true);
      });
    }
  };

  /**
   * Publishes View to the Public
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  publishView = async (workspaceSlug: string, teamspaceId: string, viewId: string, data: TPublishViewSettings) => {
    try {
      const response = await this.teamspaceViewService.publishView(workspaceSlug, teamspaceId, viewId, data);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "anchor"], response?.anchor);
      });

      return response;
    } catch (error) {
      console.error("Failed to publish view", error);
    }
  };

  /**
   * fetches Published Details
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  fetchPublishDetails = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const response = await this.teamspaceViewService.getPublishDetails(workspaceSlug, teamspaceId, viewId);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "anchor"], response?.anchor);
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch published view details", error);
    }
  };

  /**
   * updates already published view
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  updatePublishedView = async (
    workspaceSlug: string,
    teamspaceId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => {
    try {
      return await this.teamspaceViewService.updatePublishedView(workspaceSlug, teamspaceId, viewId, data);
    } catch (error) {
      console.error("Failed to update published view details", error);
    }
  };

  /**
   * un publishes the view
   * @param workspaceSlug
   * @param teamspaceId
   * @param viewId
   * @returns
   */
  unPublishView = async (workspaceSlug: string, teamspaceId: string, viewId: string) => {
    try {
      const response = await this.teamspaceViewService.unPublishView(workspaceSlug, teamspaceId, viewId);
      runInAction(() => {
        set(this.viewMap, [teamspaceId, viewId, "anchor"], null);
      });
      return response;
    } catch (error) {
      console.error("Failed to unPublish view", error);
    }
  };
}
