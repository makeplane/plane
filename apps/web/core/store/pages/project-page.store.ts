import set from "lodash/set";
import { makeObservable, observable, runInAction, action, reaction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { EPageAccess, EUserPermissions } from "@plane/constants";
import { EUserProjectRoles, TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// plane web store
import { PageShareService, TPageSharedUser } from "@/plane-web/services/page/page-share.service";
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectPageService } from "@/services/page";
// store
import type { CoreRootStore } from "../root.store";
import { ProjectPage, TProjectPage } from "./project-page";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

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
  canCurrentUserCreatePage: boolean;
  currentContextPageIds: string[] | undefined;
  // helper actions
  getCurrentProjectPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentProjectPageIds: (projectId: string) => string[];
  getCurrentProjectFilteredPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TProjectPage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  findRootParent: (page: TProjectPage) => TProjectPage | undefined;
  clearRootParentCache: () => void;
  getParentPages: (pageId: string) => TPage[] | undefined;
  getOrderedParentPages: (pageId: string) => TPage[] | undefined;
  // actions
  fetchPagesList: (
    workspaceSlug: string,
    projectId: string,
    pageType?: TPageNavigationTabs
  ) => Promise<TPage[] | undefined>;
  fetchPagesByType: (pageType: string, searchQuery?: string) => Promise<TPage[] | undefined>;
  fetchParentPages: (pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    projectId: string,
    pageId: string,
    shouldFetchSubPages?: boolean | undefined
  ) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  movePage: (params: {
    workspaceSlug: string;
    newProjectId: string;
    pageId: string;
    projectId: string;
    shouldSync?: boolean;
  }) => Promise<void>;
  getOrFetchPageInstance: ({
    pageId,
    projectId,
  }: {
    pageId: string;
    projectId?: string;
  }) => Promise<TProjectPage | undefined>;
  removePageInstance: (pageId: string) => void;
  updatePagesInStore: (pages: TPage[]) => void;
  // page sharing actions
  fetchPageSharedUsers: (pageId: string) => Promise<void>;
  bulkUpdatePageSharedUsers: (pageId: string, sharedUsers: TPageSharedUser[]) => Promise<void>;
}

