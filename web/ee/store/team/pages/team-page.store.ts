import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
import { TLoader, TPageFilters, TPage } from "@plane/types";
// plane web services
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@/helpers/page.helper";
import { TeamPageService } from "@/plane-web/services/teams/team-pages.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page/project-page.service";
import { TProjectPage, ProjectPage } from "@/store/pages/project-page";
import { TTeamPage, TeamPage } from "./team-page";

export type TTeamPageDetails = TProjectPage | TTeamPage;

export interface ITeamPageStore {
  // observables
  loaderMap: Record<string, TLoader>; // teamId -> loader
  fetchedMap: Record<string, boolean>; // teamId -> fetched
  scopeMap: Record<string, ETeamEntityScope>; // teamId -> scope
  pageMap: Record<string, Record<string, TTeamPageDetails>>; // teamId -> pageId -> page
  filtersMap: Record<string, TPageFilters>; // teamId -> filters
  // computed functions
  getTeamPagesLoader: (teamId: string) => TLoader | undefined;
  getTeamPagesFetchedStatus: (teamId: string) => boolean | undefined;
  getTeamPageIds: (teamId: string) => string[] | undefined;
  getFilteredTeamPageIds: (teamId: string) => string[] | undefined;
  getPageById: (teamId: string, pageId: string) => TTeamPageDetails | undefined;
  // helper actions
  initTeamPagesScope: (teamId: string) => void;
  getTeamPagesScope: (teamId: string) => ETeamEntityScope | undefined;
  initTeamPagesFilters: (teamId: string) => void;
  getTeamPagesFilters: (teamId: string) => TPageFilters | undefined;
  updateTeamScope: (workspaceSlug: string, teamId: string, scope: ETeamEntityScope) => void;
  updateFilters: <T extends keyof TPageFilters>(teamId: string, filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: (teamId: string) => void;
  // fetch actions
  fetchTeamPages: (workspaceSlug: string, teamId: string, loader?: TLoader) => Promise<TPage[] | undefined>;
  fetchTeamPageDetails: (
    workspaceSlug: string,
    teamId: string,
    pageId: string,
    loader?: TLoader
  ) => Promise<TPage | undefined>;
  // CRUD actions
  createPage: (workspaceSlug: string, teamId: string, data: Partial<TPage>) => Promise<TPage>;
  deletePage: (workspaceSlug: string, teamId: string, pageId: string) => Promise<void>;
}

export class TeamPageStore implements ITeamPageStore {
  // observables
  loaderMap: Record<string, TLoader> = {}; // teamId -> loader
  fetchedMap: Record<string, boolean> = {}; // teamId -> fetched
  scopeMap: Record<string, ETeamEntityScope> = {}; // teamId -> scope
  pageMap: Record<string, Record<string, TTeamPageDetails>> = {}; // teamId -> pageId -> page
  filtersMap: Record<string, TPageFilters> = {}; // teamId -> filters
  // root store
  rootStore;
  // services
  teamPageService;
  projectPageService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchedMap: observable,
      scopeMap: observable,
      pageMap: observable,
      filtersMap: observable,
      // helper actions
      initTeamPagesScope: action,
      getTeamPagesScope: action,
      initTeamPagesFilters: action,
      getTeamPagesFilters: action,
      updateTeamScope: action,
      updateFilters: action,
      clearAllFilters: action,
      // fetch actions
      fetchTeamPages: action,
      fetchTeamPageDetails: action,
      // CRUD actions
      createPage: action,
      deletePage: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.teamPageService = new TeamPageService();
    this.projectPageService = new ProjectPageService();
  }

  // computed functions
  /**
   * Returns team loader
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamPagesLoader = computedFn((teamId: string) => this.loaderMap[teamId] ?? undefined);

  /**
   * Returns team fetched map
   * @param teamId
   * @returns boolean | undefined
   */
  getTeamPagesFetchedStatus = computedFn((teamId: string) => this.fetchedMap[teamId] ?? undefined);

  /**
   * Returns team page ids
   * @param teamId
   * @returns string[] | undefined
   */
  getTeamPageIds = computedFn((teamId: string) => {
    if (!this.fetchedMap[teamId]) return undefined;
    const teamPagesList = filterPagesByPageType("public", Object.values(this.pageMap[teamId] ?? {}));
    const teamPageIds = teamPagesList.map((page) => page.id).filter(Boolean) as string[];
    return teamPageIds;
  });

