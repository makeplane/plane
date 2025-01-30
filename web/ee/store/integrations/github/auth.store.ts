/* eslint-disable no-useless-catch */

import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { API_BASE_URL, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { GithubAuthorizeState, GithubUserAuthState } from "@plane/etl/github";
// plane web services
import { GithubAuthService } from "@/plane-web/services/integrations/github";
// plane web store
import { IGithubStore } from "@/plane-web/store/integrations";
// plane web types
import { TGithubWorkspaceConnection, TGithubWorkspaceUserConnection } from "@/plane-web/types/integrations";

export interface IGithubAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TGithubWorkspaceConnection>>; // workspaceId -> organizationId -> TGithubWorkspaceConnection
  githubUserCredentialsMap: Record<string, Record<string, TGithubWorkspaceUserConnection>>; // workspaceId -> userId -> TGithubWorkspaceUserConnection
  // computed
  workspaceConnectionIds: string[];
  githubUserCredentialIds: string[];
  // computed functions
  workspaceConnectionById: (organizationId: string) => TGithubWorkspaceConnection | undefined;
  githubUserCredentialById: (userId: string) => TGithubWorkspaceUserConnection | undefined;
  // actions
  fetchWorkspaceConnection: () => Promise<TGithubWorkspaceConnection[] | undefined>;
  connectWorkspaceConnection: () => Promise<string | undefined>;
  disconnectWorkspaceConnection: () => Promise<void>;
  fetchGithubUserCredential: (
    workspace_id?: string,
    user_id?: string
  ) => Promise<TGithubWorkspaceUserConnection | undefined>;
  connectGithubUserCredential: (
    workspace_id?: string,
    workspace_slug?: string,
    user_id?: string,
    profileRedirect?: boolean
  ) => Promise<string | undefined>;
  disconnectGithubUserCredential: (workspace_id?: string, user_id?: string) => Promise<void>;
}

export class GithubAuthStore implements IGithubAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TGithubWorkspaceConnection>> = {}; // workspaceId -> organizationId -> TGithubWorkspaceConnection
  githubUserCredentialsMap: Record<string, Record<string, TGithubWorkspaceUserConnection>> = {}; // workspaceId -> userId -> TGithubWorkspaceUserConnection
  // service
  private service: GithubAuthService;

  constructor(protected store: IGithubStore) {
    makeObservable(this, {
      // observables
      workspaceConnectionMap: observable,
      githubUserCredentialsMap: observable,
      // computed
      workspaceConnectionIds: computed,
      githubUserCredentialIds: computed,
      // actions
      fetchWorkspaceConnection: action,
      connectWorkspaceConnection: action,
      disconnectWorkspaceConnection: action,
      fetchGithubUserCredential: action,
      connectGithubUserCredential: action,
      disconnectGithubUserCredential: action,
    });

    this.service = new GithubAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
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

  /**
   * @description get user ids
   * @returns { string[] }
   */
  get githubUserCredentialIds(): string[] {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId || !this.githubUserCredentialsMap[workspaceId]) return [];

    return Object.keys(this.githubUserCredentialsMap[workspaceId]) || [];
  }

  // computed functions
  /**
   * @description get github organization by id
   * @param { string } organizationId
   * @returns { object | undefined }
   */
  workspaceConnectionById = computedFn((organizationId: string) => {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId) return undefined;

    return this.workspaceConnectionMap[workspaceId][organizationId] || undefined;
  });

  /**
   * @description get github user by id
   * @param { string } userId
   * @returns { object | undefined }
   */
  githubUserCredentialById = computedFn((userId: string) => {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId) return undefined;

    return this.githubUserCredentialsMap[workspaceId][userId] || undefined;
  });

  // actions
  /**
   * @description fetch github organization
   * @returns { Promise<TGithubWorkspaceConnection[] | undefined> }
   */
  fetchWorkspaceConnection = async (): Promise<TGithubWorkspaceConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;

      if (!workspaceId) return undefined;

      const response = await this.service.fetchOrganizationConnection(workspaceId);
      if (response) {
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
   * @description connect github organization
   * @returns { Promise<string | undefined> }
   */
  connectWorkspaceConnection = async (): Promise<string | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const externalApiToken = this.store.externalApiToken;
      const targetHostname = API_BASE_URL;
      const userId = this.store.user?.id;

      if (!workspaceId || !workspaceSlug || !externalApiToken || !userId) return undefined;

      const payload: GithubAuthorizeState = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        plane_api_token: externalApiToken,
        target_host: targetHostname,
        user_id: userId,
      };
      const response = await this.service.connectOrganization(payload);
      await this.store.fetchWebhookConnection(`${SILO_BASE_PATH}/api/github/plane-webhook`);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description disconnect github organization
   * @returns { Promise<void> }
   */
  disconnectWorkspaceConnection = async (): Promise<void> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const organizationId = this.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !organizationId) return undefined;

      const organization = this.workspaceConnectionById(organizationId) || undefined;
      const connectionId = organization?.connectionId || undefined;

      if (!connectionId) return undefined;

      await this.service.disconnectOrganization(workspaceId, connectionId);
      runInAction(() => unset(this.workspaceConnectionMap, [workspaceId]));

      return undefined;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch github user
   * @returns { Promise<TGithubWorkspaceUserConnection | undefined> }
   */
  fetchGithubUserCredential = async (
    workspace_id?: string,
    user_id?: string
  ): Promise<TGithubWorkspaceUserConnection | undefined> => {
    try {
      const workspaceId = workspace_id ?? this.store.workspace?.id;
      const userId = user_id ?? this.store.user?.id;

      if (!workspaceId || !userId) return undefined;

      const response = await this.service.fetchUserConnection(workspaceId, userId);

      if (response) {
        runInAction(() => {
          if (response) set(this.githubUserCredentialsMap, [workspaceId, userId], response);
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description connect github user
   * @returns { Promise<string | undefined> }
   */
  connectGithubUserCredential = async (
    workspace_id?: string,
    workspace_slug?: string,
    user_id?: string,
    profileRedirect?: boolean
  ): Promise<string | undefined> => {
    try {
      const workspaceId = workspace_id ?? this.store.workspace?.id;
      const workspaceSlug = workspace_slug ?? this.store.workspace?.slug;
      const userId = user_id ?? this.store.user?.id;
      const targetHostname = API_BASE_URL;

      if (!workspaceId || !workspaceSlug || !userId) return undefined;

      const payload: GithubUserAuthState = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        profile_redirect: profileRedirect,
        user_id: userId,
        target_host: targetHostname,
      };

      const response = await this.service.connectUser(payload);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description disconnect github user
   * @returns { Promise<void> }
   */
  disconnectGithubUserCredential = async (workspace_id?: string, user_id?: string): Promise<void> => {
    try {
      const workspaceId = workspace_id ?? this.store.workspace?.id;
      const userId = user_id ?? this.store.user?.id;

      if (!workspaceId || !userId) return undefined;

      await this.service.disconnectUser(workspaceId, userId);
      runInAction(() => unset(this.githubUserCredentialsMap, [workspaceId]));

      return undefined;
    } catch (error) {
      throw error;
    }
  };
}
