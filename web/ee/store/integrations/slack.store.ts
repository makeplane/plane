import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// types
import { TSlackConfig, TSlackConnectionData } from "@plane/etl/slack";
import { TWorkspaceConnection } from "@plane/types";
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
  appConnections: Record<string, TWorkspaceConnection<TSlackConfig, TSlackConnectionData>>;
  isUserConnected: boolean;
  webhookConnection: Record<string, boolean>; // workspaceId -> boolean
  // computed
  isAppConnected: boolean;
  isWebhookConnected: boolean;
  appConnectionIds: string[] | undefined;
  // helper actions
  getAppByConnectionId: (connectionId: string) => TWorkspaceConnection<TSlackConfig, TSlackConnectionData> | undefined;
  // actions
  fetchAppConnections: (workspaceId?: string) => Promise<void>;
  fetchUserConnectionStatus: (workspaceId?: string) => Promise<void>;
  connectApp: () => Promise<string>;
  disconnectApp: (connectionId: string) => Promise<void>;
  connectUser: (workspaceId?: string, workspaceSlug?: string, profileRedirect?: boolean) => Promise<string>;
  disconnectUser: (workspaceId?: string) => Promise<void>;
}

export class SlackStore extends IntegrationBaseStore implements ISlackStore {
  // observables
  isAppConnectionLoading: boolean = true;
  isUserConnectionLoading: boolean = true;
  appConnections: Record<string, TWorkspaceConnection<TSlackConfig, TSlackConnectionData>> = {}; // connection id -> app connection
  isUserConnected: boolean = false;
  webhookConnection: Record<string, boolean> = {};
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
      webhookConnection: observable,
      // computed
      isAppConnected: computed,
      appConnectionIds: computed,
      isWebhookConnected: computed,
      // actions
      fetchAppConnections: action,
      fetchUserConnectionStatus: action,
      connectApp: action,
      disconnectApp: action,
      connectUser: action,
      disconnectUser: action,
      fetchWebhookConnection: action,
    });

    // service instance
    this.service = new SlackIntegrationService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  get isAppConnected() {
    return Object.keys(this.appConnections).length > 0;
  }

  get appConnectionIds() {
    return Object.values(this.appConnections).map((appConnection) => appConnection.connection_id);
  }

  /**
   * @description check if the webhook is connected
   * @returns { boolean }
   */
  get isWebhookConnected(): boolean {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) return false;
    return this.webhookConnection[workspaceId] || false;
  }

  // helper actions
  getAppByConnectionId = (connectionId: string) => this.appConnections[connectionId];

  // actions
  /**
   * @description fetch the app connections
   * @returns { Promise<void> }
   */
  fetchAppConnections = async (workspaceId?: string): Promise<void> => {
    this.isAppConnectionLoading = true;
    this.appConnections = {};
    try {
      const workspace = workspaceId ?? this.rootStore.workspaceRoot.currentWorkspace?.id;
      if (!workspace) throw new Error("Workspace ID is required");
      const response = await this.service.getAppConnection(workspace);
      if (response) {
        await this.fetchWebhookConnection(`${SILO_BASE_PATH}/api/slack/plane/events`);
        response.forEach((appConnection) => {
          set(this.appConnections, appConnection.connection_id, appConnection);
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
  fetchUserConnectionStatus = async (workspaceId?: string): Promise<void> => {
    this.isUserConnectionLoading = true;
    this.isUserConnected = false;
    try {
      const workspace = workspaceId ?? this.rootStore.workspaceRoot.currentWorkspace?.id;
      const userId = this.rootStore.user.data?.id;
      if (!workspace || !userId) throw new Error("Workspace ID and User ID are required");
      const response = await this.service.getUserConnectionStatus(workspace, userId);
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
    await this.fetchWebhookConnection(`${SILO_BASE_PATH}/api/slack/plane/events`);
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
    await this.removeWebhookConnection();
    runInAction(() => {
      delete this.appConnections[connectionId];
      if (this.appConnectionIds.length === 0) this.isUserConnected = false;
    });
  };

  /**
   * @description connect the user
   * @returns { Promise<void> }
   */
  connectUser = async (workspaceId?: string, workspaceSlug?: string, profileRedirect?: boolean): Promise<string> => {
    const workspace_id = workspaceId ?? this.rootStore.workspaceRoot.currentWorkspace?.id;
    const workspace_slug = workspaceSlug ?? this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const userId = this.rootStore.user.data?.id;
    if (!workspace_id || !workspace_slug || !userId)
      throw new Error("Workspace ID, Workspace Slug, User ID and External API Token are required");

    const response = await this.service.getUserConnectionURL({
      workspaceId: workspace_id,
      workspaceSlug: workspace_slug,
      profileRedirect,
      userId,
    });
    return response;
  };

  /**
   * @description disconnect the user
   * @returns { Promise<void> }
   */
  disconnectUser = async (workspaceId?: string): Promise<void> => {
    const workspace = workspaceId ?? this.rootStore.workspaceRoot.currentWorkspace?.id;
    const userId = this.rootStore.user.data?.id;
    if (!workspace || !userId) throw new Error("Workspace ID and User ID are required");
    await this.service.disconnectUser(workspace, userId);
    set(this, "isUserConnected", false);
  };
}
