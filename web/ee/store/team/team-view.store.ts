import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { TLoader, TPublishViewDetails, TPublishViewSettings, TTeamView, TViewFilters } from "@plane/types";
// constants
import { EViewAccess } from "@/constants/views";
// plane web helpers
import {
  getValidatedViewFilters,
  getViewName,
  orderViews,
  shouldFilterView,
} from "@/plane-web/helpers/team-view-helper";
// services
import { ViewService as ProjectViewService } from "@/plane-web/services";
// plane web services
import { TeamViewService } from "@/plane-web/services/teams/team-views.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamViewStore {
  // observables
  loaderMap: Record<string, TLoader>; // teamId -> loader
  fetchedMap: Record<string, boolean>; // teamId -> fetched
  scopeMap: Record<string, ETeamEntityScope>; // teamId -> scope
  viewMap: Record<string, Record<string, TTeamView>>; // teamId -> viewId -> view
  filtersMap: Record<string, TViewFilters>; // teamId -> filters
  // computed functions
  getTeamViewsLoader: (teamId: string) => TLoader | undefined;
  getTeamViewsFetchedStatus: (teamId: string) => boolean | undefined;
  getTeamViewIds: (teamId: string) => string[] | undefined;
  getTeamViews: (teamId: string) => TTeamView[] | undefined;
  getFilteredTeamViews: (teamId: string) => TTeamView[] | undefined;
  getViewById: (teamId: string, viewId: string) => TTeamView | undefined;
  // helper actions
  initTeamViewsScope: (teamId: string) => void;
  getTeamViewsScope: (teamId: string) => ETeamEntityScope | undefined;
  initTeamViewsFilters: (teamId: string) => void;
  getTeamViewsFilters: (teamId: string) => TViewFilters | undefined;
  updateTeamScope: (workspaceSlug: string, teamId: string, scope: ETeamEntityScope) => void;
  // fetch actions
  fetchTeamViews: (workspaceSlug: string, teamId: string, loader?: TLoader) => Promise<TTeamView[] | undefined>;
  fetchTeamViewDetails: (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    loader?: TLoader
  ) => Promise<TTeamView | undefined>;
  // CRUD actions
  createView: (workspaceSlug: string, teamId: string, data: Partial<TTeamView>) => Promise<TTeamView>;
  updateView: (workspaceSlug: string, teamId: string, viewId: string, data: Partial<TTeamView>) => Promise<void>;
  deleteView: (workspaceSlug: string, teamId: string, viewId: string) => Promise<void>;
  updateFilters: <T extends keyof TViewFilters>(teamId: string, filterKey: T, filterValue: TViewFilters[T]) => void;
  clearAllFilters: (teamId: string) => void;
  // favorites actions
  addViewToFavorites: (workspaceSlug: string, teamId: string, viewId: string) => Promise<void>;
  removeViewFromFavorites: (workspaceSlug: string, teamId: string, viewId: string) => Promise<void>;
  // publish
  publishView: (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    data: TPublishViewSettings
  ) => Promise<TPublishViewDetails | undefined>;
  fetchPublishDetails: (
    workspaceSlug: string,
    teamId: string,
    viewId: string
  ) => Promise<TPublishViewDetails | undefined>;
  updatePublishedView: (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => Promise<void>;
  unPublishView: (workspaceSlug: string, teamId: string, viewId: string) => Promise<void>;
}

