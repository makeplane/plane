import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import omit from "lodash/omit";
import isToday from "date-fns/isToday";
import isThisWeek from "date-fns/isThisWeek";
import isYesterday from "date-fns/isYesterday";
// services
import { PageService } from "services/page.service";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { IPage, IRecentPages } from "@plane/types";
// store
import { RootStore } from "./root.store";

export interface IPageStore {
  pages: Record<string, IPage>;
  archivedPages: Record<string, IPage>;
  // project computed
  projectPageIds: string[] | null;
  favoriteProjectPageIds: string[] | null;
  privateProjectPageIds: string[] | null;
  publicProjectPageIds: string[] | null;
  archivedProjectPageIds: string[] | null;
  recentProjectPages: IRecentPages | null;
  // fetch page information actions
  getUnArchivedPageById: (pageId: string) => IPage | null;
  getArchivedPageById: (pageId: string) => IPage | null;
  // fetch actions
  fetchProjectPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  fetchArchivedProjectPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  // favorites actions
  addToFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  removeFromFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // crud
  createPage: (workspaceSlug: string, projectId: string, data: Partial<IPage>) => Promise<IPage>;
  updatePage: (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) => Promise<IPage>;
  deletePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // access control actions
  makePublic: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  makePrivate: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  // archive actions
  archivePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  restorePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
}

