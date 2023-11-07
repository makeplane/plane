import { observable, action, makeObservable, runInAction } from "mobx";
// services
import { ViewService } from "services/view.service";
// types
import { RootStore } from "../root";
import { IProjectView } from "types";

export interface IProjectViewsStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  viewId: string | null;
  viewsList: {
    [projectId: string]: IProjectView[];
  };
  viewDetails: {
    [viewId: string]: IProjectView;
  };

  // actions
  setViewId: (viewId: string) => void;

  fetchAllViews: (workspaceSlug: string, projectId: string) => Promise<IProjectView[]>;
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
  viewsList: {
    [projectId: string]: IProjectView[];
  } = {};
  viewDetails: { [viewId: string]: IProjectView } = {};

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
      viewsList: observable.ref,
      viewDetails: observable.ref,

      // actions
      setViewId: action,

      fetchAllViews: action,
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

  setViewId = (viewId: string) => {
    this.viewId = viewId;
  };

  fetchAllViews = async (workspaceSlug: string, projectId: string): Promise<IProjectView[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.viewService.getViews(workspaceSlug, projectId);

      runInAction(() => {
        this.loader = false;
        this.viewsList = {
          ...this.viewsList,
          [projectId]: response,
        };
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

      runInAction(() => {
        this.loader = false;
        this.viewDetails = {
          ...this.viewDetails,
          [response.id]: response,
        };
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
      const response = await this.viewService.createView(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser
      );

      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: [...(this.viewsList[projectId] ?? []), response],
        };
        this.viewDetails = {
          ...this.viewDetails,
          [response.id]: response,
        };
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
    const viewToUpdate = { ...this.viewDetails[viewId], ...data };

    try {
      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId]?.map((view) => (view.id === viewId ? viewToUpdate : view)),
        };

        this.viewDetails = {
          ...this.viewDetails,
          [viewId]: viewToUpdate,
        };
      });

      const response = await this.viewService.patchView(
        workspaceSlug,
        projectId,
        viewId,
        data,
        this.rootStore.user.currentUser
      );

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
      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId]?.filter((view) => view.id !== viewId),
        };
      });

      await this.viewService.deleteView(workspaceSlug, projectId, viewId, this.rootStore.user.currentUser);
    } catch (error) {
      this.fetchAllViews(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  addViewToFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId].map((view) => ({
            ...view,
            is_favorite: view.id === viewId ? true : view.is_favorite,
          })),
        };
      });

      await this.viewService.addViewToFavorites(workspaceSlug, projectId, {
        view: viewId,
      });
    } catch (error) {
      console.error("Failed to add view to favorites in view store", error);

      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId].map((view) => ({
            ...view,
            is_favorite: view.id === viewId ? false : view.is_favorite,
          })),
        };
        this.error = error;
      });
    }
  };

  removeViewFromFavorites = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId].map((view) => ({
            ...view,
            is_favorite: view.id === viewId ? false : view.is_favorite,
          })),
        };
      });

      await this.viewService.removeViewFromFavorites(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to remove view from favorites in view store", error);

      runInAction(() => {
        this.viewsList = {
          ...this.viewsList,
          [projectId]: this.viewsList[projectId].map((view) => ({
            ...view,
            is_favorite: view.id === viewId ? true : view.is_favorite,
          })),
        };
      });
    }
  };
}
