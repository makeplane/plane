import { makeObservable, observable, runInAction, action } from "mobx";
import { set } from "lodash";
// services
import { PageService } from "services/page.service";
// store
import { PageStore, IPageStore } from "store/page.store";
// types
import { IPage } from "@plane/types";

export interface IProjectPageStore {
  projectPages: Record<string, IPageStore[]>;
  projectArchivedPages: Record<string, IPageStore[]>;
  // fetch actions
  fetchProjectPages: (workspaceSlug: string, projectId: string) => void;
  fetchArchivedProjectPages: (workspaceSlug: string, projectId: string) => void;
  // crud actions
  createPage: (workspaceSlug: string, projectId: string, data: Partial<IPage>) => void;
  deletePage: (workspaceSlug: string, projectId: string, pageId: string) => void;
}

export class ProjectPageStore implements IProjectPageStore {
  projectPages: Record<string, IPageStore[]> = {}; // { projectId: [page1, page2] }
  projectArchivedPages: Record<string, IPageStore[]> = {}; // { projectId: [page1, page2] }

  pageService;

  constructor() {
    makeObservable(this, {
      projectPages: observable,
      projectArchivedPages: observable,
      // fetch actions
      fetchProjectPages: action,
      fetchArchivedProjectPages: action,
      // crud actions
      createPage: action,
      deletePage: action,
    });
    this.pageService = new PageService();
  }

  /**
   * Fetching all the pages for a specific project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectPages = async (workspaceSlug: string, projectId: string) => {
    const response = await this.pageService.getProjectPages(workspaceSlug, projectId);
    runInAction(() => {
      this.projectPages[projectId] = response?.map((page) => new PageStore(page));
    });
  };

  /**
   * fetches all archived pages for a project.
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IPage[]>
   */
  fetchArchivedProjectPages = async (workspaceSlug: string, projectId: string) =>
    await this.pageService.getArchivedPages(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        this.projectArchivedPages[projectId] = response?.map((page) => new PageStore(page));
      });
      return response;
    });

  /**
   * Creates a new page using the api and updated the local state in store
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createPage = async (workspaceSlug: string, projectId: string, data: Partial<IPage>) => {
    const response = await this.pageService.createPage(workspaceSlug, projectId, data);
    runInAction(() => {
      this.projectPages[projectId] = [...this.projectPages[projectId], new PageStore(response)];
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
      this.projectPages = set(
        this.projectPages,
        [projectId],
        this.projectPages[projectId].filter((page) => page.id !== pageId)
      );
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
    const response = await this.pageService.archivePage(workspaceSlug, projectId, pageId);
    runInAction(() => {
      set(
        this.projectPages,
        [projectId],
        this.projectPages[projectId].filter((page) => page.id !== pageId)
      );
      this.projectArchivedPages = set(this.projectArchivedPages, [projectId], this.projectArchivedPages[projectId]);
    });
    return response;
  };

  /**
   * Restore a page from archived pages to pages
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  restorePage = async (workspaceSlug: string, projectId: string, pageId: string) =>
    await this.pageService.restorePage(workspaceSlug, projectId, pageId).then(() => {
      runInAction(() => {
        set(
          this.projectArchivedPages,
          [projectId],
          this.projectArchivedPages[projectId].filter((page) => page.id !== pageId)
        );
        set(this.projectPages, [projectId], [...this.projectPages[projectId]]);
      });
    });
}
