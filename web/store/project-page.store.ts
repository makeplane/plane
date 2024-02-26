import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { set } from "lodash";
// services
import { PageService } from "services/page.service";
// store
import { PageStore, IPageStore } from "store/page.store";
// types
import { IPage, IRecentPages } from "@plane/types";
import { RootStore } from "./root.store";
import { isThisWeek, isToday, isYesterday } from "date-fns";

export interface IProjectPageStore {
  loader: boolean;
  archivedPageLoader: boolean;
  projectPageMap: Record<string, Record<string, IPageStore>>;
  projectArchivedPageMap: Record<string, Record<string, IPageStore>>;

  projectPageIds: string[] | undefined;
  archivedPageIds: string[] | undefined;
  favoriteProjectPageIds: string[] | undefined;
  privateProjectPageIds: string[] | undefined;
  publicProjectPageIds: string[] | undefined;
  recentProjectPages: IRecentPages | undefined;
  // fetch actions
  fetchProjectPages: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchArchivedProjectPages: (workspaceSlug: string, projectId: string) => Promise<void>;
  // crud actions
  createPage: (workspaceSlug: string, projectId: string, data: Partial<IPage>) => Promise<IPage>;
  deletePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  archivePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  restorePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
}

export class ProjectPageStore implements IProjectPageStore {
  loader: boolean = false;
  archivedPageLoader: boolean = false;
  projectPageMap: Record<string, Record<string, IPageStore>> = {}; // { projectId: [page1, page2] }
  projectArchivedPageMap: Record<string, Record<string, IPageStore>> = {}; // { projectId: [page1, page2] }

  // root store
  rootStore;

  pageService;
  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      archivedPageLoader: observable.ref,
      projectPageMap: observable,
      projectArchivedPageMap: observable,

      projectPageIds: computed,
      archivedPageIds: computed,
      favoriteProjectPageIds: computed,
      privateProjectPageIds: computed,
      publicProjectPageIds: computed,
      recentProjectPages: computed,

