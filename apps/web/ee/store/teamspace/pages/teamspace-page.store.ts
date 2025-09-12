import set from "lodash/set";
import { observable, action, makeObservable, runInAction, computed, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EPageAccess } from "@plane/constants";
import { TPageFilters, TPage, TPageNavigationTabs } from "@plane/types";
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// plane web services
import { PageShareService, TPageSharedUser } from "@/plane-web/services/page/page-share.service";
import { TeamspacePageService } from "@/plane-web/services/teamspace/teamspace-pages.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// services
import { TTeamspacePage, TeamspacePage } from "./teamspace-page";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TError = { title: string; description: string };

export interface ITeamspacePageStore {
  // observables
  loader: TLoader;
  data: Record<string, TTeamspacePage>; // pageId => Page
  error: TError | undefined;
  filters: TPageFilters;
  // page type arrays
  publicPageIds: string[];
  archivedPageIds: string[];
  // filtered page type arrays
  filteredPublicPageIds: string[];
  filteredArchivedPageIds: string[];
  // computed
  isAnyPageAvailable: boolean;
  // helper actions
  getCurrentTeamspacePageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentTeamspacePageIds: (teamspaceId: string) => string[];
  getCurrentTeamspaceFilteredPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TTeamspacePage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  isCommentsEnabled: (workspaceSlug: string) => boolean;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  findRootParent: (page: TTeamspacePage) => TTeamspacePage | undefined;
  clearRootParentCache: () => void;
  getParentPages: (pageId: string) => TPage[] | undefined;
  getOrderedParentPages: (pageId: string) => TPage[] | undefined;
  // fetch actions
  fetchPagesList: (
    workspaceSlug: string,
    teamspaceId: string,
    pageType?: TPageNavigationTabs
  ) => Promise<TPage[] | undefined>;
  fetchPagesByType: (
    workspaceSlug: string,
    teamspaceId: string,
    pageType: string,
    searchQuery?: string
  ) => Promise<TPage[] | undefined>;
  fetchParentPages: (pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    teamspaceId: string,
    pageId: string,
    options?: {
      trackVisit?: boolean;
      shouldFetchSubPages?: boolean;
    }
  ) => Promise<TPage | undefined>;
  // CRUD actions
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  movePageInternally: (pageId: string, updatePayload: Partial<TPage>) => Promise<void>;
  movePageBetweenTeamspaces: (params: {
    workspaceSlug: string;
    pageId: string;
    newTeamspaceId: string;
    teamspaceId: string;
    shouldSync?: boolean;
  }) => Promise<void>;
  getOrFetchPageInstance: ({ pageId }: { pageId: string }) => Promise<TTeamspacePage | undefined>;
  removePageInstance: (pageId: string) => void;
  updatePagesInStore: (pages: TPage[]) => void;
  // page sharing actions
  fetchPageSharedUsers: (pageId: string) => Promise<void>;
  bulkUpdatePageSharedUsers: (pageId: string, sharedUsers: TPageSharedUser[]) => Promise<void>;
}

