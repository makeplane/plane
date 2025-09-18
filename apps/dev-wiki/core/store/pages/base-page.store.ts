import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { EPageAccess } from "@plane/constants";
// types
import { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// services
import { PageShareService, TPageSharedUser } from "@/plane-web/services/page/page-share.service";
import { RootStore } from "@/plane-web/store/root.store";
import { TBasePage } from "@/store/pages/base-page";
import { IBasePageService, IPageContext } from "./base-page.service";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TError = { title: string; description: string };
type TPageCategory = "public" | "private" | "archived" | "shared";

/**
 * Abstract base store for page management
 * This class contains all the common functionality shared between
 * ProjectPageStore and WorkspacePageStore, eliminating duplication
 *
 * @template TPageType - The specific page type (ProjectPage or WorkspacePage)
 * @template TService - The specific service type implementing IBasePageService
 * @template TContext - The context type (IWorkspacePageContext or IProjectPageContext)
 */
export abstract class BasePageStore<
  TPageType extends TBasePage,
  TService extends IBasePageService<TContext>,
  TContext extends IPageContext,
> {
  loader: TLoader = "init-loader";
  data: Map<string, TPageType> = observable.map(); // pageId => Page
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "updated_at",
    sortBy: "desc",
  };

  // Private properties
  protected _rootParentMap: Map<string, string | null> = new Map(); // pageId => rootParentId cache
  protected disposers: (() => void)[] = []; // Reaction disposers for cleanup

  // Services
  protected pageShareService: PageShareService;
  protected rootStore: RootStore;

  // Abstract properties that child classes must provide
  protected abstract service: TService;

  constructor(protected store: RootStore) {
    // Initialize MobX observables
    // We use makeObservable instead of makeAutoObservable for better control in inheritance
    makeObservable(this, {
      // Observables
      loader: observable.ref,
      error: observable,
      filters: observable,
      // Computed properties
      isAnyPageAvailable: computed,

      // Actions - using regular methods for better inheritance support
      updateFilters: action,
      clearAllFilters: action,
      fetchPagesByType: action,
      fetchParentPages: action,
      fetchPageDetails: action,
      createPage: action,
      removePage: action,
      updatePagesInStore: action,
      fetchPageSharedUsers: action,
      bulkUpdatePageSharedUsers: action,
      contextPages: computed,
      contextPageIdsByType: computed,
    });

    this.rootStore = store;
    this.pageShareService = new PageShareService();
  }

  /**
   * Abstract methods that child classes must implement
   * These handle the differences between project and workspace pages
   */

  // Create a new page instance - implementation differs by page type
  protected abstract createPageInstance(page: TPage): TPageType;

  // Get the context for API calls (workspaceSlug + projectId for project pages, only workspaceSlug for workspace pages)
  protected abstract getContext(): TContext | undefined;

  // Filter pages based on context (project pages filter by projectId, workspace by workspaceId)
  protected abstract filterPagesByContext(pages: TPageType[]): TPageType[];

  /**
   * Clean up reactions when the store is disposed
   * Important for preventing memory leaks
   */
  dispose() {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
  }

  // ===== COMPUTED PROPERTIES =====
  get isAnyPageAvailable() {
    if (this.loader) return true;
    return this.data.size > 0;
  }

  /**
   * Get all pages for the current context
   * This is now computed, automatically updating when data or context changes
   */
  get contextPages(): TPageType[] {
    const contextId = this.getContext();
    if (!contextId) return [];

    const allPages = Array.from(this.data.values());
    return this.filterPagesByContext(allPages);
  }

  /**
   * Get page IDs by navigation tab type for the current context
   * This provides top-level pages filtered by page type
   */
  get contextPageIdsByType(): Record<TPageNavigationTabs, string[]> {
    const contextId = this.getContext();
    if (!contextId) {
      return {
        public: [],
        private: [],
        archived: [],
        shared: [],
      };
    }

    // Get all pages for current context
    const contextPages = this.contextPages;

    // Helper function to filter and map
    const getIdsByType = (pageType: TPageNavigationTabs | "all"): string[] => {
      if (pageType === "all") {
        // For "all" type, return all non-archived, non-deleted top-level pages
        return contextPages
          .filter((p) => !p.parent_id && !p.archived_at && !p.deleted_at)
          .map((p) => p.id)
          .filter((id): id is string => id !== undefined);
      }

      // Filter by page type and only include top-level pages
      let pagesByType = filterPagesByPageType(pageType, contextPages);
      pagesByType = pagesByType.filter((p) => !p.parent_id);

      return pagesByType.map((page) => page.id).filter((id): id is string => id !== undefined);
    };

    return {
      public: getIdsByType("public"),
      private: getIdsByType("private"),
      archived: getIdsByType("archived"),
      shared: getIdsByType("shared"),
    };
  }
  
  // ===== HELPER METHODS =====
  private shouldShowArchivedPage(page: TPageType): boolean {
    if (!page.parent_id) return true;
    const rootParent = this.findRootParent(page);
    return !rootParent?.archived_at;
  }

  private shouldShowSharedPage(page: TPageType): boolean {
    if (!page.parent_id) return true;
    const parentPage = this.getPageById(page.parent_id);
    return !parentPage?.is_shared;
  }

  private shouldShowPrivatePage(page: TPageType): boolean {
    if (!page.parent_id) return true;
    const rootParent = this.findRootParent(page);
    return rootParent?.access !== EPageAccess.PRIVATE;
  }

  get pagesByCategory(): Record<TPageCategory, TPageType[]> {
    const pages = this.contextPages;

    // Use a single pass to categorize all pages
    const categorized: Record<TPageCategory, TPageType[]> = {
      public: [],
      private: [],
      archived: [],
      shared: [],
    };

    for (const page of pages) {
      // Skip deleted pages
      if (page.deleted_at) continue;

      // Archived pages
      if (page.archived_at) {
        if (this.shouldShowArchivedPage(page)) {
          categorized.archived.push(page);
        }
        continue;
      }

      // Shared pages
      if (page.is_shared) {
        if (this.shouldShowSharedPage(page)) {
          categorized.shared.push(page);
        }
        continue;
      }

      // Public or private pages
      if (page.access === EPageAccess.PUBLIC && !page.parent_id) {
        categorized.public.push(page);
      } else if (page.access === EPageAccess.PRIVATE) {
        if (this.shouldShowPrivatePage(page)) {
          categorized.private.push(page);
        }
      }
    }

    // Sort each category
    this.sortPageCategory(categorized.public);
    this.sortPageCategory(categorized.private);
    this.sortPageCategory(categorized.archived, "archived_at");
    this.sortPageCategory(categorized.shared);

    return categorized;
  }

  /**
   * Get page IDs by category - computed from pagesByCategory
   */
  getPageIdsByCategory = computedFn((category: TPageCategory): string[] =>
    this.pagesByCategory[category].map((page) => page.id).filter((id): id is string => id !== undefined)
  );

  /**
   * Get filtered page IDs by category
   * This applies search and custom filters on top of categorization
   */
  getFilteredPageIdsByCategory = computedFn((category: TPageCategory): string[] => {
    const pages = this.pagesByCategory[category];

    // Apply filters
    const filtered = pages.filter(
      (page) => this.matchesSearchQuery(page) && shouldFilterPage(page, this.filters.filters)
    );

    // Apply sorting
    const sorted = orderPages(
      filtered as unknown as TPage[],
      this.filters.sortKey,
      this.filters.sortBy
    ) as unknown as TPageType[];

    return sorted.map((page) => page.id).filter((id): id is string => id !== undefined);
  });

  private matchesSearchQuery(page: TPageType): boolean {
    if (!this.filters.searchQuery) return true;
    return getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase());
  }

  private sortPageCategory(pages: TPageType[], dateField: keyof TPageType = "updated_at"): void {
    pages.sort((a, b) => {
      const aDate = new Date((a[dateField] as any) ?? 0).getTime();
      const bDate = new Date((b[dateField] as any) ?? 0).getTime();
      return bDate - aDate;
    });
  }

  /**
   * Get all pages as an array
   */
  getAllPages = computedFn(() => Array.from(this.data.values()));

  /**
   * Get all page IDs as an array
   */
  getAllPageIds = computedFn(() => Array.from(this.data.keys()));

  /**
   * Get a page by its ID
   */
  getPageById = computedFn((pageId: string) => this.data.get(pageId) || undefined);

  /**
   * Get multiple pages by their IDs
   */
  getPagesByIds = computedFn((pageIds: string[]) =>
    pageIds.map((id) => this.getPageById(id)).filter((p): p is TPageType => !!p)
  );

  /**
   * Update or create a page in the store
   */
  updatePageInStore = (page: TPage) => {
    if (!page?.id) return;

    const existingPage = this.getPageById(page.id);
    if (existingPage) {
      existingPage.mutateProperties(page);
    } else {
      this.createAndSetPage(page.id, page);
    }
  };

  /**
   * Update or create multiple pages in the store
   */
  updatePagesInStore = (pages: TPage[]) => {
    this._rootParentMap.clear();

    runInAction(() => {
      for (const page of pages) {
        this.updatePageInStore(page);
      }
    });
  };

  /**
   * Remove a page from the store
   */
  removePageFromStore = (pageId: string) => {
    this.data.delete(pageId);
    this._rootParentMap.delete(pageId);
  };

  /**
   * Create and set a new page instance in the store
   */
  createAndSetPage = (pageId: string, page: TPage) => {
    this.data.set(pageId, this.createPageInstance(page));
  };

  /**
   * Update properties of an existing page if it exists
   */
  updatePageProperties = (pageId: string, properties: Partial<TPage>, shouldUpdateName: boolean = true) => {
    const pageInstance = this.getPageById(pageId);
    if (pageInstance) {
      pageInstance.mutateProperties(properties, shouldUpdateName);
    }
  };

  /**
   * Check if nested pages feature is enabled
   * This is used to determine UI behavior and filtering logic
   */
  isNestedPagesEnabled = computedFn((workspaceSlug: string) => {
    const { getFeatureFlag } = this.store.featureFlags;
    return getFeatureFlag(workspaceSlug, "NESTED_PAGES", false);
  });

  updateFilters = <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
    this.filters[filterKey] = filterValue;
  };

  clearAllFilters = () => {
    this.filters.filters = {};
    this.filters.searchQuery = "";
  };

  /**
   * Find the root parent of a page with caching
   * This is used for filtering pages in hierarchies
   */
  // TODO; Fix this logic
  findRootParent(page: TPageType): TPageType {
    if (!page?.parent_id || !page.id) return page;

    // Check cache first
    const cachedPageId = this._rootParentMap.get(page.id);
    if (cachedPageId) return this.getPageById(cachedPageId) || page;

    // Find root parent
    let current = page;
    const visited = new Set<string>(); // Prevent infinite loops

    while (current.parent_id && !visited.has(current.id!)) {
      visited.add(current.id!);
      const parent = this.getPageById(current.parent_id);
      if (!parent) break;
      current = parent;
    }

    if (current.id === page.id) return page;
    if (!current.id) return page;

    // Cache the result
    this._rootParentMap.set(page.id, current.id);
    return current;
  }

  /**
   * Categorize pages into their respective types
   * This is a template method that can be overridden by child classes
   */
  protected categorizePages(pages: TPageType[]) {
    // Public pages: top-level, not archived, not deleted, not shared
    const publicPages = pages.filter(
      (page) =>
        page?.access === EPageAccess.PUBLIC &&
        !page?.parent_id &&
        !page?.archived_at &&
        !page?.deleted_at &&
        !page?.is_shared
    );
    const publicIds = publicPages
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .map((page) => page?.id)
      .filter((id): id is string => id !== undefined);

    // Private pages: complex logic involving parent checks
    const nonArchivedPages = pages.filter((page) => !page?.archived_at && !page?.deleted_at && !page?.is_shared);
    const privateParentPages = nonArchivedPages.filter(
      (page) => page?.access === EPageAccess.PRIVATE && !page?.parent_id
    );
    const privateChildPages = nonArchivedPages.filter((page) => {
      if (page?.parent_id === null || page?.access !== EPageAccess.PRIVATE || !page?.id) return false;
      const rootParent = this.findRootParent(page);
      return rootParent?.access !== EPageAccess.PRIVATE;
    });
    const combinedPrivatePages = [...privateParentPages, ...privateChildPages];
    const privateIds = combinedPrivatePages
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .map((page) => page?.id)
      .filter((id): id is string => id !== undefined);

    // Archived pages: top-level archived or archived children of non-archived parents
    const archivedPages = pages.filter((page) => page?.archived_at && !page?.deleted_at);
    const topLevelArchivedPages = archivedPages.filter((page) => {
      if (!page?.parent_id) return true;
      const rootParent = this.findRootParent(page);
      return !rootParent?.archived_at;
    });
    const archivedIds = topLevelArchivedPages
      .sort((a, b) => new Date(b.archived_at ?? 0).getTime() - new Date(a.archived_at ?? 0).getTime())
      .map((page) => page?.id)
      .filter((id): id is string => id !== undefined);

    // Shared pages: pages with is_shared flag, excluding nested shared pages
    const sharedPages = pages.filter((page) => {
      if (!page?.is_shared) return false;
      if (!page?.parent_id) return true;
      const parentPage = page?.parent_id ? this.getPageById(page.parent_id) : null;
      return !parentPage?.is_shared;
    });
    const sharedIds = sharedPages
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .map((page) => page?.id)
      .filter((id): id is string => id !== undefined);

    return { publicIds, privateIds, archivedIds, sharedIds };
  }

  /**
   * Apply filters and sorting to pages
   * This creates the filtered versions of our page arrays
   */
  protected filterAndSortPages(pages: TPageType[]) {
    const applyFiltersAndSort = (pageList: TPageType[]) => {
      const filtered = pageList.filter(
        (page) =>
          page?.name &&
          getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
          shouldFilterPage(page, this.filters.filters)
      );
      const sorted = orderPages(
        filtered as unknown as TPage[],
        this.filters.sortKey,
        this.filters.sortBy
      ) as unknown as TPageType[];
      return sorted.map((page) => page?.id).filter((id): id is string => id !== undefined);
    };

    // Get the categorized pages first
    const { publicIds, privateIds, archivedIds, sharedIds } = this.categorizePages(pages);

    // Convert IDs back to pages for filtering
    return {
      filteredPublicIds: applyFiltersAndSort(this.getPagesByIds(publicIds)),
      filteredPrivateIds: applyFiltersAndSort(this.getPagesByIds(privateIds)),
      filteredArchivedIds: applyFiltersAndSort(this.getPagesByIds(archivedIds)),
      filteredSharedIds: applyFiltersAndSort(this.getPagesByIds(sharedIds)),
    };
  }

  // ===== API METHODS =====
  /**
   * Fetch pages by type with optional search
   */
  fetchPagesByType = async (pageType: string, searchQuery?: string) => {
    try {
      const context = this.getContext();
      if (!context) return undefined;

      const currentPageIds = this.getAllPageIds();
      runInAction(() => {
        this.loader = currentPageIds.length > 0 ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const pages = await this.service.fetchPagesByType(context, pageType, searchQuery);

      runInAction(() => {
        for (const page of pages) {
          this.updatePageInStore(page);
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
   * Fetch parent pages of a given page
   */
  fetchParentPages = async (pageId: string) => {
    const context = this.getContext();
    if (!context || !pageId) return undefined;

    const response = await this.service.fetchParentPages(context, pageId);

    runInAction(() => {
      for (const page of response) {
        this.updatePageInStore(page);
      }
    });

    return response;
  };

  /**
   * Fetch detailed information about a specific page
   */
  fetchPageDetails = async (pageId: string, shouldFetchSubPages: boolean | undefined = true) => {
    try {
      const context = this.getContext();
      if (!context || !pageId) return undefined;

      const doesPageExist = !!this.getPageById(pageId);
      runInAction(() => {
        this.loader = doesPageExist ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const promises: Promise<any>[] = [this.service.fetchById(context, pageId)];

      if (shouldFetchSubPages) {
        promises.push(this.service.fetchSubPages(context, pageId));
      }

      const results = await Promise.all(promises);
      const page = results[0] as TPage | undefined;
      const subPages = shouldFetchSubPages ? (results[1] as TPage[]) : [];

      runInAction(() => {
        if (page) {
          const pageInstance = this.getPageById(pageId);
          if (pageInstance) {
            pageInstance.mutateProperties(page, false);
          } else {
            this.createAndSetPage(pageId, page);
          }
        }

        if (shouldFetchSubPages && subPages.length) {
          this.updatePageProperties(pageId, { sub_pages_count: subPages.length });
          subPages.forEach((subPage) => {
            this.updatePageInStore(subPage);
          });
        }

        this.loader = undefined;
      });

      return page;
    } catch (error) {
      runInAction(() => {
        if (pageId) {
          this.removePageFromStore(pageId);
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
   * Create a new page
   */
  createPage = async (pageData: Partial<TPage>) => {
    try {
      const context = this.getContext();
      if (!context) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.service.create(context, pageData);
      this._rootParentMap.clear();

      runInAction(() => {
        if (page?.id) {
          this.createAndSetPage(page.id, page);
        }
        if (page?.parent_id) {
          const parentPage = this.getPageById(page.parent_id);
          if (parentPage) {
            this.updatePageProperties(page.parent_id, {
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
   * Delete a page
   */
  removePage = async ({ pageId, shouldSync = true }: { pageId: string; shouldSync?: boolean }) => {
    try {
      const context = this.getContext();
      if (!context || !pageId) return undefined;

      const page = this.getPageById(pageId);
      if (!page) return;

      runInAction(() => {
        page.mutateProperties({ deleted_at: new Date() });
        if (page?.parent_id) {
          const parentPage = this.getPageById(page.parent_id);
          if (parentPage) {
            this.updatePageProperties(page.parent_id, {
              sub_pages_count: (parentPage.sub_pages_count ?? 1) - 1,
            });
          }
        }
        if (this.rootStore.favorite.entityMap[pageId]) {
          this.rootStore.favorite.removeFavoriteFromStore(pageId);
        }
      });

      if (shouldSync) {
        await this.service.remove(context, pageId);
      }
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to delete a page, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * Get or fetch a page instance
   */
  getOrFetchPageInstance = async ({ pageId }: { pageId: string }) => {
    const pageInstance = this.getPageById(pageId);
    if (pageInstance) {
      return pageInstance;
    } else {
      const page = await this.fetchPageDetails(pageId);
      if (page) {
        return this.createPageInstance(page);
      }
    }
  };

  removePageInstance = (pageId: string) => {
    this.removePageFromStore(pageId);
  };

  // ===== PAGE SHARING METHODS =====

  /**
   * Fetch users who have access to a shared page
   * This is implemented differently in project vs workspace stores
   */
  abstract fetchPageSharedUsers(pageId: string): Promise<void>;

  /**
   * Update the list of users who have access to a page
   */
  abstract bulkUpdatePageSharedUsers(pageId: string, sharedUsers: TPageSharedUser[]): Promise<void>;
}
