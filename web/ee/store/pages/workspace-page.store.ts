import set from "lodash/set";
import unset from "lodash/unset";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TPageNavigationTabs } from "@plane/types";
// plane web services
import { WorkspacePageService } from "@/plane-web/services/workspace-page.service";
// plane web store
import { IWorkspacePageDetails, WorkspacePageDetails } from "@/plane-web/store/pages/page";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TWorkspacePage } from "@/plane-web/types";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export const filterPagesByPageType = (pageType: TPageNavigationTabs, pages: TWorkspacePage[]): TWorkspacePage[] =>
  pages.filter((page) => {
    if (pageType === "public") return page.access === 0 && !page.archived_at;
    if (pageType === "private") return page.access === 1 && !page.archived_at;
    if (pageType === "archived") return page.archived_at;
    return true;
  });

export interface IWorkspacePageStore {
  // observables
  loader: TLoader;
  data: Record<string, IWorkspacePageDetails>; // pageId => PageStore
  error: TError | undefined;
  // computed
  isAnyPageAvailable: boolean;
  currentWorkspacePageIds: string[] | undefined;
  currentWorkspacePublicPageIds: string[] | undefined;
  currentWorkspacePrivatePageIds: string[] | undefined;
  currentWorkspaceArchivePageIds: string[] | undefined;
  // helper actions
  getPageById: (pageId: string) => IWorkspacePageDetails | undefined;
  // actions
  fetchAllPages: () => Promise<TWorkspacePage[] | undefined>;
  fetchPageById: (pageId: string) => Promise<TWorkspacePage | undefined>;
  createPage: (pageData: Partial<TWorkspacePage>) => Promise<TWorkspacePage | undefined>;
  deletePage: (pageId: string) => Promise<void>;
}

export class WorkspacePageStore implements IWorkspacePageStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, IWorkspacePageDetails> = {}; // pageId => PageStore
  error: TError | undefined = undefined;
  // services
  pageService: WorkspacePageService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      // computed
      currentWorkspacePageIds: computed,
      currentWorkspacePublicPageIds: computed,
      currentWorkspacePrivatePageIds: computed,
      currentWorkspaceArchivePageIds: computed,
      // actions
      fetchAllPages: action,
      fetchPageById: action,
      createPage: action,
      deletePage: action,
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
   * @description get the current workspace page ids based on the pageType
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
   * @description get the current workspace public page ids based on the pageType
   */
  get currentWorkspacePublicPageIds() {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType("public", Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.workspace === currentWorkspace.id);

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  /**
   * @description get the current workspace private page ids based on the pageType
   */
  get currentWorkspacePrivatePageIds() {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType("private", Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.workspace === currentWorkspace.id);

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  /**
   * @description get the current workspace public page ids based on the pageType
   */
  get currentWorkspaceArchivePageIds() {
    const { currentWorkspace } = this.store.workspaceRoot;
    if (!currentWorkspace) return undefined;
    // helps to filter pages based on the pageType
    let pagesByType = filterPagesByPageType("archived", Object.values(this?.data || {}));
    pagesByType = pagesByType.filter((p) => p.workspace === currentWorkspace.id);

    const pages = (pagesByType.map((page) => page.id) as string[]) || undefined;

    return pages ?? undefined;
  }

  /**
   * @description get the page store by id
   * @param {string} pageId
   */
  getPageById = computedFn((pageId: string) => this.data?.[pageId] || undefined);

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
        for (const page of pages) if (page?.id) set(this.data, [page.id], new WorkspacePageDetails(this.store, page));
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
   * @description fetch the details of a page
   * @param {string} pageId
   */
  fetchPageById = async (pageId: string) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;

      const currentPageId = this.getPageById(pageId);
      runInAction(() => {
        this.loader = currentPageId ? `mutation-loader` : `init-loader`;
        this.error = undefined;
      });

      const page = await this.pageService.fetchById(workspaceSlug, pageId);
      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new WorkspacePageDetails(this.store, page));
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
  createPage = async (pageData: Partial<TWorkspacePage>) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const page = await this.pageService.create(workspaceSlug, pageData);
      runInAction(() => {
        if (page?.id) set(this.data, [page.id], new WorkspacePageDetails(this.store, page));
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
  deletePage = async (pageId: string) => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug || !pageId) return undefined;

      await this.pageService.remove(workspaceSlug, pageId);
      runInAction(() => unset(this.data, [pageId]));
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
}