export class TeamViewStore implements ITeamViewStore {
  // observables
  loaderMap: Record<string, TLoader> = {}; // teamId -> loader
  fetchedMap: Record<string, boolean> = {}; // teamId -> fetched
  scopeMap: Record<string, ETeamEntityScope> = {}; // teamId -> scope
  viewMap: Record<string, Record<string, TTeamView>> = {}; // teamId -> viewId -> view
  filtersMap: Record<string, TViewFilters> = {}; // teamId -> filters
  // root store
  rootStore;
  // services
  teamViewService;
  projectViewService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchedMap: observable,
      scopeMap: observable,
      viewMap: observable,
      filtersMap: observable,
      // helper actions
      initTeamViewsScope: action,
      initTeamViewsFilters: action,
      updateTeamScope: action,
      // fetch actions
      fetchTeamViews: action,
      fetchTeamViewDetails: action,
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
    this.teamViewService = new TeamViewService();
    this.projectViewService = new ProjectViewService();
  }

  // computed functions
  /**
   * Returns team loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamViewsLoader = computedFn((teamId: string) => this.loaderMap[teamId] ?? undefined);

  /**
   * Returns team fetched map
   * @param teamId
   * @returns boolean | undefined
   */
  getTeamViewsFetchedStatus = computedFn((teamId: string) => this.fetchedMap[teamId] ?? undefined);

  /**
   * Returns team view ids
   * @param teamId
   * @returns string[] | undefined
   */
  getTeamViewIds = computedFn((teamId: string) => {
    if (!this.fetchedMap[teamId]) return undefined;
    const teamViewIds = Object.keys(this.viewMap[teamId] ?? {});
    return teamViewIds;
  });

  /**
   * Returns team views
   * @param teamId
   * @returns TTeamView[] | undefined
   */
  getTeamViews = computedFn((teamId: string) => {
    if (!this.fetchedMap[teamId]) return undefined;
    const ViewsList = Object.values(this.viewMap[teamId] ?? {}).filter((view) => view.access === EViewAccess.PUBLIC);
    const teamFilters = this.getTeamViewsFilters(teamId);
    // helps to filter views based on the teamId
    const filteredViews = orderViews(ViewsList, teamFilters.sortKey, teamFilters.sortBy);
    return filteredViews ?? undefined;
  });

  /**
   * Returns filtered team views
   * @param teamId
   * @returns TTeamView[] | undefined
   */
  getFilteredTeamViews = computedFn((teamId: string) => {
    if (!this.fetchedMap[teamId]) return undefined;
    const ViewsList = this.getTeamViews(teamId);
    const teamFilters = this.getTeamViewsFilters(teamId);
    if (!ViewsList) return undefined;
    // helps to filter views based on the teamId, searchQuery and filters
    let filteredViews = ViewsList.filter(
      (view) =>
        getViewName(view.name).toLowerCase().includes(teamFilters.searchQuery.toLowerCase()) &&
        shouldFilterView(view, teamFilters.filters)
    );
    filteredViews = orderViews(filteredViews, teamFilters.sortKey, teamFilters.sortBy);
    return filteredViews ?? undefined;
  });

  /**
   * Returns view details by id
   * @param teamId
   * @param viewId
   * @returns TTeamView | undefined
   */
  getViewById = computedFn((teamId: string, viewId: string) => this.viewMap[teamId]?.[viewId] ?? undefined);

  /**
   * Initializes team views scope
   * @param teamId
   */
  initTeamViewsScope = (teamId: string) => {
    set(this.scopeMap, teamId, "teams");
  };

  /**
   * Returns team scope
   * @param teamId
   * @returns ETeamEntityScope | undefined
   */
  getTeamViewsScope = computedFn((teamId: string) => {
    if (!this.scopeMap[teamId]) {
      this.initTeamViewsScope(teamId);
    }
    return this.scopeMap[teamId];
  });

  /**
   * Initializes team views filters
   * @param teamId
   */
  initTeamViewsFilters = (teamId: string) => {
    set(this.filtersMap, [teamId], {
      filters: {},
      searchQuery: "",
      sortKey: "created_at",
      sortBy: "desc",
    });
  };

  /**
   * Returns team filters
   * @param teamId
   * @returns TViewFilters
   */
  getTeamViewsFilters = computedFn((teamId: string) => {
    if (!this.filtersMap[teamId]) {
      this.initTeamViewsFilters(teamId);
    }
    return this.filtersMap[teamId];
  });

  /**
   * Updates team scope
   * @params workspaceSlug
   * @param teamId
   * @param scope
   */
  updateTeamScope = (workspaceSlug: string, teamId: string, scope: ETeamEntityScope) => {
    runInAction(() => {
      set(this.scopeMap, teamId, scope);
      set(this.viewMap, [teamId], {});
      set(this.fetchedMap, teamId, false);
    });
    this.fetchTeamViews(workspaceSlug, teamId)
  };

  /**
   * Fetches views for current team
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamView[]> | undefined
   */
  fetchTeamViews = async (workspaceSlug: string, teamId: string, loader: TLoader = "init-loader") => {
    try {
      if (this.getTeamViewsFetchedStatus(teamId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamId, loader);
      // Fetch views
      const scope = this.getTeamViewsScope(teamId);
      await this.teamViewService.getViews(workspaceSlug, teamId, scope).then((response) => {
        runInAction(() => {
          response.forEach((view) => {
            set(this.viewMap, [teamId, view.id], view);
          });
          set(this.fetchedMap, teamId, true);
          set(this.loaderMap, teamId, "loaded");
        });
        return response;
      });
    } catch {
      // Reset loader and fetched status if fetching fails
      set(this.fetchedMap, teamId, false);
      set(this.loaderMap, teamId, "loaded");
      return undefined;
    }
  };

  /**
   * Fetches view details for a specific view
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns Promise<TTeamView>
   */
  fetchTeamViewDetails = async (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    loader: TLoader = "init-loader"
  ): Promise<TTeamView | undefined> => {
    try {
      if (this.getTeamViewsFetchedStatus(teamId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamId, loader);
      await this.teamViewService.getViewDetails(workspaceSlug, teamId, viewId).then((response) => {
        runInAction(() => {
          set(this.viewMap, [teamId, viewId], response);
          set(this.loaderMap, teamId, "loaded");
        });
        return response;
      });
    } catch {
      set(this.loaderMap, teamId, "loaded");
      return undefined;
    }
  };

  /**
   * Creates a new view for a specific team and adds it to the store
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns Promise<TTeamView>
   */
  createView = async (workspaceSlug: string, teamId: string, data: Partial<TTeamView>): Promise<TTeamView> => {
    const response = await this.teamViewService.createView(workspaceSlug, teamId, getValidatedViewFilters(data));
    runInAction(() => {
      set(this.viewMap, [teamId, response.id], response);
    });
    if (data.access === EViewAccess.PRIVATE) {
      await this.updateViewAccess(workspaceSlug, teamId, response.id, EViewAccess.PRIVATE);
    }
    return response;
  };

  /**
   * Updates a view details of specific view and updates it in the store
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param data
   * @returns Promise<void>
   */
  updateView = async (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    data: Partial<TTeamView>
  ): Promise<void> => {
    const currentView = this.getViewById(teamId, viewId);
    // update view
    const promiseRequests = [];
    promiseRequests.push(
      currentView.is_team_view
        ? this.teamViewService.patchView(workspaceSlug, teamId, viewId, data)
        : this.projectViewService.patchView(workspaceSlug, currentView.project, viewId, data)
    );
    runInAction(() => {
      set(this.viewMap, [teamId, viewId], { ...currentView, ...data });
    });
    // update view access
    if (data.access !== undefined && data.access !== currentView.access) {
      promiseRequests.push(this.updateViewAccess(workspaceSlug, teamId, viewId, data.access));
    }
    await Promise.all(promiseRequests);
    // if the view is private, then we need to remove it from the store
    if (data.access === EViewAccess.PRIVATE) {
      runInAction(() => {
        delete this.viewMap[teamId][viewId];
      });
    }
  };

  /**
   * Deletes a view and removes it from the viewMap object
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  deleteView = async (workspaceSlug: string, teamId: string, viewId: string): Promise<void> => {
    const currentView = this.getViewById(teamId, viewId);
    const deleteViewPromise = currentView.is_team_view
      ? this.teamViewService.deleteView(workspaceSlug, teamId, viewId)
      : this.projectViewService.deleteView(workspaceSlug, currentView.project, viewId);
    // delete view
    await deleteViewPromise.then(() => {
      runInAction(() => {
        delete this.viewMap[teamId][viewId];
        if (this.rootStore.favorite.entityMap[viewId]) this.rootStore.favorite.removeFavoriteFromStore(viewId);
      });
    });
  };

  /**
   * Updates the filter
   * @param teamId
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TViewFilters>(teamId: string, filterKey: T, filterValue: TViewFilters[T]) => {
    runInAction(() => {
      set(this.filtersMap, [teamId, filterKey], filterValue);
    });
  };

  /**
   * Clears all the filters
   * @param teamId
   */
  clearAllFilters = (teamId: string) =>
    runInAction(() => {
      set(this.filtersMap, [teamId, "filters"], {});
    });

  /** Locks view
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  lockView = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_locked"], true);
      });
      await (currentView.is_team_view
        ? this.teamViewService.lockView(workspaceSlug, teamId, viewId)
        : this.projectViewService.lockView(workspaceSlug, currentView.project, viewId));
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_locked"], false);
      });
    }
  };

  /**
   * unlocks View
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  unLockView = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_locked"], false);
      });
      await (currentView.is_team_view
        ? this.teamViewService.unLockView(workspaceSlug, teamId, viewId)
        : this.projectViewService.unLockView(workspaceSlug, currentView.project, viewId));
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_locked"], true);
      });
    }
  };

  /**
   * Updates View access
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @param access
   * @returns
   */
  updateViewAccess = async (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    access: EViewAccess
  ): Promise<void> => {
    const currentView = this.getViewById(teamId, viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "access"], access);
      });
      await (currentView.is_team_view
        ? this.teamViewService.updateViewAccess(workspaceSlug, teamId, viewId, access)
        : this.projectViewService.updateViewAccess(workspaceSlug, currentView.project, viewId, access));
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "access"], currentAccess);
      });
    }
  };

  /**
   * Adds a view to favorites
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  addViewToFavorites = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      if (currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_favorite"], true);
      });
      await this.rootStore.favorite.addFavorite(workspaceSlug.toString(), {
        entity_type: "view",
        entity_identifier: viewId,
        project_id: currentView.project,
        entity_data: { name: this.viewMap[teamId][viewId].name || "" },
      });
    } catch (error) {
      console.error("Failed to add view to favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_favorite"], false);
      });
    }
  };

  /**
   * Removes a view from favorites
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  removeViewFromFavorites = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      if (!currentView?.is_favorite) return;
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_favorite"], false);
      });
      await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to remove view from favorites in view store", error);
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "is_favorite"], true);
      });
    }
  };

  /**
   * Publishes View to the Public
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  publishView = async (workspaceSlug: string, teamId: string, viewId: string, data: TPublishViewSettings) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      const response = await (currentView.is_team_view
        ? this.teamViewService.publishView(workspaceSlug, teamId, viewId, data)
        : this.projectViewService.publishView(workspaceSlug, currentView.project, viewId, data));
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "anchor"], response?.anchor);
      });

      return response;
    } catch (error) {
      console.error("Failed to publish view", error);
    }
  };

  /**
   * fetches Published Details
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  fetchPublishDetails = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      const response = await (currentView.is_team_view
        ? this.teamViewService.getPublishDetails(workspaceSlug, teamId, viewId)
        : this.projectViewService.getPublishDetails(workspaceSlug, currentView.project, viewId));
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "anchor"], response?.anchor);
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch published view details", error);
    }
  };

  /**
   * updates already published view
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  updatePublishedView = async (
    workspaceSlug: string,
    teamId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      return await (currentView.is_team_view
        ? this.teamViewService.updatePublishedView(workspaceSlug, teamId, viewId, data)
        : this.projectViewService.updatePublishedView(workspaceSlug, currentView.project, viewId, data));
    } catch (error) {
      console.error("Failed to update published view details", error);
    }
  };

  /**
   * un publishes the view
   * @param workspaceSlug
   * @param teamId
   * @param viewId
   * @returns
   */
  unPublishView = async (workspaceSlug: string, teamId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(teamId, viewId);
      const response = await (currentView.is_team_view
        ? this.teamViewService.unPublishView(workspaceSlug, teamId, viewId)
        : this.projectViewService.unPublishView(workspaceSlug, currentView.project, viewId));
      runInAction(() => {
        set(this.viewMap, [teamId, viewId, "anchor"], null);
      });
      return response;
    } catch (error) {
      console.error("Failed to unPublish view", error);
    }
  };
}
