import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// types
import {
  SlackConversation,
  TSlackConfig,
  TSlackConnectionData,
  TSlackProjectUpdatesConfig,
  TSlackUserAlertsConfig,
} from "@plane/etl/slack";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";
// plane web services
import { SlackIntegrationService } from "@/plane-web/services/integrations/slack.service";
// plane web store
import { ApplicationService } from "@/plane-web/services/marketplace/application.service";
import { RootStore } from "@/plane-web/store/root.store";
// base integration store
import { IntegrationBaseStore } from "./base.store";

export interface ISlackStore extends IntegrationBaseStore {
  // observables
  isAppConnectionLoading: boolean;
  isUserConnectionLoading: boolean;
  appConnections: Record<string, TWorkspaceConnection<TSlackConfig, TSlackConnectionData>>;
  projectConnections: Record<string, TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[]>;
  isUserConnected: boolean;
  webhookConnection: Record<string, boolean>; // workspaceId -> boolean
  // computed
  isAppConnected: boolean;
  isWebhookConnected: boolean;
  appConnectionIds: string[] | undefined;
  // helper actions
  getAppByConnectionId: (connectionId: string) => TWorkspaceConnection<TSlackConfig, TSlackConnectionData> | undefined;
  getProjectConnectionsByWorkspaceId: (
    workspaceId: string
  ) => TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[] | undefined;
  // actions
  fetchAppConnections: (workspaceId?: string) => Promise<void>;
  fetchProjectConnections: (workspaceId?: string) => Promise<void>;
  createProjectConnection: (projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>) => Promise<void>;
  updateProjectConnection: (
    id: string,
    projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>
  ) => Promise<void>;
  deleteProjectConnection: (id: string) => Promise<void>;
  fetchUserConnectionStatus: (workspaceId?: string) => Promise<void>;
  fetchSlackChannels: (connectionId: string) => Promise<SlackConversation[]>;
  fetchUserAlertsConfig: () => Promise<TSlackUserAlertsConfig>;
  setUserAlertsConfig: (payload: TSlackUserAlertsConfig) => Promise<TSlackUserAlertsConfig>;
  connectApp: () => Promise<string>;
  disconnectApp: (connectionId: string) => Promise<void>;
  connectUser: (workspaceId?: string, workspaceSlug?: string, profileRedirect?: boolean) => Promise<string>;
  disconnectUser: (workspaceId?: string) => Promise<void>;
}

export class SlackStore extends IntegrationBaseStore implements ISlackStore {
  // observables
  isAppConnectionLoading: boolean = true;
  isUserConnectionLoading: boolean = true;
  // Connections
  appConnections: Record<string, TWorkspaceConnection<TSlackConfig, TSlackConnectionData>> = {}; // connection id -> app connection
  projectConnections: Record<string, TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[]> = {}; // workspaceId -> project connections
  // Status
  isUserConnected: boolean = false;
  webhookConnection: Record<string, boolean> = {};
  // service
  service: SlackIntegrationService;
  applicationService: ApplicationService;

  constructor(private rootStore: RootStore) {
    super(rootStore);

    makeObservable(this, {
      // observables
      isAppConnectionLoading: observable.ref,
      isUserConnectionLoading: observable.ref,
      appConnections: observable,
      projectConnections: observable,
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
    this.applicationService = new ApplicationService();
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
  getProjectConnectionsByWorkspaceId = (workspaceId: string) => this.projectConnections[workspaceId];

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

    // get the plane app
    const appDetails = await this.service.getPlaneAppDetails();
    const appInstallation = await this.applicationService.installApplication(workspaceSlug, appDetails.appId);

    const response = await this.service.getAppInstallationURL({
      apiToken: this.externalApiToken,
      workspaceId,
      workspaceSlug,
      userId,
      plane_app_installation_id: appInstallation?.id,
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
      apiToken: this.externalApiToken,
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

  /**
   * @description fetch the projects
   * @returns { Promise<void> }
   */
  fetchProjectConnections = async (): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    const response = await this.service.getProjectConnections(workspaceId);
    set(this, ["projectConnections", workspaceId], response);
  };

  /**
   * @description create the project connection
   * @param { TWorkspaceEntityConnection<TSlackProjectUpdatesConfig> } projectConnection - The project connection
   * @returns { Promise<void> }
   */
  createProjectConnection = async (
    projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>
  ): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    const response = await this.service.createProjectConnection(workspaceId, projectConnection);
    set(this, ["projectConnections", workspaceId], [...this.projectConnections[workspaceId], response]);
  };

  /**
   * @description update the project connection
   * @param { TWorkspaceEntityConnection<TSlackProjectUpdatesConfig> } projectConnection - The project connection
   * @returns { Promise<void> }
   */
  updateProjectConnection = async (
    id: string,
    projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>
  ): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    const response = await this.service.updateProjectConnection(id, projectConnection);
    set(
      this,
      ["projectConnections", workspaceId],
      this.projectConnections[workspaceId].map((pc) => (pc.id === id ? response : pc))
    );
  };

  /**
   * @description delete the project connection
   * @param { string } id - The project connection ID
   * @returns { Promise<void> }
   */
  deleteProjectConnection = async (id: string): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    await this.service.deleteProjectConnection(id);
    set(
      this,
      ["projectConnections", workspaceId],
      this.projectConnections[workspaceId].filter((pc) => pc.id !== id)
    );
  };

  /**
   * @description fetch the user alerts config
   * @returns { Promise<TSlackUserAlertsConfig> }
   */
  fetchUserAlertsConfig = async (): Promise<TSlackUserAlertsConfig> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    const userId = this.rootStore.user.data?.id;
    if (!workspaceId || !userId) throw new Error("Workspace ID and User ID are required");
    const response = await this.service.getUserAlertsConfig(workspaceId, userId);
    return response;
  };

  /**
   * @description set the user alerts config
   * @param { TSlackUserAlertsConfig } payload - The user alerts config
   * @returns { Promise<TSlackUserAlertsConfig> }
   */
  setUserAlertsConfig = async (payload: TSlackUserAlertsConfig): Promise<TSlackUserAlertsConfig> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    const userId = this.rootStore.user.data?.id;
    if (!workspaceId || !userId) throw new Error("Workspace ID and User ID are required");
    const response = await this.service.setUserAlertsConfig(workspaceId, userId, payload);
    return response;
  };

  /**
   * description fetch the channels
   * @param { string } connectionId - The connection ID
   * @returns { Promise<SlackConversation[]> }
   */
  fetchSlackChannels = async (connectionId: string): Promise<SlackConversation[]> => {
    const response = await this.service.getChannels(connectionId, { onlyChannels: true });
    return response;
  };
}