export class PageStore implements IPageStore {
  pages: Record<string, IPage> = {};
  archivedPages: Record<string, IPage> = {};
  // services
  pageService;
  // stores
  rootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      pages: observable,
      archivedPages: observable,
      //  computed
      projectPageIds: computed,
      favoriteProjectPageIds: computed,
      publicProjectPageIds: computed,
      privateProjectPageIds: computed,
      archivedProjectPageIds: computed,
      recentProjectPages: computed,
      // computed actions
      getUnArchivedPageById: action,
      getArchivedPageById: action,
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
    this.rootStore = rootStore;
    // services
    this.pageService = new PageService();
  }

  /**
   * retrieves all pages for a projectId that is available in the url.
   */
  get projectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return null;
    const projectPageIds = Object.keys(this.pages).filter((pageId) => this.pages?.[pageId]?.project === projectId);
    return projectPageIds ?? null;
  }

  /**
   * retrieves all favorite pages for a projectId that is available in the url.
   */
  get favoriteProjectPageIds() {
    if (!this.projectPageIds) return null;
    const favoritePagesIds = Object.keys(this.projectPageIds).filter((pageId) => this.pages?.[pageId]?.is_favorite);
    return favoritePagesIds ?? null;
  }

  /**
   * retrieves all private pages for a projectId that is available in the url.
   */
  get privateProjectPageIds() {
    if (!this.projectPageIds) return null;
    const privatePagesIds = Object.keys(this.projectPageIds).filter((pageId) => this.pages?.[pageId]?.access === 1);
    return privatePagesIds ?? null;
  }

  /**
   * retrieves all shared pages which are public to everyone in the project for a projectId that is available in the url.
   */
  get publicProjectPageIds() {
    if (!this.projectPageIds) return null;
    const publicPagesIds = Object.keys(this.projectPageIds).filter((pageId) => this.pages?.[pageId]?.access === 0);
    return publicPagesIds ?? null;
  }

  /**
   * retrieves all recent pages for a projectId that is available in the url.
   * In format where today, yesterday, this_week, older are keys.
   */
  get recentProjectPages() {
    if (!this.projectPageIds) return null;
    const data: IRecentPages = { today: [], yesterday: [], this_week: [], older: [] };
    data.today = this.projectPageIds.filter((p) => isToday(new Date(this.pages?.[p]?.created_at))) || [];
    data.yesterday = this.projectPageIds.filter((p) => isYesterday(new Date(this.pages?.[p]?.created_at))) || [];
    data.this_week =
      this.projectPageIds.filter((p) => {
        const pageCreatedAt = this.pages?.[p]?.created_at;
        return (
          isThisWeek(new Date(pageCreatedAt)) &&
          !isToday(new Date(pageCreatedAt)) &&
          !isYesterday(new Date(pageCreatedAt))
        );
      }) || [];
    data.older =
      this.projectPageIds.filter((p) => {
        const pageCreatedAt = this.pages?.[p]?.created_at;
        return !isThisWeek(new Date(pageCreatedAt)) && !isYesterday(new Date(pageCreatedAt));
      }) || [];
    return data;
  }

  /**
   * retrieves all archived pages for a projectId that is available in the url.
   */
  get archivedProjectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return null;
    const archivedProjectPageIds = Object.keys(this.archivedPages).filter(
      (pageId) => this.archivedPages?.[pageId]?.project === projectId
    );
    return archivedProjectPageIds ?? null;
  }

  /**
   * retrieves a page from pages by id.
   * @param pageId
   * @returns IPage | null
   */
  getUnArchivedPageById = (pageId: string) => this.pages?.[pageId] ?? null;

  /**
   * retrieves a page from archived pages by id.
   * @param pageId
   * @returns IPage | null
   */
  getArchivedPageById = (pageId: string) => this.archivedPages?.[pageId] ?? null;

  /**
   * fetches all pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  fetchProjectPages = async (workspaceSlug: string, projectId: string) =>
    await this.pageService.getProjectPages(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((page) => {
          set(this.pages, [page.id], page);
        });
      });
      return response;
    });

  /**
   * fetches all archived pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  fetchArchivedProjectPages = async (workspaceSlug: string, projectId: string) =>
    await this.pageService.getArchivedPages(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((page) => {
          set(this.archivedPages, [page.id], page);
        });
      });
      return response;
    });

  /**
   * Add Page to users favorites list
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  addToFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        set(this.pages, [pageId, "is_favorite"], true);
      });
      await this.pageService.addPageToFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      runInAction(() => {
        set(this.pages, [pageId, "is_favorite"], false);
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
        set(this.pages, [pageId, "is_favorite"], false);
      });
      await this.pageService.removePageFromFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      runInAction(() => {
        set(this.pages, [pageId, "is_favorite"], true);
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
  createPage = async (workspaceSlug: string, projectId: string, data: Partial<IPage>) =>
    await this.pageService.createPage(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.pages, [response.id], response);
      });
      return response;
    });

  /**
   * updates the page using the api and updates the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @param data
   * @returns
   */
  updatePage = async (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) =>
    await this.pageService.patchPage(workspaceSlug, projectId, pageId, data).then((response) => {
      const originalPage = this.getUnArchivedPageById(pageId);
      runInAction(() => {
        set(this.pages, [pageId], { ...originalPage, ...data });
      });
      return response;
    });

  /**
   * delete a page using the api and updates the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  deletePage = async (workspaceSlug: string, projectId: string, pageId: string) =>
    await this.pageService.deletePage(workspaceSlug, projectId, pageId).then((response) => {
      runInAction(() => {
        omit(this.archivedPages, [pageId]);
      });
      return response;
    });

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
        set(this.pages, [pageId, "access"], 0);
      });
      await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 0 });
    } catch (error) {
      runInAction(() => {
        set(this.pages, [pageId, "access"], 1);
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
        set(this.pages, [pageId, "access"], 1);
      });
      await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 1 });
    } catch (error) {
      runInAction(() => {
        set(this.pages, [pageId, "access"], 0);
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
  archivePage = async (workspaceSlug: string, projectId: string, pageId: string) =>
    await this.pageService.archivePage(workspaceSlug, projectId, pageId).then(() => {
      runInAction(() => {
        set(this.archivedPages, [pageId], this.pages[pageId]);
        set(this.archivedPages, [pageId, "archived_at"], renderFormattedPayloadDate(new Date()));
        omit(this.pages, [pageId]);
      });
    });

  /**
   * Restore a page from archived pages to pages
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  restorePage = async (workspaceSlug: string, projectId: string, pageId: string) =>
    await this.pageService.restorePage(workspaceSlug, projectId, pageId).then(() => {
      runInAction(() => {
        set(this.pages, [pageId], this.archivedPages[pageId]);
        omit(this.archivedPages, [pageId]);
      });
    });
}
