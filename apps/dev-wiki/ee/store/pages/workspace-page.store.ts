import set from "lodash/set";
import { makeObservable, observable, runInAction, action, computed, reaction } from "mobx";
import { computedFn } from "mobx-utils";
import { EPageAccess } from "@plane/constants";
// types
import { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// plane web services
import { WorkspacePageService } from "@/plane-web/services/page";
// services
import { PageShareService, TPageSharedUser } from "@/plane-web/services/page/page-share.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { TWorkspacePage, WorkspacePage } from "./workspace-page";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export interface IWorkspacePageStore {
  // observables
  loader: TLoader;
  data: Record<string, TWorkspacePage>; // pageId => Page
  error: TError | undefined;
  filters: TPageFilters;
  // page type arrays
  publicPageIds: string[];
  privatePageIds: string[];
  archivedPageIds: string[];
  sharedPageIds: string[];
  // filtered page type arrays
  filteredPublicPageIds: string[];
  filteredPrivatePageIds: string[];
  filteredArchivedPageIds: string[];
  filteredSharedPageIds: string[];
  // computed
  isAnyPageAvailable: boolean;
  currentWorkspacePageIds: string[] | undefined;
  // helper actions
  getCurrentWorkspacePageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentWorkspaceFilteredPageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TWorkspacePage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  isCommentsEnabled: (workspaceSlug: string) => boolean;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  findRootParent: (page: TWorkspacePage) => TWorkspacePage | undefined;
  clearRootParentCache: () => void;
  // actions
  fetchAllPages: () => Promise<TPage[] | undefined>;
  fetchPagesByType: (pageType: string, searchQuery?: string) => Promise<TPage[] | undefined>;
  fetchParentPages: (pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    pageId: string,
    options?: {
      trackVisit?: boolean;
      shouldFetchSubPages?: boolean;
    }
  ) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  movePageInternally: (pageId: string, updatePayload: Partial<TPage>) => Promise<void>;
  getOrFetchPageInstance: ({ pageId }: { pageId: string }) => Promise<TWorkspacePage | undefined>;
  removePageInstance: (pageId: string) => void;
  updatePagesInStore: (pages: TPage[]) => void;
  // page sharing actions
  fetchPageSharedUsers: (pageId: string) => Promise<void>;
  bulkUpdatePageSharedUsers: (pageId: string, sharedUsers: TPageSharedUser[]) => Promise<void>;
}

