/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

/* oxlint-disable no-useless-catch */

import { unset, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import type { TBitbucketUserCredential, TBitbucketWorkspaceConnection } from "@plane/types";
import { BitbucketOAuthService } from "@/services/integrations/bitbucket-dc";
import { ApplicationService } from "@/services/marketplace";
import type { IBitbucketStore } from "./root.store";

export interface IBitbucketAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TBitbucketWorkspaceConnection>>;
  userCredentialsMap: Record<string, Record<string, TBitbucketUserCredential>>;
  // computed
  workspaceConnectionIds: string[];
  userCredentialIds: string[];
  // computed functions
  workspaceConnectionById: (connectionId: string) => TBitbucketWorkspaceConnection | undefined;
  userCredentialById: (userId: string) => TBitbucketUserCredential | undefined;
  // actions
  fetchWorkspaceConnection: () => Promise<TBitbucketWorkspaceConnection[] | undefined>;
  disconnectWorkspaceConnection: () => Promise<void>;
  fetchUserCredential: () => Promise<TBitbucketUserCredential | undefined>;
  disconnectUserCredential: () => Promise<void>;
  // OAuth methods
  fetchAppConfigKey: (config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    webhookSecret?: string;
  }) => Promise<string | undefined>;
  connectWorkspaceConnectionOAuth: () => Promise<string | undefined>;
  connectUserCredentialOAuth: () => Promise<string | undefined>;
}

export class BitbucketAuthStore implements IBitbucketAuthStore {
  // observables
  workspaceConnectionMap: Record<string, Record<string, TBitbucketWorkspaceConnection>> = {};
  userCredentialsMap: Record<string, Record<string, TBitbucketUserCredential>> = {};
  appConfigKey: string | null = null;
  // service
  private service: BitbucketOAuthService;
  private applicationService: ApplicationService;

  constructor(protected store: IBitbucketStore) {
    makeObservable(this, {
      workspaceConnectionMap: observable,
      userCredentialsMap: observable,
      appConfigKey: observable,
      workspaceConnectionIds: computed,
      userCredentialIds: computed,
      fetchWorkspaceConnection: action,
      disconnectWorkspaceConnection: action,
      fetchUserCredential: action,
      disconnectUserCredential: action,
      fetchAppConfigKey: action,
      connectWorkspaceConnectionOAuth: action,
      connectUserCredentialOAuth: action,
    });

    this.service = new BitbucketOAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
    this.applicationService = new ApplicationService();
  }

  get workspaceConnectionIds(): string[] {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId || !this.workspaceConnectionMap[workspaceId]) return [];
    return Object.keys(this.workspaceConnectionMap[workspaceId]);
  }

  get userCredentialIds(): string[] {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId || !this.userCredentialsMap[workspaceId]) return [];
    return Object.keys(this.userCredentialsMap[workspaceId]);
  }

  workspaceConnectionById = computedFn((connectionId: string) => {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId) return undefined;
    return this.workspaceConnectionMap[workspaceId]?.[connectionId] ?? undefined;
  });

  userCredentialById = computedFn((userId: string) => {
    const workspaceId = this.store.workspace?.id;
    if (!workspaceId) return undefined;
    return this.userCredentialsMap[workspaceId]?.[userId] ?? undefined;
  });

  fetchWorkspaceConnection = async (): Promise<TBitbucketWorkspaceConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      if (!workspaceId) return undefined;

      const response = await this.service.fetchOrganizationConnection(workspaceId);
      if (response) {
        await this.store.fetchWebhookConnection(`${SILO_BASE_PATH}/api/bitbucket-dc/plane-webhook`).catch(() => {});
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

  disconnectWorkspaceConnection = async (): Promise<void> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const connectionId = this.workspaceConnectionIds[0];
      const userId = this.store.user?.id;
      if (!workspaceId || !connectionId || !userId) return;

      const connection = this.workspaceConnectionById(connectionId);
      const externalConnectionId = connection?.connection_id;
      if (!externalConnectionId) return;

      await this.service.disconnectOrganization(workspaceId, externalConnectionId, userId);
      runInAction(() => unset(this.workspaceConnectionMap, [workspaceId]));
      await this.store.removeWebhookConnection();
    } catch (error) {
      throw error;
    }
  };

  fetchUserCredential = async (): Promise<TBitbucketUserCredential | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const userId = this.store.user?.id;
      if (!workspaceId || !userId) return undefined;

      const response = await this.service.fetchUserConnection(workspaceId, userId);
      if (response) {
        runInAction(() => {
          set(this.userCredentialsMap, [workspaceId, userId], response);
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  disconnectUserCredential = async (): Promise<void> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const userId = this.store.user?.id;
      if (!workspaceId || !userId) return;

      await this.service.disconnectUser(workspaceId, userId);
      runInAction(() => unset(this.userCredentialsMap, [workspaceId]));
    } catch (error) {
      throw error;
    }
  };

  fetchAppConfigKey = async (config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    webhookSecret?: string;
  }): Promise<string | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      if (!workspaceId) return undefined;

      const { configKey } = await this.service.fetchAppConfigKey(workspaceId, config);
      runInAction(() => {
        this.appConfigKey = configKey;
      });
      return configKey;
    } catch (error) {
      throw error;
    }
  };

  connectWorkspaceConnectionOAuth = async (): Promise<string | undefined> => {
    try {
      const userId = this.store.user?.id;
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const externalApiToken = this.store.externalApiToken;

      if (!userId || !workspaceId || !workspaceSlug || !externalApiToken || !this.appConfigKey) return undefined;

      const appDetails = await this.service.getPlaneAppDetails();
      const appInstallation = await this.applicationService.installApplication(workspaceSlug, appDetails.appId);

      const response = await this.service.getAuthUrl({
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        user_id: userId,
        plane_api_token: externalApiToken,
        plane_app_installation_id: appInstallation?.id,
        config_key: this.appConfigKey,
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  connectUserCredentialOAuth = async (): Promise<string | undefined> => {
    try {
      const userId = this.store.user?.id;
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const externalApiToken = this.store.externalApiToken;

      if (!userId || !workspaceId || !workspaceSlug || !externalApiToken) return undefined;

      const response = await this.service.getUserAuthUrl({
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        user_id: userId,
        plane_api_token: externalApiToken,
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
