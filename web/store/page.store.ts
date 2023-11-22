import { observable, action, computed, makeObservable, runInAction } from "mobx";
import isYesterday from "date-fns/isYesterday";
import isToday from "date-fns/isToday";
import isThisWeek from "date-fns/isThisWeek";
// services
import { ProjectService } from "services/project";
import { PageService } from "services/page.service";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { RootStore } from "./root";
import { IPage, IRecentPages } from "types";

export interface IPageStore {
  loader: boolean;
  error: any | null;
  pages: {
    [project_id: string]: IPage[];
  };
  archivedPages: {
    [project_id: string]: IPage[];
  };
  //computed
  projectPages: IPage[] | undefined;
  recentProjectPages: IRecentPages | undefined;
  favoriteProjectPages: IPage[] | undefined;
  privateProjectPages: IPage[] | undefined;
  sharedProjectPages: IPage[] | undefined;
  archivedProjectPages: IPage[] | undefined;
  // actions
  fetchPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  createPage: (workspaceSlug: string, projectId: string, data: Partial<IPage>) => Promise<IPage>;
  updatePage: (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) => Promise<IPage>;
  deletePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  addToFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  removeFromFavorites: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  makePublic: (workspaceSlug: string, projectId: string, pageId: string) => Promise<IPage>;
  makePrivate: (workspaceSlug: string, projectId: string, pageId: string) => Promise<IPage>;
  fetchArchivedPages: (workspaceSlug: string, projectId: string) => Promise<IPage[]>;
  archivePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
  restorePage: (workspaceSlug: string, projectId: string, pageId: string) => Promise<void>;
}

export class PageStore implements IPageStore {
  loader: boolean = false;
  error: any | null = null;
  pages: { [project_id: string]: IPage[] } = {};
  archivedPages: { [project_id: string]: IPage[] } = {};
  // root store
  rootStore;
  // service
  projectService;
  pageService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,
      pages: observable.ref,
      archivedPages: observable.ref,
      // computed
      projectPages: computed,
      recentProjectPages: computed,
      favoriteProjectPages: computed,
      privateProjectPages: computed,
      sharedProjectPages: computed,
      archivedProjectPages: computed,
      // action
      fetchPages: action,
      createPage: action,
      updatePage: action,
      deletePage: action,
      addToFavorites: action,
      removeFromFavorites: action,
      makePublic: action,
      makePrivate: action,
      archivePage: action,
      restorePage: action,
      fetchArchivedPages: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.pageService = new PageService();
  }

  get projectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId || !this.pages[projectId]) return undefined;

    return this.pages?.[projectId] || [];
  }

  get recentProjectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return undefined;

    if (!this.pages[projectId]) return undefined;

    const data: IRecentPages = { today: [], yesterday: [], this_week: [], older: [] };

    data["today"] = this.pages[projectId]?.filter((p) => isToday(new Date(p.created_at))) || [];
    data["yesterday"] = this.pages[projectId]?.filter((p) => isYesterday(new Date(p.created_at))) || [];
    data["this_week"] =
      this.pages[projectId]?.filter(
        (p) =>
          isThisWeek(new Date(p.created_at)) && !isToday(new Date(p.created_at)) && !isYesterday(new Date(p.created_at))
      ) || [];
    data["older"] =
      this.pages[projectId]?.filter(
        (p) => !isThisWeek(new Date(p.created_at)) && !isYesterday(new Date(p.created_at))
      ) || [];

    return data;
  }

  get favoriteProjectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId || !this.pages[projectId]) return undefined;

    return this.pages[projectId]?.filter((p) => p.is_favorite);
  }

  get privateProjectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId || !this.pages[projectId]) return undefined;

    return this.pages[projectId]?.filter((p) => p.access === 1);
  }

  get sharedProjectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId || !this.pages[projectId]) return undefined;

    return this.pages[projectId]?.filter((p) => p.access === 0);
  }

  get archivedProjectPages() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId || !this.archivedPages[projectId]) return undefined;

    return this.archivedPages[projectId];
  }

  addToFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: this.pages[projectId].map((page) => {
            if (page.id === pageId) {
              return { ...page, is_favorite: true };
            }
            return page;
          }),
        };
      });
      await this.pageService.addPageToFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      throw error;
    }
  };

  removeFromFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: this.pages[projectId].map((page) => {
            if (page.id === pageId) {
              return { ...page, is_favorite: false };
            }
            return page;
          }),
        };
      });
      await this.pageService.removePageFromFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      throw error;
    }
  };

  fetchPages = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.pageService.getPagesWithParams(workspaceSlug, projectId, "all");

      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: response,
        };
        this.loader = false;
        this.error = null;
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch project pages in project store", error);
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  createPage = async (workspaceSlug: string, projectId: string, data: Partial<IPage>) => {
    try {
      const response = await this.pageService.createPage(workspaceSlug, projectId, data);
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: [...this.pages[projectId], response],
        };
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  updatePage = async (workspaceSlug: string, projectId: string, pageId: string, data: Partial<IPage>) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: this.pages[projectId]?.map((page) => {
            if (page.id === pageId) {
              return { ...page, ...data };
            }
            return page;
          }),
        };
      });

      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  deletePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.archivedPages = {
          ...this.archivedPages,
          [projectId]: this.archivedPages[projectId]?.filter((page) => page.id !== pageId),
        };
      });

      const response = await this.pageService.deletePage(workspaceSlug, projectId, pageId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  makePublic = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: this.pages[projectId]?.map((page) => ({
            ...page,
            access: page.id === pageId ? 0 : page.access,
          })),
        };
      });
      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 0 });
      return response;
    } catch (error) {
      throw error;
    }
  };

  makePrivate = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectId]: this.pages[projectId]?.map((page) => ({
            ...page,
            access: page.id === pageId ? 1 : page.access,
          })),
        };
      });

      const response = await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 1 });
      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchArchivedPages = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.pageService.getArchivedPages(workspaceSlug, projectId);
      runInAction(() => {
        this.archivedPages = {
          ...this.archivedPages,
          [projectId]: response,
        };
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  archivePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      const archivedPage = this.pages[projectId]?.find((page) => page.id === pageId);

      if (archivedPage) {
        runInAction(() => {
          this.pages = {
            ...this.pages,
            [projectId]: [...this.pages[projectId]?.filter((page) => page.id != pageId)],
          };
          this.archivedPages = {
            ...this.archivedPages,
            [projectId]: [
              ...this.archivedPages[projectId],
              { ...archivedPage, archived_at: renderDateFormat(new Date()) },
            ],
          };
        });
      }

      await this.pageService.archivePage(workspaceSlug, projectId, pageId);
    } catch (error) {
      throw error;
    }
  };

  restorePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      const restoredPage = this.archivedPages[projectId]?.find((page) => page.id === pageId);

      if (restoredPage) {
        runInAction(() => {
          this.pages = {
            ...this.pages,
            [projectId]: [...this.pages[projectId], { ...restoredPage, archived_at: null }],
          };
          this.archivedPages = {
            ...this.archivedPages,
            [projectId]: [...this.archivedPages[projectId]?.filter((page) => page.id != pageId)],
          };
        });
      }
      await this.pageService.restorePage(workspaceSlug, projectId, pageId);
    } catch (error) {
      throw error;
    }
  };
}
