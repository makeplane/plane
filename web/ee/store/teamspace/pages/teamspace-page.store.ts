import set from "lodash/set";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { TLoader, TPageFilters, TPage } from "@plane/types";
// plane web services
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage  } from "@plane/utils";
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// local imports
import { TTeamspacePage, TeamspacePage } from "./teamspace-page";

export interface ITeamspacePageStore {
  // observables
  loaderMap: Record<string, TLoader>; // teamspaceId -> loader
  fetchedMap: Record<string, boolean>; // teamspaceId -> fetched
  pageMap: Record<string, Record<string, TTeamspacePage>>; // teamspaceId -> pageId -> page
  filtersMap: Record<string, TPageFilters>; // teamspaceId -> filters
  // computed functions
  getTeamspacePagesLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspacePagesFetchedStatus: (teamspaceId: string) => boolean | undefined;
  getTeamspacePageIds: (teamspaceId: string) => string[] | undefined;
  getFilteredTeamspacePageIds: (teamspaceId: string) => string[] | undefined;
  getPageById: (pageId: string) => TTeamspacePage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  // helper actions
  initTeamspacePagesFilters: (teamspaceId: string) => void;
  getTeamspacePagesFilters: (teamspaceId: string) => TPageFilters | undefined;
  updateFilters: <T extends keyof TPageFilters>(
    teamspaceId: string,
    filterKey: T,
    filterValue: TPageFilters[T]
  ) => void;
  clearAllFilters: (teamspaceId: string) => void;
  // fetch actions
  fetchTeamspacePages: (workspaceSlug: string, teamspaceId: string, loader?: TLoader) => Promise<TPage[] | undefined>;
  fetchPageDetails: (teamspaceId: string, pageId: string, loader?: TLoader) => Promise<TPage | undefined>;
  // CRUD actions
  createPage: (data: Partial<TPage>) => Promise<TPage>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  getOrFetchPageInstance: ({ pageId }: { pageId: string }) => Promise<TTeamspacePage | undefined>;
  removePageInstance: (pageId: string) => void;
}

