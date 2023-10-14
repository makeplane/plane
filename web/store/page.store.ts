import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IPage } from "types";
// services
import { ProjectService } from "services/project";
import { PageService } from "services/page.service";

export interface IPageStore {
  loader: boolean;
  error: any | null;

  pageId: string | null;
  pages: {
    [project_id: string]: IPage[];
  };
  page_details: {
    [page_id: string]: IPage;
  };

  //computed
  projectPages: IPage[];
  // actions
  setPageId: (pageId: string) => void;
  fetchPages: (workspaceSlug: string, projectSlug: string) => void;
}

class PageStore implements IPageStore {
  loader: boolean = false;
  error: any | null = null;

  pageId: string | null = null;
  pages: {
    [project_id: string]: IPage[];
  } = {};
  page_details: {
    [page_id: string]: IPage;
  } = {};

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

      pageId: observable.ref,
      pages: observable.ref,

      // computed
      projectPages: computed,
      // action
      setPageId: action,
      fetchPages: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.pageService = new PageService();
  }

  get projectPages() {
    if (!this.rootStore.project.projectId) return [];
    return this.pages?.[this.rootStore.project.projectId] || [];
  }

  setPageId = (pageId: string) => {
    this.pageId = pageId;
  };

  fetchPages = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const pagesResponse = await this.pageService.getPagesWithParams(workspaceSlug, projectSlug, "all");

      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectSlug]: pagesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project pages in project store", error);
      this.loader = false;
      this.error = error;
    }
  };
}

export default PageStore;
