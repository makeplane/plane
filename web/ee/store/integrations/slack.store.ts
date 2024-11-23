import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// constants
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// types
import { TAppConnection } from "@silo/slack";
// plane web services
import { SlackIntegrationService } from "@/plane-web/services/integrations/slack.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// base integration store
import { IntegrationBaseStore } from "./base.store";

export interface ISlackStore extends IntegrationBaseStore {
  // observables
  isAppConnectionLoading: boolean;
  isUserConnectionLoading: boolean;
  appConnections: Record<string, TAppConnection>;
  isUserConnected: boolean;
  // computed
  isAppConnected: boolean;
  appConnectionIds: string[] | undefined;
  // helper actions
  getAppByConnectionId: (connectionId: string) => TAppConnection | undefined;
  // actions
  fetchAppConnections: () => Promise<void>;
  fetchUserConnectionStatus: () => Promise<void>;
  connectApp: () => Promise<string>;
  disconnectApp: (connectionId: string) => Promise<void>;
  connectUser: () => Promise<string>;
  disconnectUser: () => Promise<void>;
}

export class SlackStore extends IntegrationBaseStore implements ISlackStore {
  // observables
  isAppConnectionLoading: boolean = true;
  isUserConnectionLoading: boolean = true;
  appConnections: Record<string, TAppConnection> = {}; // connection id -> app connection
  isUserConnected: boolean = false;
  // service
  service: SlackIntegrationService;

  constructor(private rootStore: RootStore) {
    super(rootStore);

    makeObservable(this, {
      // observables
      isAppConnectionLoading: observable.ref,
      isUserConnectionLoading: observable.ref,
      appConnections: observable,
      isUserConnected: observable,
      // computed
      isAppConnected: computed,
      appConnectionIds: computed,
      // actions
      fetchAppConnections: action,
      fetchUserConnectionStatus: action,
      connectApp: action,
      disconnectApp: action,
      connectUser: action,
      disconnectUser: action,
    });

    // service instance
    this.service = new SlackIntegrationService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  get isAppConnected() {
    return Object.keys(this.appConnections).length > 0;
  }

  get appConnectionIds() {
    return Object.values(this.appConnections).map((appConnection) => appConnection.connectionId);
  }

  // helper actions
  getAppByConnectionId = (connectionId: string) => this.appConnections[connectionId];

  // actions
  /**
   * @description fetch the app connections
   * @returns { Promise<void> }
   */
  fetchAppConnections = async (): Promise<void> => {
    this.isAppConnectionLoading = true;
    try {
      const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
      if (!workspaceId) throw new Error("Workspace ID is required");
      const response = await this.service.getAppConnection(workspaceId);
      if (response) {
        response.forEach((appConnection) => {
          set(this.appConnections, appConnection.connectionId, appConnection);
        });
      }
    } finally {
      this.isAppConnectionLoading = false;
    }
  };

  /**
   * @description fetch the user connection status
   * @returns { Promise<void> }
   */
  fetchUserConnectionStatus = async (): Promise<void> => {
    this.isUserConnectionLoading = true;
    try {
      const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
      const userId = this.rootStore.user.data?.id;
      if (!workspaceId || !userId) throw new Error("Workspace ID and User ID are required");
      const response = await this.service.getUserConnectionStatus(workspaceId, userId);
      this.isUserConnected = response.isConnected;
    } finally {
      this.isUserConnectionLoading = false;
    }
  };

  /**
   * @description connect the app
   * @returns { Promise<void> }
   */
  connectApp = async (): Promise<string> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const userId = this.rootStore.user.data?.id;
    if (!workspaceId || !workspaceSlug || !userId || !this.externalApiToken)
      throw new Error("Workspace ID, Workspace Slug, User ID and External API Token are required");
    const response = await this.service.getAppInstallationURL({
      apiToken: this.externalApiToken,
      workspaceId,
      workspaceSlug,
      userId,
    });
    return response;
  };

  /**
   * @description disconnect the app
   * @param { string } connectionId - The connection ID
   * @returns { Promise<void> }
   */
  disconnectApp = async (connectionId: string): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    await this.service.disconnectApp(workspaceId, connectionId);
    runInAction(() => {
      delete this.appConnections[connectionId];
      if (this.appConnectionIds.length === 0) this.isUserConnected = false;
    });
  };

  /**
   * @description connect the user
   * @returns { Promise<void> }
   */
  connectUser = async (): Promise<string> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const userId = this.rootStore.user.data?.id;
    if (!workspaceId || !workspaceSlug || !userId || !this.externalApiToken)
      throw new Error("Workspace ID, Workspace Slug, User ID and External API Token are required");
    const response = await this.service.getUserConnectionURL({
      apiToken: this.externalApiToken,
      workspaceId,
      workspaceSlug,
      userId,
    });
    return response;
  };

  /**
   * @description disconnect the user
   * @returns { Promise<void> }
   */
  disconnectUser = async (): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    const userId = this.rootStore.user.data?.id;
    if (!workspaceId || !userId) throw new Error("Workspace ID and User ID are required");
    await this.service.disconnectUser(workspaceId, userId);
    set(this, "isUserConnected", false);
  };
}
