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

import type { BitbucketService } from "@plane/etl/bitbucket";
import { createBitbucketService, createBitbucketOAuthService } from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type { TBitbucketWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { BitbucketIntegrationService } from "@/apps/bitbucket-dc/services/bitbucket-dc.service";

export const getBitbucketClientService = async (
  workspaceConnection: TBitbucketWorkspaceConnection
): Promise<BitbucketIntegrationService> => {
  const credential = await integrationConnectionHelper.getWorkspaceCredential({
    credential_id: workspaceConnection.credential_id,
  });

  const baseUrl = workspaceConnection.connection_data?.baseUrl || credential.source_hostname;
  if (!baseUrl || !credential.source_access_token) {
    throw new Error("Bitbucket credentials not found");
  }

  const appConfig = workspaceConnection.connection_data?.appConfig;

  if (appConfig && credential.source_refresh_token) {
    logger.info("[BITBUCKET] Creating OAuth-aware service with token refresh", {
      workspaceConnectionId: workspaceConnection.id,
    });

    return new BitbucketIntegrationService(baseUrl, credential.source_access_token, {
      refreshToken: credential.source_refresh_token,
      clientId: appConfig.clientId,
      clientSecret: appConfig.clientSecret,
      refreshCallback: async (accessToken, refreshToken) => {
        await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
          workspace_id: workspaceConnection.workspace_id,
          user_id: credential.user_id,
          source: E_INTEGRATION_KEYS.BITBUCKET_DC,
          source_access_token: accessToken,
          source_refresh_token: refreshToken,
          target_access_token: credential.target_access_token || "",
        });
      },
    });
  }

  return new BitbucketIntegrationService(baseUrl, credential.source_access_token);
};

export const buildBitbucketService = (
  baseUrl: string,
  credential: TWorkspaceCredential,
  connection: TBitbucketWorkspaceConnection
): BitbucketService => {
  const appConfig = connection.connection_data?.appConfig;
  if (appConfig && credential.source_refresh_token) {
    return createBitbucketOAuthService(
      baseUrl,
      credential.source_access_token!,
      credential.source_refresh_token,
      appConfig.clientId,
      appConfig.clientSecret,
      async (accessToken, refreshToken) => {
        await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
          workspace_id: connection.workspace_id,
          user_id: credential.user_id,
          source: E_INTEGRATION_KEYS.BITBUCKET_DC,
          source_access_token: accessToken,
          source_refresh_token: refreshToken,
          target_access_token: credential.target_access_token || "",
        });
      }
    );
  }
  return createBitbucketService(baseUrl, credential.source_access_token!);
};
