import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
import set from "lodash/set";
import omit from "lodash/omit";
import isToday from "date-fns/isToday";
import isThisWeek from "date-fns/isThisWeek";
import isYesterday from "date-fns/isYesterday";
// services
import { PageService } from "services/page.service";
// types
import { IPage, IRecentPages } from "types";
// store
import { RootStore } from "./root.store";

export interface IPageStore {
  pages: Record<string, IPage>;
  archivedPages: Record<string, IPage>;
  // project computed
  projectPages: IPage[] | undefined;
  favoriteProjectPages: IPage[] | undefined;
  privateProjectPages: IPage[] | undefined;
  sharedProjectPages: IPage[] | undefined;
  recentProjectPages: IRecentPages | undefined;
  // archived pages computed
  archivedProjectPages: IPage[] | undefined;
  // fetch actions
  fetchProjectPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  fetchArchivedProjectPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  // favorites actions
  addToFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  removeFromFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // crud
  createPage: (workspaceSlug: string, projectId: string, data: Partial<IPage>) => Promise<void>;
  updatePage: (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) => Promise<void>;
  deletePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // access control actions
  makePublic: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  makePrivate: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // archive actions
  archivePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  restorePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
}

export class PageStore {
  pages: Record<string, IPage> = {};
  archivedPages: Record<string, IPage> = {};
  // services
  pageService;
  // stores
  router;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      pages: observable,
      archivedPages: observable,
      // project computed
      projectPages: computed,
      favoriteProjectPages: computed,
      publicProjectPages: computed,
      privateProjectPages: computed,
      // archived pages in current project computed
      archivedProjectPages: computed,
      // fetch actions
      fetchProjectPages: action,
      fetchArchivedProjectPages: action,
      // favorites actions
      addToFavorites: action,
      removeFromFavorites: action,
      // crud
      createPage: action,
      updatePage: action,
      deletePage: action,
      // access control actions
      makePublic: action,
      makePrivate: action,
      // archive actions
      archivePage: action,
      restorePage: action,
    });
    // stores
    this.router = _rootStore.app.router;
    // services
    this.pageService = new PageService();
  }

  /**
   * retrieves all pages for a projectId that is available in the url.
   */
  get projectPages() {
    if (!this.router.projectId) return;
    return Object.values(this.pages).filter((page) => page.project === this.router.query.projectId);
  }

  /**
   * retrieves all favorite pages for a projectId that is available in the url.
   */
  get favoriteProjectPages() {
    if (!this.projectPages) return;
    return this.projectPages.filter((page) => page.is_favorite);
  }

  /**
   * retrieves all private pages for a projectId that is available in the url.
   */
  get privateProjectPages() {
    if (!this.projectPages) return;
    return this.projectPages.filter((page) => page.access === 1);
  }

  /**
   * retrieves all shared pages which are public to everyone in the project for a projectId that is available in the url.
   */
  get publicProjectPages() {
    if (!this.projectPages) return;
    return this.projectPages.filter((page) => page.access === 0);
  }

  /**
   * retrieves all recent pages for a projectId that is available in the url.
   * In format where today, yesterday, this_week, older are keys.
   */
  get recentProjectPages() {
    if (!this.projectPages) return;
    const data: IRecentPages = { today: [], yesterday: [], this_week: [], older: [] };
    data.today = this.projectPages.filter((p) => isToday(new Date(p.created_at))) || [];
    data.yesterday = this.projectPages.filter((p) => isYesterday(new Date(p.created_at))) || [];
    data.this_week =
      this.projectPages.filter(
        (p) =>
          isThisWeek(new Date(p.created_at)) && !isToday(new Date(p.created_at)) && !isYesterday(new Date(p.created_at))
      ) || [];
    data.older =
      this.projectPages.filter((p) => !isThisWeek(new Date(p.created_at)) && !isYesterday(new Date(p.created_at))) ||
      [];
    return data;
  }

  /**
   * retrieves all archived pages for a projectId that is available in the url.
   */
  get archivedProjectPages() {
    if (!this.router.projectId) return;
    return Object.values(this.archivedPages).filter((page) => page.project === this.router.projectId);
  }

  /**
   * fetches all pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  async fetchProjectPages(workspaceSlug: string, projectId: string) {
    const response = await this.pageService.getProjectPages(workspaceSlug, projectId);
    runInAction(() => {
      this.pages = {
        ...this.pages,
        ...keyBy(response, "id"),
      };
    });
    return response;
  }

  /**
   * fetches all archived pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  async fetchArchivedProjectPages(workspaceSlug: string, projectId: string) {
    const response = await this.pageService.getArchivedPages(workspaceSlug, projectId);
    runInAction(() => {
      this.archivedPages = {
        ...this.archivedPages,
        ...keyBy(response, "id"),
      };
    });
    return response;
  }

  /**
   * Add Page to users favorites list
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  addToFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [pageId]: { ...this.pages[pageId], is_favorite: true },
        };
      });
      await this.pageService.addPageToFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [pageId]: { ...this.pages[pageId], is_favorite: false },
        };
      });
      throw error;
    }
  };

  /**
   * Remove page from the users favorites list
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  removeFromFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [pageId]: { ...this.pages[pageId], is_favorite: false },
        };
      });
      await this.pageService.removePageFromFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [pageId]: { ...this.pages[pageId], is_favorite: true },
        };
      });
      throw error;
    }
  };

  /**
   * Creates a new page using the api and updated the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createPage = async (workspaceSlug: string, projectId: string, data: Partial<IPage>) => {
    const response = await this.pageService.createPage(workspaceSlug, projectId, data);
    runInAction(() => {
      this.pages = set(this.pages, [response.id], response);
    });
  };

  /**
   * updates the page using the api and updates the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @param data
   * @returns
   */
  updatePage = async (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) => {
    const originalPage = this.pages[pageId];
    try {
      runInAction(() => {
        this.pages[pageId] = { ...originalPage, ...data };
      });
      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        this.pages[pageId] = originalPage;
      });
      throw error;
    }
  };

  /**
   * delete a page using the api and updates the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  deletePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      const response = await this.pageService.deletePage(workspaceSlug, projectId, pageId);
      runInAction(() => {
        this.archivedPages = set(this.archivedPages, [pageId], this.pages[pageId]);
        delete this.pages[pageId];
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * make a page public
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  makePublic = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages[pageId] = { ...this.pages[pageId], access: 0 };
      });
      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 0 });
      return response;
    } catch (error) {
      runInAction(() => {
        this.pages[pageId] = { ...this.pages[pageId], access: 1 };
      });
      throw error;
    }
  };

  /**
   * Make a page private
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  makePrivate = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages[pageId] = { ...this.pages[pageId], access: 1 };
      });
      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 1 });
      return response;
    } catch (error) {
      runInAction(() => {
        this.pages[pageId] = { ...this.pages[pageId], access: 0 };
      });
      throw error;
    }
  };

  /**
   * Mark a page archived
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  archivePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    await this.pageService.archivePage(workspaceSlug, projectId, pageId);
    runInAction(() => {
      this.archivedPages[pageId] = this.pages[pageId];
      this.pages = omit(this.pages, [pageId]);
    });
  };

  /**
   * Restore a page from archived pages to pages
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  restorePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    await this.pageService.restorePage(workspaceSlug, projectId, pageId);
    runInAction(() => {
      this.pages[pageId] = this.archivedPages[pageId];
      this.archivedPages = omit(this.archivedPages, [pageId]);
    });
  };
}
