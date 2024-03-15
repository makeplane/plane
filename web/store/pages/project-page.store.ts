import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import unset from "lodash/unset";
// store
import { RootStore } from "../root.store";
import { IPageStore, PageStore } from "store/pages/page.store";
// services
import { PageService } from "services/page.service";
// types
import { TPage, TPageFilters, TPageNavigationTabs } from "@plane/types";
// page helper class
import { PageHelpers } from "./helpers";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export interface IProjectPageStore {
  // observables
  loader: TLoader;
  pageType: TPageNavigationTabs;
  data: Record<string, Record<string, IPageStore>>; // projectId => pageId => PageStore
  error: TError | undefined;
  filters: TPageFilters;
  // computed
  pageIds: string[] | undefined;
  // helper actions
  pageById: (pageId: string) => IPageStore | undefined;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  // actions
  getAllPages: (pageType?: TPageNavigationTabs) => Promise<TPage[] | undefined>;
  getPageById: (pageId: string) => Promise<TPage | undefined>;
  createPage: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  removePage: (pageId: string) => Promise<void>;
}

export class ProjectPageStore extends PageHelpers implements IProjectPageStore {
  // observables
  loader: TLoader = "init-loader";
  pageType: TPageNavigationTabs = "public";
  data: Record<string, Record<string, IPageStore>> = {}; // projectId => pageId => PageStore
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    searchQuery: "",
    sortKey: "name",
    sortBy: "asc",
  };
  // service
  service: PageService;

  constructor(private store: RootStore) {
    super();

    makeObservable(this, {
      // observables
      loader: observable.ref,
      pageType: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      // computed
      pageIds: computed,
      // helper actions
      updateFilters: action,
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
    const filtersPages = this.filterPagesByPages(this.pageType, Object.values(this?.data?.[projectId] || {}));

    // TODO: apply user filters

    const pages = (filtersPages.map((page) => page.id) as string[]) || undefined;
    if (!pages) return undefined;

    return pages;
  }

  // helper actions
  pageById = computedFn((pageId: string) => {
    const { projectId } = this.store.app.router;
    if (!projectId) return undefined;

    return this.data?.[projectId]?.[pageId] || undefined;
  });

  updateFilters = <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => {
    runInAction(() => {
      set(this.filters, [filterKey], filterValue);
    });
  };

  // actions
  getAllPages = async (pageType: TPageNavigationTabs = "public") => {
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
        for (const page of pages) if (page?.id) set(this.data, [projectId, page.id], new PageStore(this.store, page));
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
        if (page?.id) set(this.data, [projectId, page.id], new PageStore(this.store, page));
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

  createPage = async (pageData: Partial<TPage>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = `init-loader`;
        this.error = undefined;
      });

      const page = await this.service.create(workspaceSlug, projectId, pageData);
      runInAction(() => {
        if (page?.id) set(this.data, [projectId, page.id], new PageStore(this.store, page));
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

  removePage = async (pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      await this.service.remove(workspaceSlug, projectId, pageId);
      runInAction(() => unset(this.data, [projectId, pageId]));
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
