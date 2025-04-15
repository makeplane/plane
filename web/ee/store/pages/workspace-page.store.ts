import set from "lodash/set";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
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
  // new helper methods for sidebar
  getPublicPages: () => string[];
  getPrivatePages: () => string[];
  getArchivedPages: () => string[];
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
  // private props
  private _rootParentMap: Map<string, string | null> = new Map(); // pageId => rootParentId
  // services
  pageService: WorkspacePageService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
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

  // New helper methods for sidebar
  getPublicPages = computedFn(() => {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return [];

    // Get only top-level public pages in one pass
    return Object.values(this.data)
      .filter(
        (page) =>
          page.workspace === currentWorkspace.id &&
          page.access === EPageAccess.PUBLIC &&
          !page.parent_id &&
          !page.archived_at
      )
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);
  });

  getPrivatePages = computedFn(() => {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return [];

    // Get all pages for this workspace in one pass
    const workspacePages = Object.values(this.data).filter(
      (page) => page.workspace === currentWorkspace.id && !page.archived_at
    );

    // Extract top-level private pages
    const parentPages = workspacePages.filter((page) => page.access === EPageAccess.PRIVATE && !page.parent_id);

    // Extract child pages with non-private root parents
    const childPages = workspacePages.filter((page) => {
      if (!page.parent_id || page.access !== EPageAccess.PRIVATE || !page.id) return false;

      // Get root parent from cache or compute it
      let rootParentId = this._rootParentMap.get(page.id);

      if (rootParentId === undefined) {
        const rootParent = this.findRootParent(page);
        rootParentId = rootParent?.id || null;
        if (rootParentId) this._rootParentMap.set(page.id, rootParentId);
      }

      if (!rootParentId) return false;

      // Get the root parent page
      const rootParent = this.getPageById(rootParentId);
      return rootParent?.access !== EPageAccess.PRIVATE;
    });

    // Combine and extract IDs, filter out any undefined IDs
    return [...parentPages, ...childPages].map((page) => page.id).filter((id): id is string => id !== undefined);
  });

  getArchivedPages = computedFn(() => {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return [];

    // Get all archived pages for this workspace in one pass
    const archivedPages = Object.values(this.data).filter(
      (page) => page.workspace === currentWorkspace.id && page.archived_at
    );

    // Sort parent pages first, then child pages
    const sortedPages = [
      ...archivedPages.filter((page) => !page.parent_id),
      ...archivedPages.filter((page) => page.parent_id),
    ];

    // Extract IDs
    return sortedPages.map((page) => page.id).filter((id): id is string => id !== undefined);
  });

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
