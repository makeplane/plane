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
import { TPage, TPageFilters } from "@plane/types";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export interface IProjectPageStore {
  // observables
  loader: TLoader;
  data: Record<string, Record<string, IPageStore>>; // projectId => pageId => PageStore
  error: TError | undefined;
  filters: TPageFilters;
  // computed
  pageIds: string[] | undefined;
  // helper actions
  pageById: (pageId: string) => IPageStore | undefined;
  updateFilters: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  // actions
  fetch: (_loader?: TLoader) => Promise<TPage[] | undefined>;
  fetchById: (pageId: string) => Promise<TPage | undefined>;
  create: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  delete: (pageId: string) => Promise<void>;
}

export class ProjectPageStore implements IProjectPageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, Record<string, IPageStore>> = {}; // projectId => pageId => PageStore
  error: TError | undefined = undefined;
  filters: TPageFilters = {
    search: "",
    sortKey: "name",
    sortBy: "asc",
  };
  // service
  service: PageService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      filters: observable,
      // computed
      pageIds: computed,
      // helper actions
      updateFilters: action,
      // actions
      fetch: action,
      fetchById: action,
      create: action,
      delete: action,
    });

    this.service = new PageService();
  }

  get pageIds() {
    const { projectId } = this.store.app.router;
    if (!projectId) return undefined;

    // TODO: filter the pages based on the filter

    const pages = Object.keys(this.data?.[projectId]) || undefined;
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
  fetch = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return undefined;

      const currentPageIds = this.pageIds;
      runInAction(() => {
        this.loader = currentPageIds ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const _pages = await this.service.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
        for (const page of _pages) if (page?.id) set(this.data, [projectId, page.id], new PageStore(this.store, page));
        this.loader = undefined;
      });

      return _pages;
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

  fetchById = async (pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId || !pageId) return undefined;

      const currentPageId = this.pageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const _page = await this.service.fetchById(workspaceSlug, projectId, pageId);
      runInAction(() => {
        if (_page?.id) set(this.data, [projectId, _page.id], new PageStore(this.store, _page));
        this.loader = undefined;
      });

      return _page;
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

  create = async (pageData: Partial<TPage>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = `init-loader`;
        this.error = undefined;
      });

      const _page = await this.service.create(workspaceSlug, projectId, pageData);
      runInAction(() => {
        if (_page?.id) set(this.data, [projectId, _page.id], new PageStore(this.store, _page));
        this.loader = undefined;
      });

      return _page;
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

  delete = async (pageId: string) => {
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
