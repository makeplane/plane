import set from "lodash/set";
import unset from "lodash/unset";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// helpers
import { filterPagesByPageType, orderPages, shouldFilterPage } from "@/helpers/page.helper";
// services
import { PageService } from "@/services/page.service";
import { IPageStore, PageStore } from "@/store/pages/page.store";
import { RootStore } from "../root.store";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export interface IProjectPageStore {
  // observables
  loader: TLoader;
  pageType: TPageNavigationTabs;
  data: Record<string, IPageStore>; // pageId => PageStore
  error: TError | undefined;
  filters: TPageFilters;
  // computed
  pageIds: string[] | undefined;
  filteredPageIds: string[] | undefined;
  // helper actions
  pageById: (pageId: string) => IPageStore | undefined;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  clearAllFilters: () => void;
  // actions
  getAllPages: (pageType: TPageNavigationTabs) => Promise<TPage[] | undefined>;
  getPageById: (pageId: string) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (pageId: string) => Promise<void>;
}

export class ProjectPageStore implements IProjectPageStore {
  // observables
  loader: TLoader = "init-loader";
  pageType: TPageNavigationTabs = "public";
  data: Record<string, IPageStore> = {}; // pageId => PageStore
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "name",
    sortBy: "asc",
  };
  // service
  service: PageService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      pageType: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      // computed
      pageIds: computed,
      filteredPageIds: computed,
      // helper actions
      updateFilters: action,
      clearAllFilters: action,
      // actions
      getAllPages: action,
      getPageById: action,
      createPage: action,
      removePage: action,
    });

    this.service = new PageService();
  }

  get pageIds() {
    const { projectId } = this.store.app.router;
    if (!projectId) return undefined;

    // helps to filter pages based on the pageType
    const pagesByType = filterPagesByPageType(this.pageType, Object.values(this?.data || {}));

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  get filteredPageIds() {
    const { projectId } = this.store.app.router;
    if (!projectId) return undefined;

    // helps to filter pages based on the pageType
    const pagesByType = filterPagesByPageType(this.pageType, Object.values(this?.data || {}));
    let filteredPages = pagesByType.filter(
      (p) =>
        p.name?.toLowerCase().includes(this.filters.searchQuery.toLowerCase()) &&
        shouldFilterPage(p, this.filters.filters)
    );
    filteredPages = orderPages(filteredPages, this.filters.sortKey, this.filters.sortBy);

    const pages = (filteredPages.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  pageById = computedFn((pageId: string) => {
    const { projectId } = this.store.app.router;
    if (!projectId) return undefined;

    return this.data?.[pageId] || undefined;
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
   * @description fetch all the pages based on the navigation tab
   * @param {TPageNavigationTabs} pageType
   */
  getAllPages = async (pageType: TPageNavigationTabs) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return undefined;

      const currentPageIds = this.pageIds;
      runInAction(() => {
        this.pageType = pageType;
        this.loader = currentPageIds && currentPageIds.length > 0 ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const pages = await this.service.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
        for (const page of pages) if (page?.id) set(this.data, [page.id], new PageStore(this.store, page));
        this.loader = undefined;
      });

      return pages;
    } catch {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the pages, Please try again later.",
        };
      });
    }
  };

  /**
   * @description fetch the details of a page
   * @param {string} pageId
   */
  getPageById = async (pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      const currentPageId = this.pageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const page = await this.service.fetchById(workspaceSlug, projectId, pageId);
      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new PageStore(this.store, page));
        this.loader = undefined;
      });

      return page;
    } catch {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the page, Please try again later.",
        };
      });
    }
  };

  /**
   * @description create a page
   * @param {Partial<TPage>} pageData
   */
  createPage = async (pageData: Partial<TPage>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.service.create(workspaceSlug, projectId, pageData);
      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new PageStore(this.store, page));
        this.loader = undefined;
      });

      return page;
    } catch {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to create a page, Please try again later.",
        };
      });
    }
  };

  /**
   * @description delete a page
   * @param {string} pageId
   */
  removePage = async (pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      await this.service.remove(workspaceSlug, projectId, pageId);
      runInAction(() => unset(this.data, [pageId]));
    } catch {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to delete a page, Please try again later.",
        };
      });
    }
  };
}