      // fetch actions
      fetchProjectPages: action,
      fetchArchivedProjectPages: action,
      // crud actions
      createPage: action,
      deletePage: action,
    });
    this.rootStore = _rootStore;

    this.pageService = new PageService();
  }

  get projectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.projectPageMap?.[projectId]) return [];

    const allProjectIds = Object.keys(this.projectPageMap[projectId]);
    return allProjectIds.sort((a, b) => {
      const dateA = new Date(this.projectPageMap[projectId][a].created_at).getTime();
      const dateB = new Date(this.projectPageMap[projectId][b].created_at).getTime();
      return dateB - dateA;
    });
  }

  get archivedPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId || !this.projectArchivedPageMap[projectId]) return [];
    const archivedPages = Object.keys(this.projectArchivedPageMap[projectId]);
    return archivedPages.sort((a, b) => {
      const dateA = new Date(this.projectArchivedPageMap[projectId][a].created_at).getTime();
      const dateB = new Date(this.projectArchivedPageMap[projectId][b].created_at).getTime();
      return dateB - dateA;
    });
  }

  get favoriteProjectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!this.projectPageIds || !projectId) return [];

    const favouritePages: string[] = this.projectPageIds.filter(
      (page) => this.projectPageMap[projectId][page].is_favorite
    );
    return favouritePages;
  }

  get privateProjectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    if (!this.projectPageIds || !projectId) return [];

    const privatePages: string[] = this.projectPageIds.filter(
      (page) => this.projectPageMap[projectId][page].access === 1
    );
    return privatePages;
  }

  get publicProjectPageIds() {
    const projectId = this.rootStore.app.router.projectId;
    const userId = this.rootStore.user.currentUser?.id;
    if (!this.projectPageIds || !projectId || !userId) return [];

    const publicPages: string[] = this.projectPageIds.filter(
      (page) =>
        this.projectPageMap[projectId][page].access === 0 && this.projectPageMap[projectId][page].owned_by === userId
    );
    return publicPages;
  }

  get recentProjectPages() {
    const projectId = this.rootStore.app.router.projectId;
    if (!this.projectPageIds || !projectId) return;

    const today: string[] = this.projectPageIds.filter((page) =>
      isToday(new Date(this.projectPageMap[projectId][page].updated_at))
    );

    const yesterday: string[] = this.projectPageIds.filter((page) =>
      isYesterday(new Date(this.projectPageMap[projectId][page].updated_at))
    );

    const this_week: string[] = this.projectPageIds.filter((page) => {
      const pageUpdatedAt = this.projectPageMap[projectId][page].updated_at;
      return (
        isThisWeek(new Date(pageUpdatedAt)) &&
        !isToday(new Date(pageUpdatedAt)) &&
        !isYesterday(new Date(pageUpdatedAt))
      );
    });

    const older: string[] = this.projectPageIds.filter((page) => {
      const pageUpdatedAt = this.projectPageMap[projectId][page].updated_at;
      return !isThisWeek(new Date(pageUpdatedAt)) && !isYesterday(new Date(pageUpdatedAt));
    });

    return { today, yesterday, this_week, older };
  }

  /**
   * Fetching all the pages for a specific project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectPages = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      await this.pageService.getProjectPages(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          for (const page of response) {
            set(this.projectPageMap, [projectId, page.id], new PageStore(page, this.rootStore));
          }
          this.loader = false;
        });
        return response;
      });
    } catch (e) {
      this.loader = false;

      throw e;
    }
  };

  /**
   * fetches all archived pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  fetchArchivedProjectPages = async (workspaceSlug: string, projectId: string) => {
    try {
      this.archivedPageLoader = true;
      await this.pageService.getArchivedPages(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          for (const page of response) {
            set(this.projectArchivedPageMap, [projectId, page.id], new PageStore(page, this.rootStore));
          }
          this.archivedPageLoader = false;
        });
        return response;
      });
    } catch (e) {
      this.archivedPageLoader = false;
      throw e;
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
      set(this.projectPageMap, [projectId, response.id], new PageStore(response, this.rootStore));
    });
    return response;
  };

  /**
   * delete a page using the api and updates the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  deletePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    const response = await this.pageService.deletePage(workspaceSlug, projectId, pageId);
    runInAction(() => {
      delete this.projectArchivedPageMap[projectId][pageId];
    });
    return response;
  };

  /**
   * Mark a page archived
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  archivePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    runInAction(() => {
      set(this.projectArchivedPageMap, [projectId, pageId], this.projectPageMap[projectId][pageId]);
      set(this.projectArchivedPageMap[projectId][pageId], "archived_at", new Date().toISOString());
      delete this.projectPageMap[projectId][pageId];
    });
    const response = await this.pageService.archivePage(workspaceSlug, projectId, pageId).catch(() => {
      runInAction(() => {
        set(this.projectPageMap, [projectId, pageId], this.projectArchivedPageMap[projectId][pageId]);
        set(this.projectPageMap[projectId][pageId], "archived_at", null);
        delete this.projectArchivedPageMap[projectId][pageId];
      });
    });
    return response;
  };

  /**
   * Restore a page from archived pages to pages
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  restorePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    const pageArchivedAt = this.projectArchivedPageMap[projectId][pageId].archived_at;
    runInAction(() => {
      set(this.projectPageMap, [projectId, pageId], this.projectArchivedPageMap[projectId][pageId]);
      set(this.projectPageMap[projectId][pageId], "archived_at", null);
      delete this.projectArchivedPageMap[projectId][pageId];
    });
    await this.pageService.restorePage(workspaceSlug, projectId, pageId).catch(() => {
      runInAction(() => {
        set(this.projectArchivedPageMap, [projectId, pageId], this.projectPageMap[projectId][pageId]);
        set(this.projectArchivedPageMap[projectId][pageId], "archived_at", pageArchivedAt);
        delete this.projectPageMap[projectId][pageId];
      });
    });
  };
}