export class ProjectPageStore implements IProjectPageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TProjectPage> = {}; // pageId => Page
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
  private _parentPagesMap = observable.map<string, TPage[]>(new Map()); // pageId => parentPagesList
  // disposers for reactions
  private disposers: (() => void)[] = [];
  // service
  service: ProjectPageService;
  shareService: PageShareService;
  rootStore: CoreRootStore;

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
      isAnyPageAvailable: computed,
      canCurrentUserCreatePage: computed,
      currentContextPageIds: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      fetchPagesList: action,
      fetchPagesByType: action,
      fetchParentPages: action,
      fetchPageDetails: action,
      createPage: action,
      removePage: action,
      movePage: action,
      updatePagesInStore: action,
      // page sharing actions
      fetchPageSharedUsers: action,
      bulkUpdatePageSharedUsers: action,
    });
    this.rootStore = store;
    // service
    this.service = new ProjectPageService();
    this.shareService = new PageShareService();

    // Set up reactions to automatically update page type arrays
    this.setupReactions();

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
   * Set up MobX reactions to automatically update the page type arrays
   */
  private setupReactions() {
    // Update page arrays whenever data or project changes
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
          project_ids: page.project_ids,
        })),
        currentProject: this.store.router.projectId,
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
   * @description get the current project page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentProjectPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.project_ids?.includes(projectId));
    pagesByType = pagesByType.filter((p) => !p.parent_id);

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
   * @description get the current project page ids for the current context
   */
  get currentContextPageIds() {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    return this.getCurrentProjectPageIds(projectId);
  }

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
            set(this.data, [page.id], new ProjectPage(this.store, page));
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
    const { projectId } = this.store.router;
    if (!projectId) {
      // Clear arrays when no project is selected
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
    const projectPages = allPages.filter((page) => page.project_ids?.includes(projectId));

    // ---------- PUBLIC PAGES ----------
    // Unfiltered public pages (sorted alphabetically by name)
    const publicPages = projectPages.filter(
      (page) =>
        page.access === EPageAccess.PUBLIC &&
        !page.parent_id &&
        !page.archived_at &&
        !page.deleted_at &&
        !page.is_shared
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
    ) as unknown as TProjectPage[];
    const newFilteredPublicPageIds = sortedFilteredPublicPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- PRIVATE PAGES ----------
    // Unfiltered private pages (sorted by updated_at)
    const nonArchivedPages = projectPages.filter((page) => !page.archived_at && !page.deleted_at && !page.is_shared);
    const privateParentPages = nonArchivedPages.filter(
      (page) => page.access === EPageAccess.PRIVATE && !page.parent_id
    );
    const privateChildPages = nonArchivedPages.filter((page) => {
      if (page.parent_id === null || page.access !== EPageAccess.PRIVATE || !page.id) return false;
      const rootParent = this.findRootParent(page);
      return rootParent?.access !== EPageAccess.PRIVATE;
    });
    const combinedPrivatePages = [...privateParentPages, ...privateChildPages];
    const sortedPrivatePages = combinedPrivatePages.sort((a, b) =>
      getPageName(a.name).toLowerCase().localeCompare(getPageName(b.name).toLowerCase())
    );
    const newPrivatePageIds = sortedPrivatePages.map((page) => page.id).filter((id): id is string => id !== undefined);

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
    ) as unknown as TProjectPage[];
    const newFilteredPrivatePageIds = sortedFilteredPrivatePages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- ARCHIVED PAGES ----------
    // Unfiltered archived pages (sorted alphabetically by name)
    const archivedProjectPages = projectPages.filter((page) => page.archived_at && !page.deleted_at);
    const topLevelArchivedPages = archivedProjectPages.filter((page) => {
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
    ) as unknown as TProjectPage[];
    const newFilteredArchivedPageIds = sortedFilteredArchivedPages
      .map((page) => page.id)
      .filter((id): id is string => id !== undefined);

    // ---------- SHARED PAGES ----------
    // Shared pages come directly from API when fetched with type="shared"
    // Only show pages at first level that don't have a shared parent
    const sharedPages = projectPages.filter((page) => {
      if (!page.is_shared) return false;

      // If page has no parent, include it
      if (!page.parent_id) return true;

      // If page has a parent, check if parent is shared
      const parentPage = this.getPageById(page.parent_id);
      return !parentPage?.is_shared;
    });
    const sortedSharedPages = sharedPages.sort(
      (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
    );
    const newSharedPageIds = sortedSharedPages.map((page) => page.id).filter((id): id is string => id !== undefined);

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
    ) as unknown as TProjectPage[];
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
  fetchPagesList = async (workspaceSlug: string, projectId: string, pageType?: TPageNavigationTabs) => {
    try {
      if (!workspaceSlug || !projectId) return undefined;

      const currentPageIds = pageType ? this.getCurrentProjectPageIdsByTab(pageType) : undefined;
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.service.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
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

  fetchPagesByType = async (pageType: string, searchQuery?: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return undefined;

      const currentPageIds = this.getCurrentProjectPageIds(projectId);
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.service.fetchPagesByType(workspaceSlug, projectId, pageType, searchQuery);
      runInAction(() => {
        for (const page of pages) {
          if (page?.id) {
            const pageInstance = this.getPageById(page.id);
            if (pageInstance) {
              pageInstance.mutateProperties(page);
            } else {
              set(this.data, [page.id], new ProjectPage(this.store, page));
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
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !pageId) return undefined;
    const response = await this.service.fetchParentPages(workspaceSlug, projectId, pageId);

    // Store the parent pages data in the store
    runInAction(() => {
      for (const page of response) {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page);
          } else {
            set(this.data, [page.id], new ProjectPage(this.store, page));
          }
        }
      }
      // Cache the parent pages list
      this._parentPagesMap.set(pageId, response);
    });

    return response;
  };

  /**
   * @description fetch the details of a page
   * @param {string} pageId
   */
  fetchPageDetails = async (projectId: string, pageId: string, shouldFetchSubPages: boolean | undefined = true) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      const currentPageId = this.getPageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? "mutation-loader" : "init-loader";
        this.error = undefined;
      });

      const promises: Promise<any>[] = [this.service.fetchById(workspaceSlug, projectId, pageId)];

      if (shouldFetchSubPages) {
        promises.push(this.service.fetchSubPages(workspaceSlug, projectId, pageId));
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
            set(this.data, [pageId], new ProjectPage(this.store, page));
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
                set(this.data, [subPage.id], new ProjectPage(this.store, subPage));
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
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.service.create(workspaceSlug, projectId, pageData);

      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new ProjectPage(this.store, page));
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
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;
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
        await this.service.remove(workspaceSlug, projectId, pageId);
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
   * @description move a page to a new project
   * @param {string} workspaceSlug
   * @param {string} projectId
   * @param {string} pageId
   * @param {string} projectId
   */
  movePage = async ({
    workspaceSlug,
    pageId,
    newProjectId,
    projectId,
    shouldSync = true,
  }: {
    workspaceSlug: string;
    newProjectId: string;
    pageId: string;
    projectId: string;
    shouldSync?: boolean;
  }) => {
    try {
      if (shouldSync) {
        await this.service.move(workspaceSlug, projectId, pageId, newProjectId);
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

  getOrFetchPageInstance = async ({ pageId, projectId }: { pageId: string; projectId?: string }) => {
    const pageInstance = this.getPageById(pageId);
    if (pageInstance) {
      return pageInstance;
    } else {
      const { workspaceSlug, projectId: projectIdFromRouter } = this.store.router;

      const actualProjectId = projectId || projectIdFromRouter;

      // Additional type safety check
      if (!actualProjectId || !workspaceSlug) return;

      const page = await this.fetchPageDetails(actualProjectId, pageId);
      if (page) {
        return new ProjectPage(this.store, page);
      }
    }
  };

  removePageInstance = (pageId: string) => {
    delete this.data[pageId];
  };

  // Helper function to find the root parent of a page
  findRootParent = computedFn((page: TProjectPage): TProjectPage => {
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

  // page sharing actions
  fetchPageSharedUsers = async (pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !pageId) return;

      const sharedUsers = await this.shareService.getProjectPageSharedUsers(workspaceSlug, projectId, pageId);
      const finalUsers = sharedUsers.map((user) => ({
        user_id: user.user_id,
        access: user.access,
      }));

      runInAction(() => {
        const pageInstance = this.getPageById(pageId);
        if (pageInstance && finalUsers) {
          pageInstance.updateSharedUsers(finalUsers);
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
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !pageId) return;

      const pageInstance = this.getPageById(pageId);
      if (!pageInstance) return;

      // Optimistically update the state
      runInAction(() => {
        if (sharedUsers.length === 0) {
          pageInstance.is_shared = false;
        } else {
          pageInstance.is_shared = true;
        }
        pageInstance.updateSharedUsers(sharedUsers);
      });

      // Make API call
      await this.shareService.bulkUpdateProjectPageSharedUsers(workspaceSlug, projectId, pageId, sharedUsers);
    } catch (error) {
      runInAction(() => {
        // Revert to old shared users list on error
        const pageInstance = this.getPageById(pageId);
        if (pageInstance) {
          if (oldSharedUsers.length === 0) {
            pageInstance.is_shared = false;
          } else {
            pageInstance.is_shared = true;
          }
          pageInstance.updateSharedUsers(oldSharedUsers);
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
