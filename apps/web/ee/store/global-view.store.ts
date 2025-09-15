import set from "lodash/set";
import { action, makeObservable, runInAction } from "mobx";
import { EViewAccess, IWorkspaceView } from "@plane/types";
import {
  IGlobalViewStore as ICoreGlobalViewStore,
  GlobalViewStore as CoreGlobalViewStore,
} from "@/ce/store/global-view.store";
import { RootStore } from "@/ce/store/root.store";

export interface IGlobalViewStore extends ICoreGlobalViewStore {
  lockView: (workspaceSlug: string, viewId: string) => Promise<void>;
  unLockView: (workspaceSlug: string, viewId: string) => Promise<void>;
  updateViewAccess: (workspaceSlug: string, viewId: string, access: EViewAccess) => Promise<void>;
}

export class GlobalViewStore extends CoreGlobalViewStore implements IGlobalViewStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);
  }

  override createGlobalView = action(
    async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> => {
      try {
        const response = await super.createGlobalView(workspaceSlug, data);

        if (data.access === EViewAccess.PRIVATE) {
          await this.updateViewAccess(workspaceSlug, response.id, EViewAccess.PRIVATE);
        }

        return response;
      } catch (error) {
        console.error("Failed to create global view in global view store", error);
        throw error;
      }
    }
  );

  override updateGlobalView = action(
    async (
      workspaceSlug: string,
      viewId: string,
      data: Partial<IWorkspaceView>
    ): Promise<IWorkspaceView | undefined> => {
      try {
        const response = await super.updateGlobalView(workspaceSlug, viewId, data);
        if (data.access === EViewAccess.PRIVATE) {
          await this.updateViewAccess(workspaceSlug, viewId, EViewAccess.PRIVATE);
        }
        return response;
      } catch (error) {
        console.error("Failed to update global view in global view store", error);
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
  lockView = async (workspaceSlug: string, viewId: string) => {
    try {
      const currentView = this.getViewDetailsById(viewId);
      if (currentView?.is_locked) return;
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], true);
      });
      await this.workspaceService.lockView(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to lock the view in view store", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], false);
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
  unLockView = async (workspaceSlug: string, viewId: string) => {
    try {
      const currentView = this.getViewDetailsById(viewId);
      if (!currentView?.is_locked) return;
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], false);
      });
      await this.workspaceService.unLockView(workspaceSlug, viewId);
    } catch (error) {
      console.error("Failed to unlock view in view store", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "is_locked"], true);
      });
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
  updateViewAccess = async (workspaceSlug: string, viewId: string, access: EViewAccess) => {
    const currentView = this.getViewDetailsById(viewId);
    const currentAccess = currentView?.access;
    try {
      runInAction(() => {
        set(this.globalViewMap, [viewId, "access"], access);
      });
      await this.workspaceService.updateViewAccess(workspaceSlug, viewId, access);
    } catch (error) {
      console.error("Failed to update Access for view", error);
      runInAction(() => {
        set(this.globalViewMap, [viewId, "access"], currentAccess);
      });
    }
  };
}
