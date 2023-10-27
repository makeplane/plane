import { observable, action, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project";
import { WorkspaceService } from "services/workspace.service";
// types
import { RootStore } from "../root";
import { IWorkspaceView } from "types/workspace-views";

export interface IGlobalViewsStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  globalViewId: string | null;
  globalViewsList: IWorkspaceView[] | null;
  globalViewDetails: {
    [viewId: string]: IWorkspaceView;
  };

  // actions
  setGlobalViewId: (viewId: string) => void;

  fetchAllGlobalViews: (workspaceSlug: string) => Promise<IWorkspaceView[]>;
  fetchGlobalViewDetails: (workspaceSlug: string, viewId: string) => Promise<IWorkspaceView>;
  createGlobalView: (workspaceSlug: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  updateGlobalView: (workspaceSlug: string, viewId: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  deleteGlobalView: (workspaceSlug: string, viewId: string) => Promise<any>;
}

export class GlobalViewsStore implements IGlobalViewsStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  globalViewId: string | null = null;
  globalViewsList: IWorkspaceView[] | null = null;
  globalViewDetails: { [viewId: string]: IWorkspaceView } = {};

  // root store
  rootStore;

  // services
  projectService;
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      globalViewId: observable.ref,
      globalViewsList: observable.ref,
      globalViewDetails: observable.ref,

      // actions
      setGlobalViewId: action,

      fetchAllGlobalViews: action,
      fetchGlobalViewDetails: action,
      createGlobalView: action,
      updateGlobalView: action,
      deleteGlobalView: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.workspaceService = new WorkspaceService();
  }

  setGlobalViewId = (viewId: string) => {
    this.globalViewId = viewId;
  };

  fetchAllGlobalViews = async (workspaceSlug: string): Promise<IWorkspaceView[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.workspaceService.getAllViews(workspaceSlug);

      runInAction(() => {
        this.loader = false;
        this.globalViewsList = response;
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

  fetchGlobalViewDetails = async (workspaceSlug: string, viewId: string): Promise<IWorkspaceView> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.workspaceService.getViewDetails(workspaceSlug, viewId);

      runInAction(() => {
        this.loader = false;
        this.globalViewDetails = {
          ...this.globalViewDetails,
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

  createGlobalView = async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
    try {
      const response = await this.workspaceService.createView(workspaceSlug, data);

      runInAction(() => {
        this.globalViewsList = [response, ...(this.globalViewsList ?? [])];
        this.globalViewDetails = {
          ...this.globalViewDetails,
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

  updateGlobalView = async (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>
  ): Promise<IWorkspaceView> => {
    const viewToUpdate = { ...this.globalViewDetails[viewId], ...data };

    try {
      runInAction(() => {
        this.globalViewsList = (this.globalViewsList ?? []).map((view) => {
          if (view.id === viewId) return viewToUpdate;

          return view;
        });
        this.globalViewDetails = {
          ...this.globalViewDetails,
          [viewId]: viewToUpdate,
        };
      });

      const response = await this.workspaceService.updateView(workspaceSlug, viewId, data);

      return response;
    } catch (error) {
      this.fetchGlobalViewDetails(workspaceSlug, viewId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  deleteGlobalView = async (workspaceSlug: string, viewId: string): Promise<any> => {
    const newViewsList = (this.globalViewsList ?? []).filter((view) => view.id !== viewId);

    try {
      runInAction(() => {
        this.globalViewsList = newViewsList;
      });

      await this.workspaceService.deleteView(workspaceSlug, viewId);
    } catch (error) {
      this.fetchAllGlobalViews(workspaceSlug);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };
}
