/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { unset, set } from "lodash-es";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { EUserPermissions } from "@plane/constants";
import type { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, getPageName, orderPages, shouldFilterPage } from "@plane/utils";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { WorkspacePageService } from "@/services/page";
// store
import type { CoreRootStore } from "../root.store";
import type { TWorkspacePage } from "./workspace-page";
import { WorkspacePage } from "./workspace-page";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

// Workspace (wiki) pages are visible/creatable to workspace members and admins; guests are excluded server-side.
export const ROLE_PERMISSIONS_TO_CREATE_WORKSPACE_PAGE = [EUserPermissions.ADMIN, EUserPermissions.MEMBER];

/**
 * Store contract for workspace-level (wiki) pages.
 *
 * The method names/signatures mirror {@link IProjectPageStore} so the shared page
 * components (`PagesListView`, `PagesListRoot`, `PageListBlock`, …) can consume either
 * store interchangeably via `usePageStore(storeType)`. The `projectId` parameters are
 * accepted for signature-compatibility and ignored — wiki pages have no project scope.
 */
export interface IWorkspacePageStore {
  // observables
  loader: TLoader;
  data: Record<string, TWorkspacePage>; // pageId => Page
  subPageIds: Record<string, string[]>; // parent pageId => sub-page ids
  error: TError | undefined;
  filters: TPageFilters;
  // computed
  isAnyPageAvailable: boolean;
  canCurrentUserCreatePage: boolean;
  // helper actions
  getCurrentProjectPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getCurrentProjectPageIds: (projectId: string) => string[];
  getCurrentProjectFilteredPageIdsByTab: (pageType: TPageNavigationTabs) => string[] | undefined;
  getPageById: (pageId: string) => TWorkspacePage | undefined;
  getSubPageIds: (pageId: string) => string[] | undefined;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  // actions
  fetchPagesList: (
    workspaceSlug: string,
    projectId?: string,
    pageType?: TPageNavigationTabs
  ) => Promise<TPage[] | undefined>;
  fetchSubPages: (workspaceSlug: string, projectId: string, pageId: string) => Promise<TPage[] | undefined>;
  fetchPageDetails: (
    workspaceSlug: string,
    projectId: string | undefined,
    pageId: string,
    options?: { trackVisit?: boolean }
  ) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (params: { pageId: string; shouldSync?: boolean }) => Promise<void>;
  movePage: (workspaceSlug: string, projectId: string, pageId: string, newProjectId: string) => Promise<void>;
}

