/* eslint-disable no-useless-catch */

import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { API_BASE_URL, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { GitLabAuthorizeState } from "@plane/etl/gitlab";
// plane web services
import { GitlabAuthService } from "@/plane-web/services/integrations/gitlab";
// plane web store
import { IGitlabStore } from "@/plane-web/store/integrations";
// plane web types
import { TGitlabWorkspaceConnection } from "@/plane-web/types/integrations/gitlab";

export interface IGitlabAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TGitlabWorkspaceConnection>>; // workspaceId -> organizationId -> TGitlabWorkspaceConnection
  // computed
  workspaceConnectionIds: string[];
  // computed functions
  workspaceConnectionById: (organizationId: string) => TGitlabWorkspaceConnection | undefined;
  // actions
  fetchWorkspaceConnection: () => Promise<TGitlabWorkspaceConnection[] | undefined>;
  connectWorkspaceConnection: () => Promise<string | undefined>;
  disconnectWorkspaceConnection: () => Promise<void>;
}

export class GitlabAuthStore implements IGitlabAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TGitlabWorkspaceConnection>> = {}; // workspaceId -> organizationId -> TGitlabWorkspaceConnection
  // service
  private service: GitlabAuthService;

  constructor(protected store: IGitlabStore) {
    makeObservable(this, {
      // observables
      workspaceConnectionMap: observable,
      // computed
      workspaceConnectionIds: computed,
      // actions
      fetchWorkspaceConnection: action,
      connectWorkspaceConnection: action,
      disconnectWorkspaceConnection: action,
    });

    this.service = new GitlabAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
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
   * @description fetch gitlab organization
   * @returns { Promise<TGitlabWorkspaceConnection[] | undefined> }
   */
  fetchWorkspaceConnection = async (): Promise<TGitlabWorkspaceConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;

      if (!workspaceId) return undefined;

      const response = await this.service.fetchOrganizationConnection(workspaceId);
      if (response) {
        await this.store.fetchWebhookConnection(`${SILO_BASE_PATH}/api/gitlab/plane-webhook`);
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

      const payload: GitLabAuthorizeState = {
        user_id: userId,
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        plane_api_token: externalApiToken,
        gitlab_hostname: "gitlab.com",
        source_hostname: "gitlab.com",
        target_host: targetHostname,
      };
      const response = await this.service.connectOrganization(payload);
      await this.store.fetchWebhookConnection(`${SILO_BASE_PATH}/api/gitlab/plane-webhook`);
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
