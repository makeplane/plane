import set from "lodash/set";
import { action, autorun, computed, makeObservable, observable, runInAction } from "mobx";
import { IUser, IWorkspace, TWorkspaceNotificationTransport, TWorkspaceUserNotification } from "@plane/types";
// plane web services
// plane web root store
import { WorkspaceNotificationSettingsService } from "@/services/workspace-notification-settings.service";
import { CoreRootStore } from "../root.store";

export interface IWorkspaceNotificationSettingsStore {
  // observables
  error: object;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
  settings: Record<string, Record<TWorkspaceNotificationTransport, TWorkspaceUserNotification>>; // workspaceSlug -> transport -> settings
  // computed functions
  notificationSettingsForWorkspace: Record<string, TWorkspaceUserNotification> | undefined;
  getNotificationSettingsForTransport: (
    transport: TWorkspaceNotificationTransport
  ) => TWorkspaceUserNotification | undefined;
  // helper actions
  fetchWorkspaceUserNotificationSettings: () => Promise<TWorkspaceUserNotification[] | undefined>;
  updateWorkspaceUserNotificationSettings: (
    transport: TWorkspaceNotificationTransport,
    settings: Partial<TWorkspaceUserNotification>
  ) => Promise<TWorkspaceUserNotification | undefined>;
}

export class WorkspaceNotificationSettingsStore implements IWorkspaceNotificationSettingsStore {
  // observables
  error: object = {};
  user: IUser | undefined = undefined;
  workspace: IWorkspace | undefined = undefined;
  settings: Record<string, Record<TWorkspaceNotificationTransport, TWorkspaceUserNotification>> = {};
  settingService: WorkspaceNotificationSettingsService;

  constructor(public store: CoreRootStore) {
    makeObservable(this, {
      // observables
      error: observable,
      user: observable,
      workspace: observable,
      settings: observable,
      // //computed
      notificationSettingsForWorkspace: computed,
      getNotificationSettingsForTransport: computed,
      // actions
      fetchWorkspaceUserNotificationSettings: action,
      updateWorkspaceUserNotificationSettings: action,
    });


    autorun(() => {
      const {
        workspaceRoot: { currentWorkspace },
        user: { data: currentUser },
      } = this.store;

      if (
        currentWorkspace &&
        currentUser &&
        (!this.workspace ||
          !this.user ||
          this.workspace?.id !== currentWorkspace?.id ||
          this.user?.id !== currentUser?.id)
      ) {
        this.user = currentUser;
        this.workspace = currentWorkspace;
      }
    });

    this.settingService = new WorkspaceNotificationSettingsService();
  }

  // computed functions
  /**
   * @description get project ids by workspace slug
   * @param { string } workspaceSlug
   * @returns { string[] | undefined }
   */
  get notificationSettingsForWorkspace() {
    const workspaceSlug = this.store.workspaceRoot?.currentWorkspace?.slug;
    if (!workspaceSlug) {
      return;
    }
    return this.settings[workspaceSlug];
  }


  /**
   * @description get notification settings for the workspace for a transport
   * @param { TWorkspaceNotificationTransport } transport
   * @returns { TWorkspaceUserNotification }
   */

  getNotificationSettingsForTransport(transport: TWorkspaceNotificationTransport) {
    const workspaceSlug = this.store.workspaceRoot?.currentWorkspace?.slug;
    if (!workspaceSlug || !transport) {
      return;
    }
    return this.settings[workspaceSlug]?.[transport] || undefined;
  }

  // helper actions
  /**
   * @description handle states
   * @returns { TWorkspaceUserNotification[] | undefined }
   */
  fetchWorkspaceUserNotificationSettings = async (): Promise<TWorkspaceUserNotification[] | undefined> => {

    console.log("inside fetchWorkspace")
    const workspaceSlug = this.store.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) return undefined;

    this.error = {};
    try {
      const notificationSettings = await this.settingService.fetchNotificationSettings(workspaceSlug)
      if (notificationSettings) {
        runInAction(() => {
          notificationSettings.forEach((state) => {
            const { transport } = state;
            set(this.settings, [workspaceSlug, transport], state);
          });
        });
      }
      return notificationSettings;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
      });
      throw error;
    }
  };

  /**
   * @description - updates user notification settings for a transport
   * @param transport
   * @param settings
   * @returns { TWorkspaceNotificationTransport }
   */
  updateWorkspaceUserNotificationSettings = async (
    transport: TWorkspaceNotificationTransport,
    settings: Partial<TWorkspaceUserNotification>): Promise<TWorkspaceUserNotification | undefined> => {

    const workspaceSlug = this.store.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug || !transport || !settings) {
      return undefined;
    }

    try {
      const notificationSetting = await this.settingService.updateNotificationSettings(workspaceSlug, transport, settings)
      if (notificationSetting) {
        runInAction(() => {
          set(this.settings, [workspaceSlug, transport], notificationSetting)
        })
      }
      return notificationSetting;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
      });
      throw error;
    }

  };
}