export class WorkspacePageStore implements IWorkspacePageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TWorkspacePage> = {}; // pageId => Page
  subPageIds: Record<string, string[]> = {}; // parent pageId => sub-page ids
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "updated_at",
    sortBy: "desc",
  };
  // service
  service: WorkspacePageService;
  rootStore: CoreRootStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      subPageIds: observable,
      error: observable,
      filters: observable,
      // computed
      isAnyPageAvailable: computed,
      canCurrentUserCreatePage: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      fetchPagesList: action,
      fetchSubPages: action,
      fetchPageDetails: action,
      createPage: action,
      removePage: action,
      movePage: action,
    });
    this.rootStore = store;
    // service
    this.service = new WorkspacePageService();
  }

  /**
   * @description check if any page is available
   */
  get isAnyPageAvailable() {
    if (this.loader) return true;
    return Object.keys(this.data).length > 0;
  }

  /**
   * @description returns true if the current logged in user can create a workspace page
   */
  get canCurrentUserCreatePage() {
    const { workspaceSlug } = this.store.router;
    const currentUserWorkspaceRole = workspaceSlug
      ? this.store.user.permission.getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString())
      : undefined;
    return (
      !!currentUserWorkspaceRole &&
      ROLE_PERMISSIONS_TO_CREATE_WORKSPACE_PAGE.includes(currentUserWorkspaceRole as EUserPermissions)
    );
  }

  /**
   * @description get the workspace page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentProjectPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    // A page is a root of the current tab when it has no parent, or when its
    // parent is not part of this tab (e.g. an archived sub-page whose parent is
    // still active must surface at the archived tab root rather than disappear).
    const idsInType = new Set(pagesByType.map((p) => p.id));
    pagesByType = pagesByType.filter((p) => !p.parent || !idsInType.has(p.parent));

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  });

  /**
   * @description get all workspace page ids
   */
  getCurrentProjectPageIds = computedFn(() => {
    const pages = Object.values(this?.data || {});
    return pages.map((page) => page.id) as string[];
  });

  /**
   * @description get the filtered workspace page ids based on the pageType
   * @param {TPageNavigationTabs} pageType
   */
  getCurrentProjectFilteredPageIdsByTab = computedFn((pageType: TPageNavigationTabs) => {
    // helps to filter pages based on the pageType
    const pagesByType = filterPagesByPageType(pageType, Object.values(this?.data || {}));
    // Treat a page as a tab root when it has no parent, or when its parent is
    // not part of this tab (keeps archived sub-pages of active parents reachable).
    const idsInType = new Set(pagesByType.map((p) => p.id));
    let filteredPages = pagesByType.filter(
      (p) =>
        (!p.parent || !idsInType.has(p.parent)) &&
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
   * @description get the sub-page ids of a page, undefined if not fetched yet
   * @param {string} pageId
   */
  getSubPageIds = computedFn((pageId: string) => this.subPageIds?.[pageId] || undefined);

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
   * @description fetch all the workspace pages
   */
  fetchPagesList = async (workspaceSlug: string, _projectId?: string, pageType?: TPageNavigationTabs) => {
    try {
      if (!workspaceSlug) return undefined;

      const currentPageIds = pageType ? this.getCurrentProjectPageIdsByTab(pageType) : undefined;
      runInAction(() => {
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.service.fetchAll(workspaceSlug);
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

  /**
   * @description fetch the direct sub-pages of a page
   * @param {string} pageId
   */
  fetchSubPages = async (workspaceSlug: string, _projectId: string, pageId: string) => {
    try {
      if (!workspaceSlug || !pageId) return undefined;

      const pages = await this.service.fetchSubPages(workspaceSlug, pageId);
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
              set(this.data, [page.id], new WorkspacePage(this.store, page));
            }
          }
        }
        set(
          this.subPageIds,
          [pageId],
          pages.filter((page) => !!page.id).map((page) => page.id as string)
        );
      });

      return pages;
    } catch (error) {
      runInAction(() => {
        this.error = {
          title: "Failed",
          description: "Failed to fetch the sub-pages, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description fetch the details of a page
   * @param {string} pageId
   */
  fetchPageDetails = async (...args: Parameters<IWorkspacePageStore["fetchPageDetails"]>) => {
    const [workspaceSlug, _projectId, pageId, options] = args;
    const { trackVisit } = options || {};
    try {
      if (!workspaceSlug || !pageId) return undefined;

      const currentPageId = this.getPageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const page = await this.service.fetchById(workspaceSlug, pageId, trackVisit ?? true);

      runInAction(() => {
        if (page?.id) {
          const pageInstance = this.getPageById(page.id);
          if (pageInstance) {
            pageInstance.mutateProperties(page, false);
          } else {
            set(this.data, [page.id], new WorkspacePage(this.store, page));
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
   * @description create a workspace page
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

      const page = await this.service.create(workspaceSlug, pageData);
      runInAction(() => {
        if (page?.id) {
          set(this.data, [page.id], new WorkspacePage(this.store, page));
          // register the page in the sub-pages map of its parent, if already fetched
          if (page.parent && this.subPageIds[page.parent] && !this.subPageIds[page.parent].includes(page.id)) {
            set(this.subPageIds, [page.parent], [...this.subPageIds[page.parent], page.id]);
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
  removePage = async ({ pageId, shouldSync: _shouldSync = true }: { pageId: string; shouldSync?: boolean }) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;

      await this.service.remove(workspaceSlug, pageId);
      runInAction(() => {
        const parentId = this.data[pageId]?.parent;
        unset(this.data, [pageId]);
        if (parentId && this.subPageIds[parentId]) {
          set(
            this.subPageIds,
            [parentId],
            this.subPageIds[parentId].filter((id) => id !== pageId)
          );
        }
        unset(this.subPageIds, [pageId]);
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
   * @description moving a wiki page between containers is not supported in CE — kept for signature parity.
   */
  movePage = async () => {
    throw new Error("Moving workspace pages is not supported.");
  };
}