export class TeamspacePageStore implements ITeamspacePageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TTeamspacePage> = {}; // pageId => Page
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "updated_at",
    sortBy: "desc",
  };
  // page type arrays
  publicPageIds: string[] = [];
  archivedPageIds: string[] = [];
  // filtered page type arrays
  filteredPublicPageIds: string[] = [];
  filteredArchivedPageIds: string[] = [];
  // private props
  private _parentPagesMap = observable.map<string, TPage[]>(new Map()); // pageId => parentPagesList
  // disposers for reactions
  private disposers: (() => void)[] = [];
  // root store
  rootStore;
  // services
  teamspacePageService;
  pageShareService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      // page type arrays
      publicPageIds: observable,
      archivedPageIds: observable,
      // filtered page type arrays
      filteredPublicPageIds: observable,
      filteredArchivedPageIds: observable,
      // computed
      isAnyPageAvailable: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // fetch actions
      fetchPagesList: action,
      fetchPagesByType: action,
      fetchParentPages: action,
      fetchPageDetails: action,
      // CRUD actions
      createPage: action,
      removePage: action,
      movePageInternally: action,
      movePageBetweenTeamspaces: action,
      updatePagesInStore: action,
      // page sharing actions
      fetchPageSharedUsers: action,
      bulkUpdatePageSharedUsers: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.teamspacePageService = new TeamspacePageService();
    this.pageShareService = new PageShareService();

    // Set up reactions to automatically update page type arrays
    this.setupReactions();

    // initialize display filters when teamspace changes
    reaction(
      () => this.rootStore.router.teamspaceId,
      (teamspaceId) => {
        if (!teamspaceId) return;
        this.filters.searchQuery = "";
      }
    );
  }
  /**
   * Set up MobX reactions to automatically update the page type arrays
   */
  private setupReactions() {
    // Update page arrays whenever data or teamspace changes
    const updatePageArraysReaction = reaction(
      // Track these dependencies
      () => ({
        // Track the keys of the data object to detect additions/removals
        pageIds: Object.keys(this.data),
        // Track the version property of each page to detect updates
        pageVersions: Object.values(this.data).map((page) => ({
          id: page.id,
          name: page.name,
          updated_at: page.updated_at,
          access: page.access,
          archived_at: page.archived_at,
          deleted_at: page.deleted_at,
          parent_id: page.parent_id,
          team: page.team,
        })),
        currentTeamspace: this.rootStore.router.teamspaceId,
      }),
      // Effect: update the arrays
      () => {
        this.updatePageTypeArrays();
      },
      // Options: run immediately to populate arrays on initialization
      { fireImmediately: true }
    );

    // Add reaction to watch for filter changes
    const filterChangesReaction = reaction(
      // Track filter changes
      () => ({
        searchQuery: this.filters.searchQuery,
        sortKey: this.filters.sortKey,
        sortBy: this.filters.sortBy,
        // Deep track all filter properties
        filters: this.filters.filters ? { ...this.filters.filters } : undefined,
      }),
      // Effect: update the arrays when filters change
      () => {
        this.updatePageTypeArrays();
      }
    );

    // Add the disposers to clean up later
    this.disposers.push(updatePageArraysReaction);
    this.disposers.push(filterChangesReaction);
  }

  /**
   * Clean up reactions when the store is disposed
   */
  dispose() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    this._parentPagesMap.clear();
  }

  /**
   * @description check if any page is available
   */
  get isAnyPageAvailable() {
    if (this.loader) return true;
    return Object.keys(this.data).length > 0;
  }

  /**
   * @description get the current teamspace page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentTeamspacePageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    const { teamspaceId } = this.rootStore.router;
    if (!teamspaceId) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.team === teamspaceId);
    pagesByType = pagesByType.filter((p) => !p.parent_id);

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;
    return pages ?? undefined;
  });

  /**
   * @description get the current teamspace page ids
   * @param {string} teamspaceId
   */
  getCurrentTeamspacePageIds = computedFn((teamspaceId: string) => {
    if (!teamspaceId) return [];
    const pages = Object.values(this?.data || {}).filter((page) => page.team === teamspaceId);
    return pages.map((page) => page.id) as string[];
  });

  /**
   * @description get the current teamspace filtered page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentTeamspaceFilteredPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    const { teamspaceId } = this.rootStore.router;
    if (!teamspaceId) return undefined;

    // Return the appropriate filtered array based on page type
    switch (pageType) {
      case "public":
        return this.filteredPublicPageIds;
      case "archived":
        return this.filteredArchivedPageIds;
      default:
        return [];
    }
  });

  /**
   * @description get the page store by id
   * @param {string} pageId
   */
  getPageById = computedFn((pageId: string) => this.data?.[pageId] || undefined);

  /**
   * @description Get parent pages for a given page ID from cache
   * @param {string} pageId
   */
  getParentPages = computedFn((pageId: string) => this._parentPagesMap.get(pageId));

  /**
   * @description Get ordered parent pages for a given page ID using the createOrderedParentChildArray logic
   * @param {string} pageId
   */
  getOrderedParentPages = computedFn((pageId: string) => {
    const parentPagesList = this._parentPagesMap.get(pageId);
    if (!parentPagesList) return undefined;
    return this.createOrderedParentChildArray(parentPagesList);
  });

  /**
   * @description Create ordered parent-child array from parent pages list
   * @private
   */
  private createOrderedParentChildArray = (parentPagesList: TPage[]) => {
    // If the list is empty or has only one item, return it as is
    if (!parentPagesList || parentPagesList.length <= 1) {
      return parentPagesList;
    }

    // Create a map for quick lookups by ID and find root page in one loop
    const pagesMap = new Map();
    let rootPage: TPage | undefined;
    parentPagesList.forEach((page) => {
      pagesMap.set(page.id, page);
      if (page.parent_id === null) {
        rootPage = page;
      }
    });

    if (!rootPage) {
      console.error("No root page found in the list");
      return parentPagesList;
    }

    const result: TPage[] = [];

    const buildHierarchy = (currentPage: TPage) => {
      result.push(currentPage);

      // Find all direct children of the current page
      const children = parentPagesList.filter((page) => page.parent_id === currentPage.id);

      // Process each child
      children.forEach((child) => {
        buildHierarchy(child);
      });
    };

    // Start building from the root
    buildHierarchy(rootPage);

    return result;
  };

  /**
   * Helper function to find the root parent of a page
   */
  findRootParent = computedFn((page: TTeamspacePage): TTeamspacePage => {
    if (!page?.id || !page?.parent_id) {
      return page;
    }

    // Get the parent page
    const parentId = page?.parent_id;
    const parentPage = this.getPageById(parentId);

    if (!parentPage) {
      return page; // Return current page if parent not found
    }

    // Recursively find the root parent
    return this.findRootParent(parentPage);
  });

  clearRootParentCache = () => {
    this._parentPagesMap.clear();
  };

  /**
   * Returns true if nested pages feature is enabled
   * @returns boolean
   */
  isNestedPagesEnabled = computedFn((workspaceSlug: string) => {
    const { getFeatureFlag } = this.rootStore.featureFlags;
    return getFeatureFlag(workspaceSlug, "NESTED_PAGES", false);
  });

  /**
   * Returns true if comments in pages feature is enabled
   * @returns boolean
   */
  isCommentsEnabled = computedFn(() => false);

  updateFilters = <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
    runInAction(() => {
      // Create a new filters object to avoid direct mutation
      const updatedFilters = { ...this.filters };

      // Set the new value
      updatedFilters[filterKey] = filterValue;

      // Replace the entire filters object
      this.filters = updatedFilters;

      // Trigger update of the pages arrays
      this.updatePageTypeArrays();
    });
  };

  /**
   * @description clear all the filters
   */
  clearAllFilters = () =>
    runInAction(() => {
      set(this.filters, ["filters"], {});
    });

  /**
   * Updates pages in store from an array of pages
   * Used by SWR to keep the store in sync
   */
  updatePagesInStore = (pages: TPage[]) => {
    // Clear the parent pages cache when updating pages
    this._parentPagesMap.clear();

    runInAction(() => {
      for (const page of pages) {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page);
          } else {
            set(this.data, [page.id], new TeamspacePage(this.rootStore, page));
          }
        }
      }
    });
  };

  /**
   * Updates the page type arrays based on the current data
   * This is called automatically by reactions, no need to call manually
   */
  private updatePageTypeArrays = () => {
    const { teamspaceId } = this.rootStore.router;
    if (!teamspaceId) {
      // Clear arrays when no teamspace is selected
      runInAction(() => {
        // Clear unfiltered arrays
        this.publicPageIds = [];
        this.archivedPageIds = [];
        // Clear filtered arrays
        this.filteredPublicPageIds = [];
        this.filteredArchivedPageIds = [];
      });
      return;
    }

    const allPages = Object.values(this.data);
    const teamspacePages = allPages.filter((page) => page.team === teamspaceId);

    // ---------- PUBLIC PAGES ----------
    // Unfiltered public pages (sorted alphabetically by name)
    const publicPages = teamspacePages.filter(
      (page) => page.access === EPageAccess.PUBLIC && !page.parent_id && !page.archived_at && !page.deleted_at
    );
    const sortedPublicPages = publicPages.sort((a, b) =>
      getPageName(a.name).toLowerCase().localeCompare(getPageName(b.name).toLowerCase())
    );
    const newPublicPageIds = sortedPublicPages.map((page) => page.id).filter((id): id is string => id !== undefined);

    // Filtered public pages (with all filters applied)
    const filteredPublicPages = publicPages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, this.filters.filters)
    );
    const sortedFilteredPublicPages = orderPages(
      filteredPublicPages as unknown as TPage[],
      this.filters.sortKey,
      this.filters.sortBy
    ) as unknown as TTeamspacePage[];
    const newFilteredPublicPageIds = sortedFilteredPublicPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- ARCHIVED PAGES ----------
    // Unfiltered archived pages (sorted alphabetically by name)
    const archivedTeamspacePages = teamspacePages.filter((page) => page.archived_at && !page.deleted_at);
    const topLevelArchivedPages = archivedTeamspacePages.filter((page) => {
      if (!page.parent_id) return true; // Include pages without parents
      const rootParent = this.findRootParent(page);
      return !rootParent?.archived_at;
    });
    const sortedArchivedPages = topLevelArchivedPages.sort((a, b) =>
      getPageName(a.name).toLowerCase().localeCompare(getPageName(b.name).toLowerCase())
    );
    const newArchivedPageIds = sortedArchivedPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // Filtered archived pages (with all filters applied)
    const filteredArchivedPages = topLevelArchivedPages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, this.filters.filters)
    );
    const sortedFilteredArchivedPages = orderPages(
      filteredArchivedPages as unknown as TPage[],
      this.filters.sortKey,
      this.filters.sortBy
    ) as unknown as TTeamspacePage[];
    const newFilteredArchivedPageIds = sortedFilteredArchivedPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // Update arrays in a single runInAction to batch updates
    runInAction(() => {
      // Update unfiltered arrays
      this.publicPageIds = newPublicPageIds;
      this.archivedPageIds = newArchivedPageIds;

      // Update filtered arrays
      this.filteredPublicPageIds = newFilteredPublicPageIds;
      this.filteredArchivedPageIds = newFilteredArchivedPageIds;
    });
  };

  /**
   * @description fetch all the pages
   */
  fetchPagesList = async (workspaceSlug: string, teamspaceId: string, pageType?: TPageNavigationTabs) => {
    try {
      if (!workspaceSlug || !teamspaceId) return undefined;

      const currentPageIds = pageType ? this.getCurrentTeamspacePageIdsByTab(pageType) : undefined;
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const pages = await this.teamspacePageService.fetchAll(workspaceSlug, teamspaceId);
      runInAction(() => {
        for (const page of pages) {
          if (page?.id) {
            const existingPage = this.getPageById(page.id);
            if (existingPage) {
              // If page already exists, update all fields except name
              const { name: _name, ...otherFields } = page;
              existingPage.mutateProperties(otherFields, false);
            } else {
              // If new page, create a new instance with all data
              set(this.data, [page.id], new TeamspacePage(this.rootStore, page));
            }
          }
        }
        this.loader = undefined;
      });

      return pages;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the pages, Please try again later.",
        };
      });
      throw error;
    }
  };

  fetchPagesByType = async (workspaceSlug: string, teamspaceId: string, pageType: string, searchQuery?: string) => {
    try {
      if (!workspaceSlug || !teamspaceId) return undefined;

      const currentPageIds = this.getCurrentTeamspacePageIds(teamspaceId);
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const pages = await this.teamspacePageService.fetchPagesByType(workspaceSlug, teamspaceId, pageType, searchQuery);

      runInAction(() => {
        for (const page of pages) {
          if (page?.id) {
            const pageInstance = this.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.data, [page.id], new TeamspacePage(this.rootStore, page));
            }
          }
        }
        this.loader = undefined;
      });

      return pages;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the pages, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description fetch all the parent pages of a page
   */
  fetchParentPages = async (pageId: string) => {
    const { workspaceSlug, teamspaceId } = this.rootStore.router;
    if (!workspaceSlug || !teamspaceId || !pageId) return undefined;

    // Note: TeamspacePageService may need fetchParentPages method added
    const response = (await this.teamspacePageService.fetchParentPages?.(workspaceSlug, teamspaceId, pageId)) || [];

    // Store the parent pages data in the store
    runInAction(() => {
      for (const page of response) {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page);
          } else {
            set(this.data, [page.id], new TeamspacePage(this.rootStore, page));
          }
        }
      }
      // Cache the parent pages list
      this._parentPagesMap.set(pageId, response);
    });

    return response;
  };

  /**
   * @description move a page between teamspaces
   */
  movePageBetweenTeamspaces = async ({
    workspaceSlug,
    pageId,
    newTeamspaceId,
    teamspaceId,
    shouldSync = true,
  }: {
    workspaceSlug: string;
    pageId: string;
    newTeamspaceId: string;
    teamspaceId: string;
    shouldSync?: boolean;
  }) => {
    try {
      if (shouldSync) {
        // Note: TeamspacePageService may need move method added
        await this.teamspacePageService.move?.(workspaceSlug, teamspaceId, pageId, newTeamspaceId);
      }
    } catch (error) {
      console.error("Unable to move page", error);
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to move a page, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description fetch the details of a page
   * @param {string} pageId
   */
  fetchPageDetails: ITeamspacePageStore["fetchPageDetails"] = async (teamspaceId, pageId, options) => {
    const shouldFetchSubPages = options?.shouldFetchSubPages ?? true;
    const trackVisit = options?.trackVisit ?? true;
    try {
      const { workspaceSlug } = this.rootStore.router;
      if (!workspaceSlug || !teamspaceId || !pageId) return undefined;

      const currentPageId = this.getPageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const promises: Promise<TPage | TPage[]>[] = [
        this.teamspacePageService.fetchById(workspaceSlug, teamspaceId, pageId, trackVisit && true),
      ];

      if (shouldFetchSubPages) {
        promises.push(this.teamspacePageService.fetchSubPages(workspaceSlug, teamspaceId, pageId));
      }
      const results = await Promise.all(promises);
      const page = results[0] as TPage;
      const subPages = shouldFetchSubPages ? (results[1] as TPage[]) : [];

      runInAction(() => {
        if (page) {
          const pageInstance = this.getPageById(pageId);
          if (pageInstance) {
            pageInstance.mutateProperties(page, false);
          } else {
            set(this.data, [pageId], new TeamspacePage(this.rootStore, page));
          }
        }

        if (shouldFetchSubPages) {
          if (subPages.length) {
            set(this.data, [pageId, "sub_pages_count"], subPages.length);
          }
          subPages.forEach((subPage) => {
            if (subPage?.id) {
              const subPageInstance = this.getPageById(subPage.id);
              if (subPageInstance) {
                subPageInstance.mutateProperties(subPage, false);
              } else {
                set(this.data, [subPage.id], new TeamspacePage(this.rootStore, subPage));
              }
            }
          });
        }

        this.loader = undefined;
      });

      return page;
    } catch (error) {
      runInAction(() => {
        // Remove the page from store if fetch fails (page might not exist or be inaccessible)
        if (pageId && this.data[pageId]) {
          delete this.data[pageId];
        }

        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the page, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description create a page
   * @param {Partial<TPage>} pageData
   */
  createPage = async (pageData: Partial<TPage>) => {
    try {
      const { workspaceSlug, teamspaceId } = this.rootStore.router;
      if (!workspaceSlug || !teamspaceId) throw new Error("Missing workspace or teamspace ID");

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.teamspacePageService.create(workspaceSlug, teamspaceId, pageData);

      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new TeamspacePage(this.rootStore, page));
        if (page?.parent_id) {
          const parentPage = this.getPageById(page.parent_id);
          if (parentPage) {
            parentPage.mutateProperties({
              sub_pages_count: (parentPage.sub_pages_count ?? 0) + 1,
            });
          }
        }
        this.loader = undefined;
      });

      return page;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to create a page, Please try again later.",
        };
      });
      throw error;
    }
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
    const page = this.getPageById(pageId);

    runInAction(() => {
      if (pageId) {
        page.mutateProperties({ deleted_at: new Date() });
      }
      if (page?.parent_id) {
        const parentPage = this.getPageById(page.parent_id);
        if (parentPage) {
          parentPage.mutateProperties({
            sub_pages_count: (parentPage.sub_pages_count ?? 1) - 1,
          });
        }
      }
      if (this.rootStore.favorite.entityMap[pageId]) this.rootStore.favorite.removeFavoriteFromStore(pageId);
    });

    if (shouldSync) {
      await this.teamspacePageService.remove(workspaceSlug, teamspaceId, pageId);
    }
  };

  /**
   * @description move a page internally within the project hierarchy
   * @param {string} pageId - The ID of the page to move
   * @param {Partial<TPage>} updatePayload - The update payload containing parent_id and other properties
   */
  movePageInternally = async (pageId: string, updatePayload: Partial<TPage>) => {
    try {
      const pageInstance = this.getPageById(pageId);
      if (!pageInstance) return;

      runInAction(() => {
        // Handle parent_id changes and update sub_pages_count accordingly
        if (updatePayload.hasOwnProperty("parent_id") && updatePayload.parent_id !== pageInstance.parent_id) {
          this.updateParentSubPageCounts(pageInstance.parent_id ?? null, updatePayload.parent_id ?? null);
        }

        // Apply all updates to the page instance
        Object.keys(updatePayload).forEach((key) => {
          const currentPageKey = key as keyof TPage;
          set(pageInstance, key, updatePayload[currentPageKey] || undefined);
        });

        // Update the updated_at field locally to ensure reactions trigger
        pageInstance.updated_at = new Date();
      });

      await pageInstance.update(updatePayload);
    } catch (error) {
      console.error("Unable to move page internally", error);
      throw error;
    }
  };

  /**
   * @description Helper method to update sub_pages_count when moving pages between parents
   * @param {string | null} oldParentId - The current parent ID (can be null for root pages)
   * @param {string | null} newParentId - The new parent ID (can be null for root pages)
   * @private
   */
  private updateParentSubPageCounts = (oldParentId: string | null, newParentId: string | null) => {
    // Decrement count for old parent (if it exists)
    if (oldParentId) {
      const oldParentPageInstance = this.getPageById(oldParentId);
      if (oldParentPageInstance) {
        const newCount = Math.max(0, (oldParentPageInstance.sub_pages_count ?? 1) - 1);
        oldParentPageInstance.mutateProperties({ sub_pages_count: newCount });
      }
    }

    // Increment count for new parent (if it exists)
    if (newParentId) {
      const newParentPageInstance = this.getPageById(newParentId);
      if (newParentPageInstance) {
        const newCount = (newParentPageInstance.sub_pages_count ?? 0) + 1;
        newParentPageInstance.mutateProperties({ sub_pages_count: newCount });
      }
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
    delete this.data[pageId];
  };

  // page sharing actions
  fetchPageSharedUsers = async (pageId: string) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !pageId) return;

    if (projectId) {
      const sharedUsers = await this.pageShareService.getProjectPageSharedUsers(workspaceSlug, projectId, pageId);
      // Update page instance with shared users
      const page = this.getPageById(pageId);
      if (page && sharedUsers) {
        page.updateSharedUsers(sharedUsers);
      }
    } else {
      const sharedUsers = await this.pageShareService.getWorkspacePageSharedUsers(workspaceSlug, pageId);
      // Update page instance with shared users
      const page = this.getPageById(pageId);
      if (page && sharedUsers) {
        page.updateSharedUsers(sharedUsers);
      }
    }
  };

  bulkUpdatePageSharedUsers = async (pageId: string, sharedUsers: TPageSharedUser[]) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !pageId) return;

    if (projectId) {
      await this.pageShareService.bulkUpdateProjectPageSharedUsers(workspaceSlug, projectId, pageId, sharedUsers);
    } else {
      await this.pageShareService.bulkUpdateWorkspacePageSharedUsers(workspaceSlug, pageId, sharedUsers);
    }
  };
}
