/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { set } from "lodash-es";
import { makeObservable, observable, runInAction, action, computed, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { EPageAccess } from "@plane/types";
import type { TMovePagePayload, TPage, TPageFilters, TPageNavigationTabs, TPagesSummary } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// page filter storage helpers
import type { TPageFilterStorageKeys } from "@/store/pages/page-filter-storage.helpers";
import {
  restorePageFiltersFromStorage,
  setupPageFilterStorageReactions,
} from "@/store/pages/page-filter-storage.helpers";
// local storage keys
const WORKSPACE_PAGES_STORAGE_KEYS: TPageFilterStorageKeys = {
  sortKey: "workspace-pages-sort-key",
  sortBy: "workspace-pages-sort-by",
  filters: "workspace-pages-filters",
};
// plane web services
import { WorkspacePageService } from "@/services/page/workspace-page.service";
// services
import type { TPageSharedUser } from "@/services/page/page-share.service";
import { PageShareService } from "@/services/page/page-share.service";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
import { getLoadedSubtreePageIds } from "@/plane-web/store/pages/page-tree";
import type { TWorkspacePage } from "./workspace-page";
import { WorkspacePage } from "./workspace-page";
import { PiChatService } from "@/services/pi-chat.service";
import { createPageAiSummaryActions } from "@/store/pages/page-ai-summary.helpers";

type TLoader = "init-loader" | "mutation-loader" | undefined;
type TPaginationLoader = "pagination" | undefined;

type TError = { title: string; description: string };

// Pagination info for each page type
export type TPagePaginationInfo = {
  nextCursor: string | null;
  hasNextPage: boolean;
  totalResults: number;
};

export type TPageInternalUpdateSnapshot = {
  pageId: string;
  previousParentId: string | null;
  nextParentId: string | null;
  previousUpdatedAt: TWorkspacePage["updated_at"];
  previousValues: Partial<TPage>;
};

// Default pagination info
const DEFAULT_PAGINATION_INFO: TPagePaginationInfo = {
  nextCursor: null,
  hasNextPage: true,
  totalResults: 0,
};

// Per page count for pagination
const PAGES_PER_PAGE = 20;

export interface IWorkspacePageStore {
  // observables
  loader: TLoader;
  data: Record<string, TWorkspacePage>; // pageId => Page
  error: TError | undefined;
  filters: TPageFilters;
  pagesSummary: TPagesSummary | undefined;
  pageAiSummary: Map<string, { summary: string | undefined; updated_at: string }>;
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
  // pagination info per page type
  paginationInfo: Record<TPageNavigationTabs, TPagePaginationInfo>;
  paginationLoader: Record<TPageNavigationTabs, TPaginationLoader>;
  // computed
  isAnyPageAvailable: boolean;
  currentWorkspacePageIds: string[] | undefined;
  // helper actions
  getPageAiSummary: (pageId: string) => { summary: string | undefined; updated_at: string } | undefined;
  getCurrentWorkspacePageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentWorkspaceFilteredPageIdsByType: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TWorkspacePage | undefined;
  isNestedPagesEnabled: (workspaceSlug: string) => boolean;
  isCommentsEnabled: (workspaceSlug: string) => boolean;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  findRootParent: (page: TWorkspacePage) => TWorkspacePage | undefined;
  clearRootParentCache: () => void;
  getPaginationInfo: (pageType: TPageNavigationTabs) => TPagePaginationInfo;
  getPaginationLoader: (pageType: TPageNavigationTabs) => TPaginationLoader;
  // actions
  fetchPagesSummary: () => Promise<TPagesSummary | undefined>;
  fetchAllPages: () => Promise<TPage[] | undefined>;
  fetchPagesByType: (pageType: string, searchQuery?: string, cursor?: string) => Promise<TPage[] | undefined>;
  fetchParentPages: (pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    pageId: string,
    options?: {
      trackVisit?: boolean;
      shouldFetchParentPages?: boolean;
      shouldFetchSubPages?: boolean;
    }
  ) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  applyPageInternalUpdateLocally: (
    pageId: string,
    updatePayload: Partial<TPage>
  ) => TPageInternalUpdateSnapshot | undefined;
  rollbackPageInternalUpdateLocally: (snapshot: TPageInternalUpdateSnapshot) => void;
  persistPageInternalUpdate: (pageId: string, updatePayload: Partial<TPage>) => Promise<void>;
  movePageInternally: (pageId: string, updatePayload: Partial<TPage>) => Promise<void>;
  movePage: ({
    pageId,
    data,
    shouldSync,
  }: {
    pageId: string;
    data: TMovePagePayload;
    shouldSync?: boolean;
  }) => Promise<void>;
  getOrFetchPageInstance: ({
    pageId,
    trackVisit,
    shouldFetchParentPages,
    shouldFetchSubPages,
    refreshIfExists,
  }: {
    pageId: string;
    trackVisit?: boolean;
    shouldFetchParentPages?: boolean;
    shouldFetchSubPages?: boolean;
    refreshIfExists?: boolean;
  }) => Promise<TWorkspacePage | undefined>;
  removePageInstance: (pageId: string) => void;
  updatePagesInStore: (pages: TPage[]) => void;
  // page sharing actions
  fetchPageSharedUsers: (pageId: string) => Promise<void>;
  bulkUpdatePageSharedUsers: (pageId: string, sharedUsers: TPageSharedUser[]) => Promise<void>;
  generatePageAiSummary: (
    pageId: string,
    workspaceId: string,
    callbacks?: { onComplete?: () => void; onError?: (error: { code: string; message: string }) => void }
  ) => (() => void) | undefined;
  removePageAiSummary: (pageId: string) => void;
  fetchPageAiSummary: (pageId: string) => Promise<string | undefined>;
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
  pagesSummary: TPagesSummary | undefined = undefined;
  pageAiSummary: Map<string, { summary: string | undefined; updated_at: string }> = new Map();
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
  // pagination info per page type
  paginationInfo: Record<TPageNavigationTabs, TPagePaginationInfo> = {
    public: { ...DEFAULT_PAGINATION_INFO },
    private: { ...DEFAULT_PAGINATION_INFO },
    archived: { ...DEFAULT_PAGINATION_INFO },
    shared: { ...DEFAULT_PAGINATION_INFO },
  };
  paginationLoader: Record<TPageNavigationTabs, TPaginationLoader> = {
    public: undefined,
    private: undefined,
    archived: undefined,
    shared: undefined,
  };
  // private props
  private _parentPagesMap = observable.map<string, TPage[]>(new Map()); // pageId => parentPagesList
  private _rootParentMap: Map<string, string | null> = new Map(); // pageId => rootParentId
  private fetchParentPagesRequests: Map<string, Promise<TPage[] | undefined>> = new Map();
  // disposers for reactions
  private disposers: (() => void)[] = [];
  // services
  pageService: WorkspacePageService;
  pageShareService: PageShareService;
  piChatService: PiChatService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      pagesSummary: observable,
      pageAiSummary: observable,
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
      // pagination info
      paginationInfo: observable,
      paginationLoader: observable,
      // computed
      currentWorkspacePageIds: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      fetchPagesSummary: action,
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
    this.piChatService = new PiChatService();
    const pageAiSummaryActions = createPageAiSummaryActions({
      piChatService: this.piChatService,
      pageAiSummary: this.pageAiSummary,
      entityType: "wiki",
    });
    this.fetchPageAiSummary = pageAiSummaryActions.fetchPageAiSummary;
    this.generatePageAiSummary = pageAiSummaryActions.generatePageAiSummary;
    this.removePageAiSummary = pageAiSummaryActions.removePageAiSummary;
    // Set up reactions to automatically update page type arrays
    this.setupReactions();

    // restore sort filters from localStorage (one-time initialization)
    restorePageFiltersFromStorage(this.filters, WORKSPACE_PAGES_STORAGE_KEYS);

    // setup reactions to persist filters to localStorage
    const storageDisposers = setupPageFilterStorageReactions(this.filters, WORKSPACE_PAGES_STORAGE_KEYS);
    this.disposers.push(...storageDisposers);
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
        collectionPageIds: Array.from(this.store.collection.pageCollectionIdByPageId.keys()),
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

  getPageAiSummary = computedFn((pageId: string) => this.pageAiSummary.get(pageId));

  /**
   * @description check if any page is available
   */
  get isAnyPageAvailable() {
    if (this.loader) return true;

    if (this.pagesSummary) {
      const totalCount =
        this.pagesSummary.public_pages + this.pagesSummary.private_pages + this.pagesSummary.archived_pages;
      return totalCount > 0;
    }

    return false;
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

  private invalidateParentPagesCache = (pageIds: Iterable<string>) => {
    for (const pageId of pageIds) {
      this._parentPagesMap.delete(pageId);
      this.fetchParentPagesRequests.delete(pageId);
      this._rootParentMap.delete(pageId);
    }
  };

  private doesCachedParentPagesMatchHierarchy = (pageId: string, cachedParentPages: TPage[]) => {
    const page = this.getPageById(pageId);
    if (!page?.id) return false;

    const expectedPageIds = [...page.parentPageIds].reverse();
    expectedPageIds.push(page.id);

    if (cachedParentPages.length !== expectedPageIds.length) return false;

    return cachedParentPages.every((cachedPage, index) => cachedPage.id === expectedPageIds[index]);
  };

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
      // Mutate the existing filters object in-place so MobX reactions can track changes
      set(this.filters, [filterKey], filterValue);

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
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(WORKSPACE_PAGES_STORAGE_KEYS.filters);
      }
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
        !page.is_shared &&
        !(page.id && this.store.collection.pageCollectionIdByPageId.has(page.id))
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
      (page) =>
        page.access === EPageAccess.PRIVATE &&
        !page.parent_id &&
        !(page.id && this.store.collection.pageCollectionIdByPageId.has(page.id))
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
  fetchPagesSummary = async () => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return undefined;
    try {
      const pagesSummary = await this.pageService.fetchPagesSummary(workspaceSlug);
      runInAction(() => {
        this.pagesSummary = pagesSummary;
      });
      return pagesSummary;
    } catch (error) {
      console.error("Unable to fetch pages summary", error);
    }
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

    const cachedParentPages = this._parentPagesMap.get(pageId);
    if (cachedParentPages && this.doesCachedParentPagesMatchHierarchy(pageId, cachedParentPages)) {
      return cachedParentPages;
    }

    const inFlightRequest = this.fetchParentPagesRequests.get(pageId);
    if (inFlightRequest) return inFlightRequest;

    const request = (async () => {
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
        this._parentPagesMap.set(pageId, response);
      });

      return response;
    })();

    this.fetchParentPagesRequests.set(pageId, request);

    try {
      return await request;
    } finally {
      if (this.fetchParentPagesRequests.get(pageId) === request) {
        this.fetchParentPagesRequests.delete(pageId);
      }
    }
  };

  /**
   * @description fetch the details of a page
   */
  fetchPageDetails: IWorkspacePageStore["fetchPageDetails"] = async (pageId, options) => {
    const shouldFetchParentPages = options?.shouldFetchParentPages ?? true;
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

      if (shouldFetchParentPages) {
        promises.push(this.pageService.fetchParentPages(workspaceSlug, pageId));
      }

      if (shouldFetchSubPages) {
        promises.push(this.pageService.fetchSubPages(workspaceSlug, pageId));
      }

      const results = await Promise.all(promises);
      const page = results[0] as TPage;
      const parentPages = shouldFetchParentPages ? (results[1] as TPage[]) : (this._parentPagesMap.get(pageId) ?? []);
      const subPages = shouldFetchSubPages ? (results[shouldFetchParentPages ? 2 : 1] as TPage[]) : [];

      runInAction(() => {
        if (page) {
          const pageInstance = this.getPageById(pageId);
          if (pageInstance) {
            pageInstance.mutateProperties(page, false);
          } else {
            set(this.data, [pageId], new WorkspacePage(this.store, page));
          }
        }

        if (shouldFetchParentPages) {
          parentPages.forEach((parentPage) => {
            if (parentPage?.id) {
              const parentPageInstance = this.getPageById(parentPage.id);
              if (parentPageInstance) {
                parentPageInstance.mutateProperties(parentPage, false);
              } else {
                set(this.data, [parentPage.id], new WorkspacePage(this.store, parentPage));
              }
            }
          });
          this._parentPagesMap.set(pageId, parentPages);
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
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to fetch the page.");
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
    const snapshot = runInAction(() => this.applyPageInternalUpdateLocally(pageId, updatePayload));
    if (!snapshot) return;

    try {
      await this.persistPageInternalUpdate(pageId, updatePayload);
    } catch (error) {
      runInAction(() => {
        this.rollbackPageInternalUpdateLocally(snapshot);
      });

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

  applyPageInternalUpdateLocally = (pageId: string, updatePayload: Partial<TPage>) => {
    const pageInstance = this.getPageById(pageId);
    if (!pageInstance) return undefined;

    const previousParentId = pageInstance.parent_id ?? null;
    const nextParentId = Object.prototype.hasOwnProperty.call(updatePayload, "parent_id")
      ? (updatePayload.parent_id ?? null)
      : previousParentId;
    const previousUpdatedAt = pageInstance.updated_at;
    const previousValues = Object.keys(updatePayload).reduce<Partial<TPage>>((acc, key) => {
      const currentPageKey = key as keyof TPage;
      acc[currentPageKey] = pageInstance[currentPageKey] as never;
      return acc;
    }, {});
    const snapshot: TPageInternalUpdateSnapshot = {
      pageId,
      previousParentId,
      nextParentId,
      previousUpdatedAt,
      previousValues,
    };

    if (Object.prototype.hasOwnProperty.call(updatePayload, "parent_id") && nextParentId !== previousParentId) {
      this.invalidateParentPagesCache(getLoadedSubtreePageIds(pageId, this.getPageById));
      this.clearRootParentCache();
      this.updateParentSubPageCounts(previousParentId, nextParentId);
    }

    Object.keys(updatePayload).forEach((key) => {
      const currentPageKey = key as keyof TPage;
      set(pageInstance, currentPageKey, updatePayload[currentPageKey] ?? undefined);
    });

    pageInstance.updated_at = new Date();

    return snapshot;
  };

  rollbackPageInternalUpdateLocally = (snapshot: TPageInternalUpdateSnapshot) => {
    const pageInstance = this.getPageById(snapshot.pageId);
    if (!pageInstance) return;

    if (
      Object.prototype.hasOwnProperty.call(snapshot.previousValues, "parent_id") &&
      snapshot.nextParentId !== snapshot.previousParentId
    ) {
      this.invalidateParentPagesCache(getLoadedSubtreePageIds(snapshot.pageId, this.getPageById));
      this.clearRootParentCache();
      this.updateParentSubPageCounts(snapshot.nextParentId, snapshot.previousParentId);
    }

    Object.keys(snapshot.previousValues).forEach((key) => {
      const currentPageKey = key as keyof TPage;
      set(pageInstance, currentPageKey, snapshot.previousValues[currentPageKey] ?? undefined);
    });

    pageInstance.updated_at = snapshot.previousUpdatedAt;
  };

  persistPageInternalUpdate = async (pageId: string, updatePayload: Partial<TPage>) => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    const pageInstance = this.getPageById(pageId);
    if (!pageInstance) return;

    const updatedPage = await this.pageService.update(workspaceSlug, pageId, updatePayload);

    if (updatedPage) {
      pageInstance.mutateProperties(updatedPage, false);
    }
  };

  /**
   * @description move a page to a project/teamspace
   */
  movePage: IWorkspacePageStore["movePage"] = async ({ pageId, data, shouldSync = true }) => {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return;

    try {
      if (shouldSync) {
        await this.pageService.move(workspaceSlug, pageId, data);
      }
    } catch (error) {
      console.error("Unable to move page", error);
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to move the page. Please try again later.",
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

  getOrFetchPageInstance = async ({
    pageId,
    trackVisit,
    shouldFetchParentPages = true,
    shouldFetchSubPages = true,
    refreshIfExists = false,
  }: {
    pageId: string;
    trackVisit?: boolean;
    shouldFetchParentPages?: boolean;
    shouldFetchSubPages?: boolean;
    refreshIfExists?: boolean;
  }) => {
    const pageInstance = this.getPageById(pageId);
    if (pageInstance && !refreshIfExists) {
      return pageInstance;
    }

    const page = await this.fetchPageDetails(pageId, { trackVisit, shouldFetchParentPages, shouldFetchSubPages });
    return page?.id ? this.getPageById(page.id) : undefined;
  };

  removePageInstance = (pageId: string) => {
    this.invalidateParentPagesCache([pageId]);
    delete this.data[pageId];
  };

  /**
   * @description fetch pages by type with pagination support
   * @param {string} pageType - The type of pages to fetch
   * @param {string} [searchQuery] - Optional search query
   * @param {string} [cursor] - Optional cursor for pagination. If not provided, fetches first page
   * @returns {Promise<TPage[] | undefined>} Array of pages or undefined
   */
  fetchPagesByType = async (pageType: string, searchQuery?: string, cursor?: string) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return undefined;

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
        if (this.paginationLoader[pageNavigationTab] === "pagination") {
          return undefined;
        }
      }

      // Set appropriate loader based on whether it's first page or next page
      runInAction(() => {
        if (isFirstPage) {
          const currentPageIds = this.currentWorkspacePageIds;
          this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
          // Reset pagination info when fetching first page
          this.paginationInfo[pageNavigationTab] = { ...DEFAULT_PAGINATION_INFO };
        } else {
          this.paginationLoader[pageNavigationTab] = "pagination";
        }
        this.error = undefined;
      });

      // Determine cursor to use
      const cursorToUse = isFirstPage ? undefined : (this.paginationInfo[pageNavigationTab].nextCursor ?? undefined);

      if (pageNavigationTab === "archived" && isFirstPage && this.archivedPageIds.length === 0) {
        await this.fetchAllPages();
      }

      const response = await this.pageService.fetchPagesByType(
        workspaceSlug,
        pageType,
        searchQuery,
        cursorToUse,
        PAGES_PER_PAGE
      );

      const pages = response.results || [];
      runInAction(() => {
        // Update pages in store
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

        // Update pagination info
        this.paginationInfo[pageNavigationTab] = {
          nextCursor: response.next_cursor || null,
          hasNextPage: response.next_page_results ?? false,
          totalResults: response.total_results ?? 0,
        };

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

  fetchPageAiSummary!: (pageId: string) => Promise<string | undefined>;
  generatePageAiSummary!: (
    pageId: string,
    workspaceId: string,
    callbacks?: { onComplete?: () => void; onError?: (error: { code: string; message: string }) => void }
  ) => (() => void) | undefined;
  removePageAiSummary!: (pageId: string) => void;

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
