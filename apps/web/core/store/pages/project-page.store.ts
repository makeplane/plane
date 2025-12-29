import { unset, set } from "lodash-es";
import { makeObservable, observable, runInAction, action, reaction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { EUserPermissions } from "@plane/constants";
import type { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// plane web constants
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page";
// store
import type { CoreRootStore } from "../root.store";
import type { TProjectPage } from "./project-page";
import { ProjectPage } from "./project-page";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TPaginationLoader = "pagination" | undefined;

type TError = { title: string; description: string };

// Pagination info for each page type
export type TPagePaginationInfo = {
  nextCursor: string | null;
  hasNextPage: boolean;
  totalResults: number;
};

// Default pagination info
const DEFAULT_PAGINATION_INFO: TPagePaginationInfo = {
  nextCursor: null,
  hasNextPage: false, // Don't assume there's a next page until API tells us
  totalResults: 0,
};

// Per page count for pagination
const PAGES_PER_PAGE = 20;

export const ROLE_PERMISSIONS_TO_CREATE_PAGE = [
  EUserPermissions.ADMIN,
  EUserPermissions.MEMBER,
  EUserProjectRoles.ADMIN,
  EUserProjectRoles.MEMBER,
];

export interface IProjectPageStore {
  // observables
  loader: TLoader;
  data: Record<string, TProjectPage>; // pageId => Page
  error: TError | undefined;
  filters: TPageFilters;
  // filtered page type arrays
  filteredPublicPageIds: string[];
  filteredPrivatePageIds: string[];
  filteredArchivedPageIds: string[];
  // pagination info per page type
  paginationInfo: Record<TPageNavigationTabs, TPagePaginationInfo>;
  paginationLoader: Record<TPageNavigationTabs, TPaginationLoader>;
  // computed
  isAnyPageAvailable: boolean;
  canCurrentUserCreatePage: boolean;
  hasActiveFilters: boolean;
  // helper actions
  getCurrentProjectPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentProjectPageIds: (projectId: string) => string[];
  getCurrentProjectFilteredPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TProjectPage | undefined;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  getPaginationInfo: (pageType: TPageNavigationTabs) => TPagePaginationInfo;
  getPaginationLoader: (pageType: TPageNavigationTabs) => TPaginationLoader;
  // actions
  fetchPagesList: (
    workspaceSlug: string,
    projectId: string,
    pageType: TPageNavigationTabs,
    cursor?: string
  ) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    options?: { trackVisit?: boolean }
  ) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  movePage: (workspaceSlug: string, projectId: string, pageId: string, newProjectId: string) => Promise<void>;
}

export class ProjectPageStore implements IProjectPageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TProjectPage> = {}; // pageId => Page
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "created_at",
    sortBy: "desc",
  };
  // filtered page type arrays
  filteredPublicPageIds: string[] = [];
  filteredPrivatePageIds: string[] = [];
  filteredArchivedPageIds: string[] = [];
  // pagination info per page type
  paginationInfo: Record<TPageNavigationTabs, TPagePaginationInfo> = {
    public: { ...DEFAULT_PAGINATION_INFO },
    private: { ...DEFAULT_PAGINATION_INFO },
    archived: { ...DEFAULT_PAGINATION_INFO },
  };
  paginationLoader: Record<TPageNavigationTabs, TPaginationLoader> = {
    public: undefined,
    private: undefined,
    archived: undefined,
  };
  // service
  service: ProjectPageService;
  rootStore: CoreRootStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      filteredPublicPageIds: observable,
      filteredPrivatePageIds: observable,
      filteredArchivedPageIds: observable,
      // pagination info
      paginationInfo: observable,
      paginationLoader: observable,
      // computed
      isAnyPageAvailable: computed,
      canCurrentUserCreatePage: computed,
      hasActiveFilters: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      fetchPagesList: action,
      fetchPageDetails: action,
      createPage: action,
      removePage: action,
      movePage: action,
    });
    this.rootStore = store;
    // service
    this.service = new ProjectPageService();
    // initialize display filters of the current project
    reaction(
      () => this.store.router.projectId,
      (projectId) => {
        if (!projectId) return;
        this.filters.searchQuery = "";
      }
    );
  }

  /**
   * @description check if any page is available
   */
  get isAnyPageAvailable() {
    if (this.loader) return true;
    return Object.keys(this.data).length > 0;
  }

  /**
   * @description returns true if the current logged in user can create a page
   */
  get canCurrentUserCreatePage() {
    const { workspaceSlug, projectId } = this.store.router;
    const currentUserProjectRole = this.store.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(
      workspaceSlug?.toString() || "",
      projectId?.toString() || ""
    );
    return !!currentUserProjectRole && ROLE_PERMISSIONS_TO_CREATE_PAGE.includes(currentUserProjectRole);
  }

  /**
   * @description check if there are any active filters applied
   */
  get hasActiveFilters() {
    // Check if search query is active
    if (this.filters.searchQuery && this.filters.searchQuery.trim().length > 0) {
      return true;
    }

    // Check if any filters are applied
    if (this.filters.filters) {
      const filterValues = Object.values(this.filters.filters);
      // Check if any filter has a non-empty value
      return filterValues.some((value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === "boolean") {
          return value === true;
        }
        return value !== null && value !== undefined;
      });
    }

    return false;
  }

  /**
   * @description get the current project page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentProjectPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.project_ids?.includes(projectId));

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  });

  /**
   * @description get the current project page ids
   * @param {string} projectId
   */
  getCurrentProjectPageIds = computedFn((projectId: string) => {
    if (!projectId) return [];
    const pages = Object.values(this?.data || {}).filter((page) => page.project_ids?.includes(projectId));
    return pages.map((page) => page.id) as string[];
  });

  /**
   * @description get the current project filtered page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentProjectFilteredPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;

    // Return filtered page IDs from the filtered arrays
    switch (pageType) {
      case "public":
        return this.filteredPublicPageIds;
      case "private":
        return this.filteredPrivatePageIds;
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
   * @description get pagination info for a page type
   * @param {TPageNavigationTabs} pageType
   */
  getPaginationInfo = computedFn((pageType: TPageNavigationTabs): TPagePaginationInfo => {
    return this.paginationInfo[pageType] ?? DEFAULT_PAGINATION_INFO;
  });

  /**
   * @description get pagination loader for a page type
   * @param {TPageNavigationTabs} pageType
   */
  getPaginationLoader = computedFn((pageType: TPageNavigationTabs): TPaginationLoader => {
    return this.paginationLoader[pageType];
  });

  /**
   * @description fetch all the pages with pagination support
   * @param {string} workspaceSlug
   * @param {string} projectId
   * @param {TPageNavigationTabs} pageType - The type of pages to fetch
   * @param {string} [cursor] - Optional cursor for pagination. If not provided, fetches first page
   */
  fetchPagesList = async (workspaceSlug: string, projectId: string, pageType: TPageNavigationTabs, cursor?: string) => {
    try {
      if (!workspaceSlug || !projectId) return undefined;

      const pageNavigationTab = pageType as TPageNavigationTabs;
      const isFirstPage = !cursor;

      // For next page fetches, validate pagination state
      if (!isFirstPage) {
        const paginationInfo = this.paginationInfo[pageNavigationTab];
        // Don't fetch if there's no next page
        if (!paginationInfo?.hasNextPage || !paginationInfo?.nextCursor) {
          return undefined;
        }

        // Don't fetch if already loading
        const loader = this.paginationLoader[pageNavigationTab];
        if (loader === "pagination") {
          return undefined;
        }
      }

      // Build query parameters
      const queries: Record<string, string | number> = {
        per_page: PAGES_PER_PAGE,
      };

      // Add search query if provided
      if (this.filters.searchQuery) {
        queries.search = this.filters.searchQuery;
      }

      // Add sorting parameters
      // Convert sortKey and sortBy to Django order_by format
      if (this.filters.sortKey && this.filters.sortBy) {
        const orderByField = this.filters.sortBy === "desc" ? `-${this.filters.sortKey}` : this.filters.sortKey;
        queries.order_by = orderByField;
      }

      // Add cursor if provided
      if (!isFirstPage) {
        const nextCursor = this.paginationInfo[pageNavigationTab].nextCursor;
        if (nextCursor) {
          queries.cursor = nextCursor;
        }
      }

      // Add filter parameters from store filters
      const storeFilters = this.filters.filters || {};
      if (storeFilters.favorites) {
        queries.favorites = "true";
      }
      if (storeFilters.created_by && Array.isArray(storeFilters.created_by) && storeFilters.created_by.length > 0) {
        queries.created_by = storeFilters.created_by.join(",");
      }
      if (storeFilters.created_at && Array.isArray(storeFilters.created_at) && storeFilters.created_at.length > 0) {
        queries.created_at = storeFilters.created_at.join(",");
      }

      // Set appropriate loader and clear store on first page
      runInAction(() => {
        if (isFirstPage) {
          const currentPageIds = this.getCurrentProjectPageIdsByTab(pageType);
          this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;

          // Reset pagination info when fetching first page
          this.paginationInfo[pageNavigationTab] = { ...DEFAULT_PAGINATION_INFO };

          // Clear filtered arrays immediately
          switch (pageNavigationTab) {
            case "public":
              this.filteredPublicPageIds = [];
              break;
            case "private":
              this.filteredPrivatePageIds = [];
              break;
            case "archived":
              this.filteredArchivedPageIds = [];
              break;
          }
        } else {
          // Set pagination loader
          this.paginationLoader[pageNavigationTab] = "pagination";
        }
        this.error = undefined;
      });

      const response = await this.service.fetchAll(workspaceSlug, projectId, queries);

      // Parse response
      let pages: TPage[] = [];
      let paginationData: TPagePaginationInfo = {
        nextCursor: null,
        hasNextPage: false,
        totalResults: 0,
      };

      if (Array.isArray(response)) {
        pages = response;
        paginationData.totalResults = response.length;
      } else {
        pages = response.results || [];
        paginationData = {
          nextCursor: response.next_cursor || null,
          hasNextPage: response.next_page_results ?? false,
          totalResults: response.total_results ?? 0,
        };
      }

      runInAction(() => {
        // Get page IDs from response
        const responsePageIds = pages.map((p) => p.id).filter((id): id is string => id !== undefined);

        // Add/update pages in store
        for (const page of pages) {
          if (page?.id) {
            const existingPage = this.getPageById(page.id);
            if (existingPage) {
              // If page already exists, update all fields except name
              const { name, ...otherFields } = page;
              existingPage.mutateProperties(otherFields, false);
            } else {
              // If new page, create a new instance with all data
              set(this.data, [page.id], new ProjectPage(this.store, page));
            }
          }
        }

        // Populate filtered arrays
        switch (pageNavigationTab) {
          case "public":
            this.filteredPublicPageIds = isFirstPage
              ? responsePageIds
              : [...this.filteredPublicPageIds, ...responsePageIds];
            break;
          case "private":
            this.filteredPrivatePageIds = isFirstPage
              ? responsePageIds
              : [...this.filteredPrivatePageIds, ...responsePageIds];
            break;
          case "archived":
            this.filteredArchivedPageIds = isFirstPage
              ? responsePageIds
              : [...this.filteredArchivedPageIds, ...responsePageIds];
            break;
        }

        // Update pagination info
        this.paginationInfo[pageNavigationTab] = paginationData;

        // Clear appropriate loader
        if (isFirstPage) {
          this.loader = undefined;
        } else {
          this.paginationLoader[pageNavigationTab] = undefined;
        }
      });

      return pages;
    } catch (error) {
      runInAction(() => {
        const pageNavigationTab = pageType as TPageNavigationTabs;
        const isFirstPage = !cursor;

        if (isFirstPage) {
          this.loader = undefined;
        } else {
          this.paginationLoader[pageNavigationTab] = undefined;
        }

        this.error = {
          title: "Failed",
          description: isFirstPage
            ? "Failed to fetch the pages, Please try again later."
            : "Failed to fetch more pages, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description fetch the details of a page
   * @param {string} pageId
   */
  fetchPageDetails = async (...args: Parameters<IProjectPageStore["fetchPageDetails"]>) => {
    const [workspaceSlug, projectId, pageId, options] = args;
    const { trackVisit } = options || {};
    try {
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      const currentPageId = this.getPageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const page = await this.service.fetchById(workspaceSlug, projectId, pageId, trackVisit ?? true);

      runInAction(() => {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page, false);
          } else {
            set(this.data, [page.id], new ProjectPage(this.store, page));
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
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.service.create(workspaceSlug, projectId, pageData);
      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new ProjectPage(this.store, page));
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
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      await this.service.remove(workspaceSlug, projectId, pageId);
      runInAction(() => {
        unset(this.data, [pageId]);
        if (this.rootStore.favorite.entityMap[pageId]) this.rootStore.favorite.removeFavoriteFromStore(pageId);
      });
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
   * @description move a page to a new project
   * @param {string} workspaceSlug
   * @param {string} projectId
   * @param {string} pageId
   * @param {string} newProjectId
   */
  movePage = async (workspaceSlug: string, projectId: string, pageId: string, newProjectId: string) => {
    try {
      await this.service.move(workspaceSlug, projectId, pageId, newProjectId);
      runInAction(() => {
        unset(this.data, [pageId]);
      });
    } catch (error) {
      console.error("Unable to move page", error);
      throw error;
    }
  };
}