  /**
   * Returns filtered team page ids
   * @param teamId
   * @returns string[] | undefined
   */
  getFilteredTeamPageIds = computedFn((teamId: string) => {
    if (!this.fetchedMap[teamId]) return undefined;
    const teamPages = filterPagesByPageType("public", Object.values(this.pageMap[teamId] ?? {}));
    const teamFilters = this.getTeamPagesFilters(teamId);
    if (!teamPages || teamPages.length === 0) return [];
    // helps to filter pages based on the teamId, searchQuery and filters
    let filteredPages = teamPages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(teamFilters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, teamFilters.filters)
    );
    filteredPages = orderPages(filteredPages, teamFilters.sortKey, teamFilters.sortBy);
    const filteredPageIds = filteredPages.map((page) => page.id).filter(Boolean) as string[];
    return filteredPageIds;
  });

  /**
   * Returns page details by id
   * @param teamId
   * @param pageId
   * @returns TTeamPageDetails | undefined
   */
  getPageById = computedFn((teamId: string, pageId: string) => this.pageMap[teamId]?.[pageId] ?? undefined);

  /**
   * Initializes team pages scope
   * @param teamId
   */
  initTeamPagesScope = (teamId: string) => {
    set(this.scopeMap, teamId, "teams");
  };

  /**
   * Returns team scope
   * @param teamId
   * @returns ETeamEntityScope | undefined
   */
  getTeamPagesScope = (teamId: string) => {
    if (!this.scopeMap[teamId]) {
      this.initTeamPagesScope(teamId);
    }
    return this.scopeMap[teamId];
  };

  /**
   * Initializes team pages filters
   * @param teamId
   */
  initTeamPagesFilters = (teamId: string) => {
    set(this.filtersMap, [teamId], {
      filters: {},
      searchQuery: "",
      sortKey: "updated_at",
      sortBy: "desc",
    });
  };

  /**
   * Returns team filters
   * @param teamId
   * @returns TPageFilters
   */
  getTeamPagesFilters = (teamId: string) => {
    if (!this.filtersMap[teamId]) {
      this.initTeamPagesFilters(teamId);
    }
    return this.filtersMap[teamId];
  };

  /**
   * Updates team scope
   * @params workspaceSlug
   * @param teamId
   * @param scope
   */
  updateTeamScope = (workspaceSlug: string, teamId: string, scope: ETeamEntityScope) => {
    runInAction(() => {
      set(this.scopeMap, teamId, scope);
      set(this.pageMap, [teamId], {});
      set(this.fetchedMap, teamId, false);
    });
    this.fetchTeamPages(workspaceSlug, teamId);
  };

  /**
   * Updates the filter
   * @param teamId
   * @param filterKey
   * @param filterValue
   */
  updateFilters = <T extends keyof TPageFilters>(teamId: string, filterKey: T, filterValue: TPageFilters[T]) => {
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

  /**
   * Fetches pages for current team
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamPageDetails[]> | undefined
   */
  fetchTeamPages = async (workspaceSlug: string, teamId: string, loader: TLoader = "init-loader") => {
    try {
      if (this.getTeamPagesFetchedStatus(teamId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamId, loader);
      // Fetch pages
      const scope = this.getTeamPagesScope(teamId);
      await this.teamPageService.fetchAll(workspaceSlug, teamId, scope).then((response) => {
        runInAction(() => {
          response.forEach((page) => {
            if (page?.id) {
              const pageInstance = page;
              set(page, "description_html", this.pageMap?.[teamId]?.[page.id]?.description_html);
              set(
                this.pageMap,
                [teamId, page.id],
                pageInstance.team
                  ? new TeamPage(this.rootStore, pageInstance)
                  : new ProjectPage(this.rootStore, pageInstance)
              );
            }
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
   * Fetches page details for a specific page
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns Promise<TTeamPageDetails>
   */
  fetchTeamPageDetails = async (
    workspaceSlug: string,
    teamId: string,
    pageId: string,
    loader: TLoader = "init-loader"
  ): Promise<TTeamPageDetails | undefined> => {
    try {
      if (this.getTeamPagesFetchedStatus(teamId)) {
        loader = "mutation";
      }
      set(this.loaderMap, teamId, loader);
      await this.teamPageService.fetchById(workspaceSlug, teamId, pageId).then((response) => {
        runInAction(() => {
          if (response?.id) {
            set(
              this.pageMap,
              [teamId, pageId],
              response.team ? new TeamPage(this.rootStore, response) : new ProjectPage(this.rootStore, response)
            );
          }
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
   * Creates a new page for a specific team and adds it to the store
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns Promise<TPage>
   */
  createPage = async (workspaceSlug: string, teamId: string, data: Partial<TPage>): Promise<TPage> => {
    const response = await this.teamPageService.create(workspaceSlug, teamId, data);
    runInAction(() => {
      if (response?.id) {
        set(this.pageMap, [teamId, response.id], new TeamPage(this.rootStore, response));
      }
    });
    return response;
  };

  /**
   * Deletes a page and removes it from the pageMap object
   * @param workspaceSlug
   * @param teamId
   * @param pageId
   * @returns
   */
  deletePage = async (workspaceSlug: string, teamId: string, pageId: string): Promise<void> => {
    const currentPage = this.getPageById(teamId, pageId);
    const deletePagePromise =
      currentPage.project_ids?.length === 0
        ? this.teamPageService.remove(workspaceSlug, teamId, pageId)
        : currentPage.project_ids?.[0] &&
        this.projectPageService.remove(workspaceSlug, currentPage.project_ids[0], pageId);
    // delete page
    if (!deletePagePromise) return;
    await deletePagePromise.then(() => {
      runInAction(() => {
        delete this.pageMap[teamId][pageId];
        if (this.rootStore.favorite.entityMap[pageId]) this.rootStore.favorite.removeFavoriteFromStore(pageId);
      });
    });
  };
}
