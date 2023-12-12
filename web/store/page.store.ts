import { action, computed, makeObservable, observable, runInAction } from "mobx";
import keyBy from "lodash/keyBy";
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

  projectPages: IPage[] | undefined;
  favoriteProjectPages: IPage[] | undefined;
  privateProjectPages: IPage[] | undefined;
  sharedProjectPages: IPage[] | undefined;

  fetchProjectPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
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
      pages: observable.ref,
      archivedPages: observable.ref,
      // computed
      projectPages: computed,
      favoriteProjectPages: computed,
      sharedProjectPages: computed,
      privateProjectPages: computed,
      // actions
      fetchProjectPages: action,
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
  get sharedProjectPages() {
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
}
