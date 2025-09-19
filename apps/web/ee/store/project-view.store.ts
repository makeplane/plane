import set from "lodash/set";
import { action, makeObservable, runInAction } from "mobx";
import { EViewAccess, IProjectView, TPublishViewDetails, TPublishViewSettings } from "@plane/types";
import { ViewService } from "@/plane-web/services/project/view.service";
import {
  IProjectViewStore as ICoreProjectViewStore,
  ProjectViewStore as CoreProjectViewStore,
} from "@/store/project-view.store";
import { RootStore } from "./root.store";

export interface IProjectViewStore extends ICoreProjectViewStore {
  lockView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<void>;
  unLockView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<void>;
  updateViewAccess: (workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) => Promise<void>;
  publishView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: TPublishViewSettings
  ) => Promise<TPublishViewDetails | undefined>;
  fetchPublishDetails: (
    workspaceSlug: string,
    projectId: string,
    viewId: string
  ) => Promise<TPublishViewDetails | undefined>;
  updatePublishedView: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => Promise<void>;
  unPublishView: (workspaceSlug: string, projectId: string, viewId: string) => Promise<void>;
}

export class ProjectViewStore extends CoreProjectViewStore implements IProjectViewStore {
  //root store
  rootStore: RootStore;
  //services
  viewService: ViewService;
  constructor(_rootStore: RootStore) {
    super(_rootStore);
    makeObservable(this, {
      lockView: action,
      unLockView: action,
      updateViewAccess: action,
      publishView: action,
      fetchPublishDetails: action,
      updatePublishedView: action,
      unPublishView: action,
    });
    this.rootStore = _rootStore;
    this.viewService = new ViewService();
  }

  /**
   * Creates a new view for a specific project and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IProjectView>
   */
  override createView = action(
    async (workspaceSlug: string, projectId: string, data: Partial<IProjectView>): Promise<IProjectView> => {
      try {
        const response = await super.createView(workspaceSlug, projectId, data);

        runInAction(() => {
          set(this.viewMap, [response.id], response);
        });

        if (data.access === EViewAccess.PRIVATE) {
          await this.updateViewAccess(workspaceSlug, projectId, response.id, EViewAccess.PRIVATE);
        }

        return response;
      } catch (error) {
        console.error("Failed to create view in view store", error);
        throw error;
      }
    }
  );

  /**
   * Updates a view details of specific view and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @param data
   * @returns Promise<IProjectView>
   */
  override updateView = action(
    async (
      workspaceSlug: string,
      projectId: string,
      viewId: string,
      data: Partial<IProjectView>
    ): Promise<IProjectView> => {
      const currentView = this.getViewById(viewId);

      try {
        const response = await super.updateView(workspaceSlug, projectId, viewId, data);

        if (data.access !== undefined && data.access !== currentView.access) {
          await this.updateViewAccess(workspaceSlug, projectId, viewId, data.access);
        }

        return response;
      } catch (error) {
        console.error("Failed to update view in view store", error);
        runInAction(() => {
          set(this.viewMap, [viewId], { ...currentView, ...data });
        });
        throw error;
      }
    }
  );

  /** Locks view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  lockView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], true);
      });
      await this.viewService.lockView(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], false);
      });
    }
  };

  /**
   * unlocks View
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  unLockView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const currentView = this.getViewById(viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], false);
      });
      await this.viewService.unLockView(workspaceSlug, projectId, viewId);
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "is_locked"], true);
      });
    }
  };

  /**
   * Publishes View to the Public
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  publishView = async (workspaceSlug: string, projectId: string, viewId: string, data: TPublishViewSettings) => {
    try {
      const response = (await this.viewService.publishView(
        workspaceSlug,
        projectId,
        viewId,
        data
      )) as TPublishViewDetails;
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], response?.anchor);
      });

      return response;
    } catch (error) {
      console.error("Failed to publish view", error);
    }
  };

  /**
   * fetches Published Details
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  fetchPublishDetails = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const response = (await this.viewService.getPublishDetails(
        workspaceSlug,
        projectId,
        viewId
      )) as TPublishViewDetails;
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], response?.anchor);
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch published view details", error);
    }
  };

  /**
   * updates already published view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  updatePublishedView = async (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<TPublishViewSettings>
  ) => {
    try {
      return await this.viewService.updatePublishedView(workspaceSlug, projectId, viewId, data);
    } catch (error) {
      console.error("Failed to update published view details", error);
    }
  };

  /**
   * un publishes the view
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @returns
   */
  unPublishView = async (workspaceSlug: string, projectId: string, viewId: string) => {
    try {
      const response = await this.viewService.unPublishView(workspaceSlug, projectId, viewId);
      runInAction(() => {
        set(this.viewMap, [viewId, "anchor"], null);
      });
      return response;
    } catch (error) {
      console.error("Failed to unPublish view", error);
    }
  };

  /**
   * Updates View access
   * @param workspaceSlug
   * @param projectId
   * @param viewId
   * @param access
   * @returns
   */
  updateViewAccess = async (workspaceSlug: string, projectId: string, viewId: string, access: EViewAccess) => {
    const currentView = this.getViewById(viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.viewMap, [viewId, "access"], access);
      });
      await this.viewService.updateViewAccess(workspaceSlug, projectId, viewId, access);
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.viewMap, [viewId, "access"], currentAccess);
      });
    }
  };
}
