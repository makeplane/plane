import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
// services
import { ViewService } from "services/view.service";
import { RootStore } from "store/root.store";
// types
import { IProjectView } from "types";

export interface IProjectViewsStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  viewId: string | null;
  viewMap: {
    [projectId: string]: {
      [viewId: string]: IProjectView;
    };
  };

  // actions
  fetchViews: (workspaceSlug: string, projectId: string) => Promise<IProjectView[]>;
  fetchViewDetails: (workspaceSlug: string, projectId: string, viewId: string) => Promise<IProjectView>;
  createView: (workspaceSlug: string, projectId: string, data: Partial<IProjectView>) => Promise<IProjectView>;
  updateView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IProjectView>
  ) => Promise<IProjectView>;
  deleteView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
  addViewToFavorites: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
  removeViewFromFavorites: (workspaceSlug: string, projectId: string, viewId: string) => Promise<any>;
}

export class ProjectViewsStore implements IProjectViewsStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  viewId: string | null = null;
  viewMap: {
    [projectId: string]: {
      [viewId: string]: IProjectView;
    };
  } = {};

  // root store
  rootStore;

  // services
  viewService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      viewId: observable.ref,
      viewMap: observable,

      // actions
      fetchViews: action,
      fetchViewDetails: action,
      createView: action,
      updateView: action,
      deleteView: action,
      addViewToFavorites: action,
      removeViewFromFavorites: action,
    });

    this.rootStore = _rootStore;

    this.viewService = new ViewService();
  }

  setViewId = (viewId: string | null) => {
    this.viewId = viewId;
  };

  fetchViews = async (workspaceSlug: string, projectId: string): Promise<IProjectView[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.viewService.getViews(workspaceSlug, projectId);

      const _viewMap = set(this.viewMap, [projectId], response);
      runInAction(() => {
        this.loader = false;
        this.viewMap = _viewMap;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  fetchViewDetails = async (workspaceSlug: string, projectId: string, viewId: string): Promise<IProjectView> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.viewService.getViewDetails(workspaceSlug, projectId, viewId);

      const _viewMap = set(this.viewMap, [projectId, viewId], response);
      runInAction(() => {
        this.loader = false;
        this.viewMap = _viewMap;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createView = async (workspaceSlug: string, projectId: string, data: Partial<IProjectView>): Promise<IProjectView> => {
    try {
      const response = await this.viewService.createView(workspaceSlug, projectId, data);

      const _viewMap = set(this.viewMap, [projectId, response.id], response);
      runInAction(() => {
        this.loader = false;
        this.viewMap = _viewMap;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateView = async (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IProjectView>
  ): Promise<IProjectView> => {
    try {
      const currentView = this.viewMap[projectId][viewId];

      const _viewMap = set(this.viewMap, [projectId, viewId], { ...currentView, ...data });
      runInAction(() => {
        this.viewMap = _viewMap;
      });

      const response = await this.viewService.patchView(workspaceSlug, projectId, viewId, data);

      return response;
    } catch (error) {
      this.fetchViewDetails(workspaceSlug, projectId, viewId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  deleteView = async (workspaceSlug: string, projectId: string, viewId: string): Promise<any> => {
    try {
      const currentProjectViews = this.viewMap[projectId];
      delete currentProjectViews[viewId];

      const _viewMap = set(this.viewMap, [projectId], currentProjectViews);
      runInAction(() => {
        this.viewMap = _viewMap;
      });

      await this.viewService.deleteView(workspaceSlug, projectId, viewId);
    } catch (error) {
      this.fetchViews(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  addViewToFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.viewMap[projectId][viewId];

      if (currentView.is_favorite) return;

      const _viewMap = set(this.viewMap, [projectId, viewId, "is_favorite"], true);
      runInAction(() => {
        this.viewMap = _viewMap;
      });

      await this.viewService.addViewToFavorites(workspaceSlug, projectId, {
        view: viewId,
      });
    } catch (error) {
      console.error("Failed to add view to favorites in view store", error);

      const _viewMap = set(this.viewMap, [projectId, viewId, "is_favorite"], false);
      runInAction(() => {
        this.viewMap = _viewMap;
      });
    }
  };

  removeViewFromFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.viewMap[projectId][viewId];

      if (!currentView.is_favorite) return;

      const _viewMap = set(this.viewMap, [projectId, viewId, "is_favorite"], false);
      runInAction(() => {
        this.viewMap = _viewMap;
      });

      await this.viewService.removeViewFromFavorites(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to remove view from favorites in view store", error);

      const _viewMap = set(this.viewMap, [projectId, viewId, "is_favorite"], true);
      runInAction(() => {
        this.viewMap = _viewMap;
      });
    }
  };
}
