import set from "lodash/set";
import { action, computed, makeObservable, observable } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// types
import { TSentryConfig, TSentryConnectionData } from "@plane/etl/sentry";
import { TWorkspaceConnection } from "@plane/types";
// plane web services
// plane web store
import { SentryIntegrationService } from "@/plane-web/services/integrations/sentry/sentry.service";
import { ApplicationService } from "@/plane-web/services/marketplace";
import { RootStore } from "@/plane-web/store/root.store";
import { IntegrationBaseStore } from "../base.store";
// base integration store

export interface ISentryStore extends IntegrationBaseStore {
  // observables
  isAppConnectionLoading: boolean;
  appConnections: Record<string, TWorkspaceConnection<TSentryConfig, TSentryConnectionData>>;
  // computed
  isAppConnected: boolean;
  appConnectionIds: string[] | undefined;
  // helper actions
  getAppByConnectionId: (
    connectionId: string
  ) => TWorkspaceConnection<TSentryConfig, TSentryConnectionData> | undefined;
  // actions
  fetchAppConnections: (workspaceId?: string) => Promise<void>;
  connectApp: () => Promise<string>;
  disconnectApp: (connectionId: string) => Promise<string>;
  updateAppConnection: (
    connectionId: string,
    connection: TWorkspaceConnection<TSentryConfig, TSentryConnectionData>
  ) => Promise<void>;
}

export class SentryStore extends IntegrationBaseStore implements ISentryStore {
  // observables
  isAppConnectionLoading: boolean = true;
  appConnections: Record<string, TWorkspaceConnection<TSentryConfig, TSentryConnectionData>> = {}; // connection id -> app connection
  // service
  service: SentryIntegrationService;
  applicationService: ApplicationService;

  constructor(private rootStore: RootStore) {
    super(rootStore);

    makeObservable(this, {
      // observables
      isAppConnectionLoading: observable.ref,
      appConnections: observable,
      // computed
      isAppConnected: computed,
      appConnectionIds: computed,
      // actions
      fetchAppConnections: action,
      connectApp: action,
      disconnectApp: action,
      updateAppConnection: action,
    });

    // service instance
    this.service = new SentryIntegrationService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
    this.applicationService = new ApplicationService();
  }

  // computed
  get isAppConnected() {
    return Object.keys(this.appConnections).length > 0;
  }

  get appConnectionIds() {
    return Object.values(this.appConnections).map((appConnection) => appConnection.connection_id);
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
        response.forEach((appConnection) => {
          set(this.appConnections, appConnection.connection_id, appConnection);
        });
      }
    } finally {
      this.isAppConnectionLoading = false;
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
    if (!workspaceId || !workspaceSlug || !userId)
      throw new Error("Workspace ID, Workspace Slug, User ID are required");

    // get the plane app
    const appDetails = await this.service.getPlaneAppDetails();
    const appInstallation = await this.applicationService.installApplication(workspaceSlug, appDetails.appId);

    // Get the installed app id in plane and pass it
    const response = await this.service.getAppInstallationURL({
      workspaceId,
      workspaceSlug,
      userId,
      planeAppInstallationId: appInstallation.id,
    });

    /*
     We don't need to fetch the webhook connection, as with the new oauth flow, the
     webhook will be created and removed with the installation automatically.
     await this.fetchWebhookConnection(`${SILO_BASE_PATH}/api/sentry/plane/events`);
    */
    return response;
  };

  /**
   * @description disconnect the app
   * @param { string } connectionId - The connection ID
   * @returns { Promise<void> }
   */
  disconnectApp = async (connectionId: string): Promise<string> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");
    return await this.service.disconnectApp(workspaceId, connectionId);
  };

  /**
   * @description update the app connection
   * @param { string } connectionId - The connection ID
   * @param { TWorkspaceConnection<TSentryConfig, TSentryConnectionData> } connection - The updated connection
   * @returns { Promise<void> }
   */
  updateAppConnection = async (
    connectionId: string,
    connection: TWorkspaceConnection<TSentryConfig, TSentryConnectionData>
  ): Promise<void> => {
    const workspaceId = this.rootStore.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) throw new Error("Workspace ID is required");

    const response = await this.service.updateAppConnection(workspaceId, connectionId, connection);
    // Directly update the observable state - MobX will automatically update the UI
    set(this.appConnections, connectionId, response);
  };
}
