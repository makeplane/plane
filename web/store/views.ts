import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
import { ViewService } from "services/views.service";

export interface IViewStore {
  loader: boolean;
  error: any | null;

  viewId: string | null;
  views: {
    [project_id: string]: any[];
  };

  setViewId: (viewSlug: string) => void;

  fetchViews: (workspaceSlug: string, projectSlug: string) => Promise<any>;
}

class ViewStore implements IViewStore {
  loader: boolean = false;
  error: any | null = null;

  viewId: string | null = null;
  views: {
    [project_id: string]: any[];
  } = {};

  // root store
  rootStore;
  // services
  projectService;
  viewService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      viewId: observable.ref,
      views: observable.ref,

      // computed
      projectViews: computed,
      // actions
      setViewId: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.viewService = new ViewService();
  }

  // computed
  get projectViews() {
    if (!this.rootStore.project.projectId) return null;
    return this.views[this.rootStore.project.projectId] || null;
  }

  // actions
  setViewId = (viewSlug: string) => {
    this.viewId = viewSlug ?? null;
  };

  fetchViews = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const viewsResponse = await this.viewService.getViews(workspaceSlug, projectId);

      runInAction(() => {
        this.views = {
          ...this.views,
          [projectId]: viewsResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project views in project store", error);
      this.loader = false;
      this.error = error;
    }
  };
}

export default ViewStore;