export class WorkspacePageStore implements IWorkspacePageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TWorkspacePage> = {}; // pageId => Page
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "updated_at",
    sortBy: "desc",
  };
  // page type arrays
  publicPageIds: string[] = [];
  privatePageIds: string[] = [];
  archivedPageIds: string[] = [];
  sharedPageIds: string[] = [];
  // filtered page type arrays
  filteredPublicPageIds: string[] = [];
  filteredPrivatePageIds: string[] = [];
  filteredArchivedPageIds: string[] = [];
  filteredSharedPageIds: string[] = [];
  // private props
  private _rootParentMap: Map<string, string | null> = new Map(); // pageId => rootParentId
  // disposers for reactions
  private disposers: (() => void)[] = [];
  // services
  pageService: WorkspacePageService;
  pageShareService: PageShareService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      // page type arrays
      publicPageIds: observable,
      privatePageIds: observable,
      archivedPageIds: observable,
      sharedPageIds: observable,
      // filtered page type arrays
      filteredPublicPageIds: observable,
      filteredPrivatePageIds: observable,
      filteredArchivedPageIds: observable,
      filteredSharedPageIds: observable,
      // computed
      currentWorkspacePageIds: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      fetchAllPages: action,
      fetchPagesByType: action,
      fetchParentPages: action,
      fetchPageDetails: action,
      createPage: action,
      removePage: action,
      updatePagesInStore: action,
      // page sharing actions
      fetchPageSharedUsers: action,
      bulkUpdatePageSharedUsers: action,
    });

    // service
    this.pageService = new WorkspacePageService();
    this.pageShareService = new PageShareService();

    // Set up reactions to automatically update page type arrays
    this.setupReactions();
  }

  /**
   * Set up MobX reactions to automatically update the page type arrays
   */
  private setupReactions() {
    // Update page arrays whenever data or workspace changes
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
          is_shared: page.is_shared,
        })),
        currentWorkspace: this.store.workspaceRoot.currentWorkspace?.id,
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
  }

  /**
   * @description check if any page is available
   */
  get isAnyPageAvailable() {
    if (this.loader) return true;
    return Object.keys(this.data).length > 0;
  }

  /**
   * @description get the current workspace page ids
   */
  get currentWorkspacePageIds() {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;
    // helps to filter pages based on the pageType
    const pagesList = Object.values(this?.data || {}).filter((p) => p.workspace === currentWorkspace.id);

    const pages = (pagesList.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  /**
   * @description get the current workspace page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentWorkspacePageIdsByType = computedFn((pageType: TPageNavigationTabs) => {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;

    let pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.workspace === currentWorkspace.id);
    pagesByType = pagesByType.filter((p) => !p.parent_id);

    const pageIds = pagesByType.map((page) => page.id).filter((id): id is string => id !== undefined);

    return pageIds;
  });

  /**
   * @description get the current workspace filtered page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentWorkspaceFilteredPageIdsByType = computedFn((pageType: TPageNavigationTabs) => {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;

    // Return the appropriate filtered array based on page type
    switch (pageType) {
      case "public":
        return this.filteredPublicPageIds;
      case "private":
        return this.filteredPrivatePageIds;
      case "archived":
        return this.filteredArchivedPageIds;
      case "shared":
        return this.filteredSharedPageIds;
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
   * Returns true if nested pages feature is enabled
   * @returns boolean
   */
  isNestedPagesEnabled = computedFn((workspaceSlug: string) => {
    const { getFeatureFlag } = this.store.featureFlags;
    return getFeatureFlag(workspaceSlug, "NESTED_PAGES", false);
  });

  /**
   * Returns true if comments in pages feature is enabled
   * @returns boolean
   */
  isCommentsEnabled = computedFn((workspaceSlug: string) => {
    const { getFeatureFlag } = this.store.featureFlags;
    return getFeatureFlag(workspaceSlug, "PAGE_COMMENTS", false);
  });

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
    // Clear the root parent cache when updating pages
    this._rootParentMap.clear();

    runInAction(() => {
      for (const page of pages) {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page);
          } else {
            set(this.data, [page.id], new WorkspacePage(this.store, page));
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
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) {
      // Clear arrays when no workspace is selected
      runInAction(() => {
        // Clear unfiltered arrays
        this.publicPageIds = [];
        this.privatePageIds = [];
        this.archivedPageIds = [];
        this.sharedPageIds = [];
        // Clear filtered arrays
        this.filteredPublicPageIds = [];
        this.filteredPrivatePageIds = [];
        this.filteredArchivedPageIds = [];
        this.filteredSharedPageIds = [];
      });
      return;
    }

    const allPages = Object.values(this.data);
    const workspacePages = allPages.filter((page) => page.workspace === currentWorkspace.id);

    // ---------- PUBLIC PAGES ----------
    // Unfiltered public pages
    const publicPages = workspacePages.filter(
      (page) =>
        page.access === EPageAccess.PUBLIC &&
        !page.parent_id &&
        !page.archived_at &&
        !page.deleted_at &&
        !page.is_shared
    );
    const newPublicPageIds = publicPages
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

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
    ) as unknown as TWorkspacePage[];
    const newFilteredPublicPageIds = sortedFilteredPublicPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);
    // ---------- PRIVATE PAGES ----------
    // Unfiltered private pages (sorted by updated_at)
    const nonArchivedPages = workspacePages.filter((page) => !page.archived_at && !page.deleted_at && !page.is_shared);
    const privateParentPages = nonArchivedPages.filter(
      (page) => page.access === EPageAccess.PRIVATE && !page.parent_id
    );
    const privateChildPages = nonArchivedPages.filter((page) => {
      if (page.parent_id === null || page.access !== EPageAccess.PRIVATE || !page.id) return false;
      const rootParent = this.findRootParent(page);
      return rootParent?.access !== EPageAccess.PRIVATE;
    });
    const combinedPrivatePages = [...privateParentPages, ...privateChildPages];
    const newPrivatePageIds = combinedPrivatePages
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // Filtered private pages (with all filters applied)
    const filteredPrivatePages = combinedPrivatePages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, this.filters.filters)
    );
    const sortedFilteredPrivatePages = orderPages(
      filteredPrivatePages as unknown as TPage[],
      this.filters.sortKey,
      this.filters.sortBy
    ) as unknown as TWorkspacePage[];
    const newFilteredPrivatePageIds = sortedFilteredPrivatePages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- ARCHIVED PAGES ----------
    // Unfiltered archived pages (sorted alphabetically by name)
    const archivedWorkspacePages = workspacePages.filter((page) => page.archived_at && !page.deleted_at);
    const topLevelArchivedPages = archivedWorkspacePages.filter((page) => {
      if (!page.parent_id) return true; // Include pages without parents
      const rootParent = this.findRootParent(page);
      return !rootParent?.archived_at;
    });
    const newArchivedPageIds = topLevelArchivedPages
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
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
    ) as unknown as TWorkspacePage[];
    const newFilteredArchivedPageIds = sortedFilteredArchivedPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- SHARED PAGES ----------
    // Shared pages come directly from API when fetched with type="shared"
    // Only show pages at first level that don't have a shared parent
    const sharedPages = workspacePages.filter((page) => {
      if (!page.is_shared) return false;

      // If page has no parent, include it
      if (!page.parent_id) return true;

      // If page has a parent, check if parent is shared
      const parentPage = this.getPageById(page.parent_id);
      return !parentPage?.is_shared;
    });
    const newSharedPageIds = sharedPages
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // Filtered shared pages (with all filters applied)
    const filteredSharedPages = sharedPages.filter(
      (page) =>
        getPageName(page.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(page, this.filters.filters)
    );
    const sortedFilteredSharedPages = orderPages(
      filteredSharedPages as unknown as TPage[],
      this.filters.sortKey,
      this.filters.sortBy
    ) as unknown as TWorkspacePage[];
    const newFilteredSharedPageIds = sortedFilteredSharedPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // Update arrays in a single runInAction to batch updates
    runInAction(() => {
      // Update unfiltered arrays
      this.publicPageIds = newPublicPageIds;
      this.privatePageIds = newPrivatePageIds;
      this.archivedPageIds = newArchivedPageIds;
      this.sharedPageIds = newSharedPageIds;

      // Update filtered arrays
      this.filteredPublicPageIds = newFilteredPublicPageIds;
      this.filteredPrivatePageIds = newFilteredPrivatePageIds;
      this.filteredArchivedPageIds = newFilteredArchivedPageIds;
      this.filteredSharedPageIds = newFilteredSharedPageIds;
    });
  };

  /**
   * @description fetch all the pages
   */
  fetchAllPages = async () => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return undefined;

      const currentPageIds = this.currentWorkspacePageIds;
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.pageService.fetchAll(workspaceSlug);
      runInAction(() => {
        for (const page of pages)
          if (page?.id) {
            const pageInstance = this.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.data, [page.id], new WorkspacePage(this.store, page));
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
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug || !pageId) return undefined;
    const response = await this.pageService.fetchParentPages(workspaceSlug, pageId);

    // Store the parent pages data in the store
    runInAction(() => {
      for (const page of response) {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page);
          } else {
            set(this.data, [page.id], new WorkspacePage(this.store, page));
          }
        }
      }
    });

    return response;
  };

  /**
   * @description fetch the details of a page
   */
  fetchPageDetails: IWorkspacePageStore["fetchPageDetails"] = async (pageId, options) => {
    const shouldFetchSubPages = options?.shouldFetchSubPages ?? true;
    const trackVisit = options?.trackVisit ?? true;
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;
      const doesPageExist = !!this.getPageById(pageId);

      runInAction(() => {
        this.loader = doesPageExist ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const promises: Promise<TPage | TPage[]>[] = [this.pageService.fetchById(workspaceSlug, pageId, trackVisit)];

      if (shouldFetchSubPages) {
        promises.push(this.pageService.fetchSubPages(workspaceSlug, pageId));
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
            set(this.data, [pageId], new WorkspacePage(this.store, page));
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
                set(this.data, [subPage.id], new WorkspacePage(this.store, subPage));
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

        // Clear any cached root parent references for this page
        this._rootParentMap.delete(pageId);

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
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.pageService.create(workspaceSlug, pageData);
      // Clear root parent cache when creating a new page
      this._rootParentMap.clear();

      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new WorkspacePage(this.store, page));
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
   * @description delete a page
   * @param {string} pageId
   */
  removePage = async ({ pageId, shouldSync = true }: { pageId: string; shouldSync?: boolean }) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;
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
      });

      if (shouldSync) {
        await this.pageService.remove(workspaceSlug, pageId);
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
      runInAction(() => {
        this.error = {
          title: "Failed",
          description: "Failed to move page internally, Please try again later.",
        };
      });
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
      const page = await this.fetchPageDetails(pageId);
      if (page) {
        return new WorkspacePage(this.store, page);
      }
    }
  };

  removePageInstance = (pageId: string) => {
    delete this.data[pageId];
  };

  fetchPagesByType = async (pageType: string, searchQuery?: string) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return undefined;

      const currentPageIds = this.currentWorkspacePageIds;
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.pageService.fetchPagesByType(workspaceSlug, pageType, searchQuery);
      runInAction(() => {
        for (const page of pages) {
          if (page?.id) {
            const pageInstance = this.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.data, [page.id], new WorkspacePage(this.store, page));
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

  // Helper function to find the root parent of a page with caching
  findRootParent = computedFn((page: TWorkspacePage): TWorkspacePage => {
    if (!page?.id || !page?.parent_id) {
      return page;
    }

    // Check cache first
    const cachedRootId = this._rootParentMap.get(page.id);
    if (cachedRootId) return this.getPageById(cachedRootId);

    // Get the parent page
    const parentId = page?.parent_id;

    const parentPage = this.getPageById(parentId);

    // Recursively find the root parent
    const rootParent = this.findRootParent(parentPage);

    // Cache the result
    if (rootParent && rootParent.id && page.id) {
      this._rootParentMap.set(page.id, rootParent.id);
    } else if (page.id) {
      this._rootParentMap.set(page.id, null);
    }

    return rootParent;
  });

  clearRootParentCache = () => {
    this._rootParentMap.clear();
  };

  // Page sharing actions
  fetchPageSharedUsers = async (pageId: string) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return;

      const sharedUsers = await this.pageShareService.getWorkspacePageSharedUsers(workspaceSlug, pageId);
      const finalUsers = sharedUsers.map((user) => ({
        user_id: user.user_id,
        access: user.access,
      }));

      runInAction(() => {
        const page = this.getPageById(pageId);
        if (page && finalUsers) {
          page.updateSharedUsers(finalUsers);
        }
      });
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch page shared users. Please try again later.",
        };
      });
      throw error;
    }
  };

  bulkUpdatePageSharedUsers = async (pageId: string, sharedUsers: TPageSharedUser[]) => {
    const oldSharedUsers = this.getPageById(pageId)?.sharedUsers || [];
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return;

      const page = this.getPageById(pageId);
      if (!page) return;

      // Optimistically update the state
      runInAction(() => {
        if (sharedUsers.length === 0) {
          page.is_shared = false;
        } else {
          page.is_shared = true;
        }
        page.updateSharedUsers(sharedUsers);
      });

      // Make API call
      await this.pageShareService.bulkUpdateWorkspacePageSharedUsers(workspaceSlug, pageId, sharedUsers);
    } catch (error) {
      runInAction(() => {
        // Revert to old shared users list on error
        const page = this.getPageById(pageId);
        if (page) {
          if (oldSharedUsers.length === 0) {
            page.is_shared = false;
          } else {
            page.is_shared = true;
          }
          page.updateSharedUsers(oldSharedUsers);
        }
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to bulk update page shared users. Please try again later.",
        };
      });
      throw error;
    }
  };
}