export class TeamspacePageStore implements ITeamspacePageStore {
  // observables
  loaderMap: Record<string, TLoader> = {}; // teamspaceId -> loader
  fetchedMap: Record<string, boolean> = {}; // teamspaceId -> fetched
  pageMap: Record<string, Record<string, TTeamspacePage>> = {}; // teamspaceId -> pageId -> page
  filtersMap: Record<string, TPageFilters> = {}; // teamspaceId -> filters
  // root store
  rootStore;
  // services
  teamspacePageService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchedMap: observable,
      pageMap: observable,
      filtersMap: observable,
      // computed
      flattenedPages: computed,
      // helper actions
      initTeamspacePagesFilters: action,
      updateFilters: action,
      clearAllFilters: action,
      // fetch actions
      fetchTeamspacePages: action,
      fetchPageDetails: action,
      // CRUD actions
      createPage: action,
      removePage: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.teamspacePageService = new TeamspacePageService();
  }

  // computed functions
  get flattenedPages() {
    return Object.values(this.pageMap).reduce(
      (result, teamPages) => ({
        ...result,
        ...teamPages,
      }),
      {}
    );
  }

  /**
   * Returns teamspace loader
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspacePagesLoader = computedFn((teamspaceId: string) => this.loaderMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace fetched map
   * @param teamspaceId
   * @returns boolean | undefined
   */
  getTeamspacePagesFetchedStatus = computedFn((teamspaceId: string) => this.fetchedMap[teamspaceId] ?? undefined);

  /**
   * Returns teamspace page ids
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getTeamspacePageIds = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const teamspacePagesList = filterPagesByPageType("public", Object.values(this.pageMap[teamspaceId] ?? {}));
    const teamspacePageIds = teamspacePagesList.map((page) => page.id).filter(Boolean) as string[];
    return teamspacePageIds;
  });

  /**
   * Returns filtered teamspace page ids
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getFilteredTeamspacePageIds = computedFn((teamspaceId: string) => {
    if (!this.fetchedMap[teamspaceId]) return undefined;
    const teamspacePages = filterPagesByPageType("public", Object.values(this.pageMap[teamspaceId] ?? {}));
    const teamspaceFilters = this.getTeamspacePagesFilters(teamspaceId);
    if (!teamspacePages || teamspacePages.length === 0) return [];
    // helps to filter pages based on the teamspaceId, searchQuery and filters
    let filteredPages = teamspacePages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(teamspaceFilters.searchQuery.toLowerCase()) &&
        !page.parent_id &&
        shouldFilterPage(page, teamspaceFilters.filters)
    );
    filteredPages = orderPages(filteredPages, teamspaceFilters.sortKey, teamspaceFilters.sortBy);
    const filteredPageIds = filteredPages.map((page) => page.id).filter(Boolean) as string[];
    return filteredPageIds;
  });

  /**
   * Returns page details by id
   * @param teamspaceId
   * @param pageId
   * @returns TTeamspacePage | undefined
   */
  getPageById = computedFn((pageId: string) => this.flattenedPages[pageId]);

  /**
   * Returns true if nested pages feature is enabled
   * @returns boolean
   */
  isNestedPagesEnabled = computedFn(() => false);

  /**
   * Initializes teamspace pages filters
   * @param teamspaceId
   */
  initTeamspacePagesFilters = (teamspaceId: string) => {
    set(this.filtersMap, [teamspaceId], {
      filters: {},
      searchQuery: "",
      sortKey: "updated_at",
      sortBy: "desc",
    });
  };

  /**
   * Returns teamspace filters
   * @param teamspaceId
   * @returns TPageFilters
   */
  getTeamspacePagesFilters = computedFn((teamspaceId: string) => {
    if (!this.filtersMap[teamspaceId]) {
      this.initTeamspacePagesFilters(teamspaceId);
    }
    return this.filtersMap[teamspaceId];
  });

  /**
   * Updates the filter
   * @param teamspaceId
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TPageFilters>(teamspaceId: string, filterKey: T, filterValue: TPageFilters[T]) => {
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

  /**
   * Fetches pages for current teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspacePage[]> | undefined
   */
  fetchTeamspacePages = async (workspaceSlug: string, teamspaceId: string, loader: TLoader = "init-loader") => {
    try {
      if (this.getTeamspacePagesFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      // Fetch pages
      await this.teamspacePageService.fetchAll(workspaceSlug, teamspaceId).then((response) => {
        runInAction(() => {
          response.forEach((page) => {
            if (page?.id) {
              const pageInstance = page;
              set(page, "description_html", this.getPageById(page.id)?.description_html);
              const existingInstance = this.getPageById(page.id);
              if (existingInstance) {
                existingInstance.mutateProperties(pageInstance);
              } else {
                set(this.pageMap, [teamspaceId, page.id], new TeamspacePage(this.rootStore, pageInstance));
              }
            }
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
   * Fetches page details for a specific page
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns Promise<TTeamspacePage>
   */
  fetchPageDetails = async (
    teamspaceId: string,
    pageId: string,
    loader: TLoader = "init-loader"
  ): Promise<TTeamspacePage | undefined> => {
    try {
      const { workspaceSlug } = this.rootStore.router;
      if (!workspaceSlug) return;

      if (this.getTeamspacePagesFetchedStatus(teamspaceId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamspaceId, loader);
      await this.teamspacePageService.fetchById(workspaceSlug, teamspaceId, pageId).then((response) => {
        runInAction(() => {
          if (response?.id) {
            const existingInstance = this.getPageById(pageId);
            if (existingInstance) {
              existingInstance.mutateProperties(response);
            } else {
              set(this.pageMap, [teamspaceId, pageId], new TeamspacePage(this.rootStore, response));
            }
          }
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
   * Creates a new page for a specific teamspace and adds it to the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns Promise<TPage>
   */
  createPage = async (data: Partial<TPage>): Promise<TPage> => {
    const { workspaceSlug, teamspaceId } = this.rootStore.router;
    const response = await this.teamspacePageService.create(workspaceSlug ?? "", teamspaceId ?? "", data);
    runInAction(() => {
      if (response?.id && teamspaceId) {
        set(this.pageMap, [teamspaceId, response.id], new TeamspacePage(this.rootStore, response));
      }
    });
    return response;
  };

  /**
   * Deletes a page and removes it from the pageMap object
   * @param workspaceSlug
   * @param teamspaceId
   * @param pageId
   * @returns
   */
  removePage = async ({ pageId, shouldSync = true }: { pageId: string; shouldSync?: boolean }) => {
    const { workspaceSlug, teamspaceId } = this.rootStore.router;
    if (!workspaceSlug || !teamspaceId) return undefined;
    const currentPage = this.getPageById(pageId);

    runInAction(() => {
      if (pageId) {
        currentPage.mutateProperties({ deleted_at: new Date() });
      }
      if (this.rootStore.favorite.entityMap[pageId]) this.rootStore.favorite.removeFavoriteFromStore(pageId);
    });

    if (shouldSync) {
      await this.teamspacePageService.remove(workspaceSlug, teamspaceId, pageId);
    }
  };

  getOrFetchPageInstance = async ({ pageId }: { pageId: string }) => {
    const pageInstance = this.getPageById(pageId);
    if (pageInstance) {
      return pageInstance;
    } else {
      const { workspaceSlug, teamspaceId } = this.rootStore.router;
      if (!workspaceSlug || !teamspaceId) return;
      const page = await this.fetchPageDetails(teamspaceId, pageId);
      if (page) {
        return new TeamspacePage(this.rootStore, page);
      }
    }
  };

  removePageInstance = (pageId: string) => {
    const page = this.getPageById(pageId);
    if (page && page.team) {
      delete this.pageMap[page.team][pageId];
    }
  };
}
