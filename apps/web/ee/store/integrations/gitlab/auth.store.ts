/* eslint-disable no-useless-catch */

import { unset, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { API_BASE_URL, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { GitLabAuthorizeState } from "@plane/etl/gitlab";
// plane web services
import { TGitlabWorkspaceConnection, TGitlabAppConfig } from "@plane/types";
import { GitlabAuthService } from "@/plane-web/services/integrations/gitlab";
// plane web store
import { ApplicationService } from "@/plane-web/services/marketplace";
import { IGitlabStore } from "@/plane-web/store/integrations";
// plane web types

export interface IGitlabAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TGitlabWorkspaceConnection>>; // workspaceId -> organizationId -> TGitlabWorkspaceConnection
  appConfigKey: string; // configKey
  // computed
  workspaceConnectionIds: string[];
  // computed functions
  workspaceConnectionById: (organizationId: string) => TGitlabWorkspaceConnection | undefined;
  // actions
  fetchWorkspaceConnection: () => Promise<TGitlabWorkspaceConnection[] | undefined>;
  fetchAppConfigKey: (config: TGitlabAppConfig) => Promise<string | undefined>;
  connectWorkspaceConnection: () => Promise<string | undefined>;
  disconnectWorkspaceConnection: () => Promise<void>;
}

export class GitlabAuthStore implements IGitlabAuthStore {
  // observables
  appConfigKey: string = ""; // configKey
  workspaceConnectionMap: Record<string, Record<string, TGitlabWorkspaceConnection>> = {}; // workspaceId -> organizationId -> TGitlabWorkspaceConnection
  // service
  private service: GitlabAuthService;
  private applicationService: ApplicationService;
  private isEnterprise: boolean;

  constructor(
    protected store: IGitlabStore,
    isEnterprise: boolean = false
  ) {
    makeObservable(this, {
      // observables
      workspaceConnectionMap: observable,
      appConfigKey: observable,
      // computed
      workspaceConnectionIds: computed,
      // actions
      fetchWorkspaceConnection: action,
      fetchAppConfigKey: action,
      connectWorkspaceConnection: action,
      disconnectWorkspaceConnection: action,
    });

    this.isEnterprise = isEnterprise;
    this.service = new GitlabAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), isEnterprise);
    this.applicationService = new ApplicationService();
  }

  // computed
  /**
   * @description get organization ids
   * @returns { string[] }
   */
  get workspaceConnectionIds(): string[] {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId || !this.workspaceConnectionMap[workspaceId]) return [];

    return Object.keys(this.workspaceConnectionMap[workspaceId]) || [];
  }

  // computed functions
  /**
   * @description get gitlab organization by id
   * @param { string } organizationId
   * @returns { object | undefined }
   */
  workspaceConnectionById = computedFn((organizationId: string) => {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId) return undefined;

    return this.workspaceConnectionMap[workspaceId][organizationId] || undefined;
  });

  // actions
  /**
   * @description fetch app config key - will call this before connecting to the organization
   * @param { TGitlabAppConfig } config
   * @returns { Promise<void> }
   */
  fetchAppConfigKey = async (config: TGitlabAppConfig): Promise<string | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      if (!workspaceId) return;

      const { configKey } = await this.service.fetchAppConfigKey(workspaceId, config);
      runInAction(() => {
        this.appConfigKey = configKey;
      });
      return configKey;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  /**
   * @description fetch gitlab organization
   * @returns { Promise<TGitlabWorkspaceConnection[] | undefined> }
   */
  fetchWorkspaceConnection = async (): Promise<TGitlabWorkspaceConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;

      if (!workspaceId) return undefined;

      const response = await this.service.fetchOrganizationConnection(workspaceId);
      if (response) {
        await this.store.fetchWebhookConnection(
          `${SILO_BASE_PATH}/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/plane-webhook`
        );
        runInAction(() => {
          response.forEach((data) => {
            if (data.id) set(this.workspaceConnectionMap, [workspaceId, data.id], data);
          });
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description connect gitlab organization
   * @returns { Promise<string | undefined> }
   */
  connectWorkspaceConnection = async (): Promise<string | undefined> => {
    try {
      const userId = this.store.user?.id;
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const externalApiToken = this.store.externalApiToken;
      const targetHostname = API_BASE_URL;

      if (!userId || !workspaceId || !workspaceSlug || !externalApiToken) return undefined;

      let config_key: string | undefined;

      if (this.isEnterprise) {
        if (!this.appConfigKey) {
          console.error("App config key is required");
          return undefined;
        }
        config_key = this.appConfigKey;
      }

      // get the plane app
      const appDetails = await this.service.getPlaneAppDetails();
      const appInstallation = await this.applicationService.installApplication(workspaceSlug, appDetails.appId);

      const payload: GitLabAuthorizeState = {
        user_id: userId,
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        plane_api_token: externalApiToken,
        gitlab_hostname: "gitlab.com",
        source_hostname: "gitlab.com",
        target_host: targetHostname,
        plane_app_installation_id: appInstallation.id,
        config_key: config_key,
      };
      const response = await this.service.connectOrganization(payload);
      await this.store.fetchWebhookConnection(
        `${SILO_BASE_PATH}/api/${this.isEnterprise ? "gitlab-enterprise" : "gitlab"}/plane-webhook`
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description disconnect gitlab organization
   * @returns { Promise<void> }
   */
  disconnectWorkspaceConnection = async (): Promise<void> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const organizationId = this.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !organizationId) return undefined;

      const organization = this.workspaceConnectionById(organizationId) || undefined;
      const connectionId = organization?.connection_id || undefined;

      if (!connectionId) return undefined;

      await this.service.disconnectOrganization(workspaceId, connectionId);
      runInAction(() => unset(this.workspaceConnectionMap, [workspaceId]));
      await this.store.removeWebhookConnection();

      return undefined;
    } catch (error) {
      throw error;
    }
  };
}
