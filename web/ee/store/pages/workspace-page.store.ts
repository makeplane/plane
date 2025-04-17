import set from "lodash/set";
import { makeObservable, observable, runInAction, action, computed, reaction } from "mobx";
import { computedFn } from "mobx-utils";
import { EPageAccess } from "@plane/constants";
// types
import { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@/helpers/page.helper";
// plane web services
import { WorkspacePageService } from "@/plane-web/services/page";
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
  // computed
  isAnyPageAvailable: boolean;
  currentWorkspacePageIds: string[] | undefined;
  // helper actions
  getCurrentWorkspacePageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentWorkspaceFilteredPageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TWorkspacePage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  findRootParent: (page: TWorkspacePage) => TWorkspacePage | undefined;
  clearRootParentCache: () => void;
  // actions
  fetchAllPages: () => Promise<TPage[] | undefined>;
  fetchPagesByType: (pageType: string, searchQuery?: string) => Promise<TPage[] | undefined>;
  fetchParentPages: (pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (pageId: string, shouldFetchSubPages?: boolean | undefined) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  getOrFetchPageInstance: (pageId: string) => Promise<TWorkspacePage | undefined>;
  updatePagesInStore: (pages: TPage[]) => void;
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
  // private props
  private _rootParentMap: Map<string, string | null> = new Map(); // pageId => rootParentId
  // disposers for reactions
  private disposers: (() => void)[] = [];
  // services
  pageService: WorkspacePageService;

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
    });

    // service
    this.pageService = new WorkspacePageService();

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
          updated_at: page.updated_at,
          access: page.access,
          archived_at: page.archived_at,
          deleted_at: page.deleted_at,
          parent_id: page.parent_id,
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

    // Add the disposer to clean up later
    this.disposers.push(updatePageArraysReaction);
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
    // helps to filter pages based on the pageType
    const pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    let filteredPages = pagesByType.filter(
      (p) =>
        p.workspace === currentWorkspace.id &&
        !p.parent_id &&
        getPageName(p.name).toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(p, this.filters.filters)
    );

    filteredPages = orderPages(filteredPages, this.filters.sortKey, this.filters.sortBy);

    const pages = (filteredPages.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
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

  updateFilters = <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
    runInAction(() => {
      set(this.filters, [filterKey], filterValue);
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
        this.publicPageIds = [];
        this.privatePageIds = [];
        this.archivedPageIds = [];
      });
      return;
    }

    const allPages = Object.values(this.data);
    const workspacePages = allPages.filter((page) => page.workspace === currentWorkspace.id);

    // Compute new page IDs for each type
    const publicPages = workspacePages.filter(
      (page) => page.access === EPageAccess.PUBLIC && !page.parent_id && !page.archived_at && !page.deleted_at
    );
    const sortedPublicPages = publicPages.sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
    const newPublicPageIds = sortedPublicPages.map((page) => page.id).filter((id): id is string => id !== undefined);

    // Get all non-archived pages for private calculation
    const nonArchivedPages = workspacePages.filter((page) => !page.archived_at && !page.deleted_at);

    // Compute private pages
    const privateParentPages = nonArchivedPages.filter(
      (page) => page.access === EPageAccess.PRIVATE && !page.parent_id
    );

    // Find child pages with non-private root parents
    const privateChildPages = nonArchivedPages.filter((page) => {
      if (!page.parent_id || page.access !== EPageAccess.PRIVATE || !page.id) return false;

      // Find root parent
      const rootParent = this.findRootParent(page);
      return rootParent?.access !== EPageAccess.PRIVATE;
    });

    const combinedPrivatePages = [...privateParentPages, ...privateChildPages];
    const sortedPrivatePages = combinedPrivatePages.sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
    const newPrivatePageIds = sortedPrivatePages.map((page) => page.id).filter((id): id is string => id !== undefined);

    // Compute archived pages
    const archivedWorkspacePages = workspacePages.filter((page) => page.archived_at && !page.deleted_at);
    const topLevelArchivedPages = archivedWorkspacePages.filter((page) => {
      if (!page.parent_id) return true; // Include pages without parents
      // Include pages whose root parent is not archived
      const rootParent = this.findRootParent(page);
      return !rootParent?.archived_at;
    });
    const sortedArchivedPages = topLevelArchivedPages.sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
    const newArchivedPageIds = sortedArchivedPages.map((page) => page.id).filter((id): id is string => id !== undefined);

    // Update arrays in a single runInAction to batch updates
    runInAction(() => {
      this.publicPageIds = newPublicPageIds;
      this.privatePageIds = newPrivatePageIds;
      this.archivedPageIds = newArchivedPageIds;
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
   * @param {string} pageId
   */
  fetchPageDetails = async (pageId: string, shouldFetchSubPages: boolean | undefined = true) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;
      const pageInstance = this.getPageById(pageId);

      runInAction(() => {
        this.loader = pageInstance ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const promises: Promise<any>[] = [this.pageService.fetchById(workspaceSlug, pageId)];

      if (shouldFetchSubPages) {
        promises.push(this.pageService.fetchSubPages(workspaceSlug, pageId));
      }

      const results = await Promise.all(promises);
      const page = results[0] as TPage | undefined;
      const subPages = shouldFetchSubPages ? (results[1] as TPage[]) : [];

      runInAction(() => {
        if (page) {
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

  getOrFetchPageInstance = async (pageId: string) => {
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

  // Helper function to find the root parent of a page with caching
  findRootParent = computedFn((page: TWorkspacePage): TWorkspacePage | undefined => {
    if (!page.parent_id) return page;
    if (!page.id) return undefined;

    // Check cache first
    const cachedRootId = this._rootParentMap.get(page.id);
    if (cachedRootId === null) return undefined; // No root parent found (previous lookup)
    if (cachedRootId) return this.getPageById(cachedRootId);

    // Get the parent page
    const parentId = page.parent_id;
    if (!parentId) return undefined;

    const parentPage = this.getPageById(parentId);
    if (!parentPage) {
      if (page.id) {
        this._rootParentMap.set(page.id, null); // Cache the miss
      }
      return undefined;
    }

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
}
