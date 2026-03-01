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

import type { TAppKeys } from "@plane/etl/core";
import { FeatureFlagService } from "@plane/etl/core";
import { logger } from "@plane/logger";
import { Client as PlaneClient } from "@plane/sdk";
import type { TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { planeOAuthService } from "@/services/oauth/auth";

/**
 * Get a Plane API client for the given credential with backward compatibility for the target access token
 * @param credential - The workspace credential for the application connection
 * @param appName - The name of the app
 */
export const getPlaneAPIClient = async (credential: TWorkspaceCredential, appName: TAppKeys): Promise<PlaneClient> => {
  try {
    const baseURL = env.API_INTERNAL_BASE_URL || env.API_BASE_URL;
    // checks if the credential is not an OAuth credential
    if (!credential.target_authorization_type) {
      if (!credential.target_access_token) {
        throw new Error(`Target access token not found for the given credential ${credential.id}`);
      }
      return new PlaneClient({
        baseURL,
        apiToken: credential.target_access_token,
      });
    }

    // For OAuth credential, get the access token from the Plane OAuth service
    const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(appName);
    if (!planeAppClientId || !planeAppClientSecret) {
      throw new Error(`Plane app client ID or client secret not found for the given app ${appName}`);
    }
    const token = await planeOAuthService.getOAuthToken(credential, planeAppClientId, planeAppClientSecret);

    if (!token.access_token) {
      throw new Error(`OAuth access token not found for the given credential ${credential.id}`);
    }

    return new PlaneClient({
      baseURL,
      bearerToken: token.access_token,
    });
  } catch (error) {
    logger.error(`Error getting Plane API client for the given credential ${credential.id}: ${error}`);
    throw error;
  }
};

export const getPlaneFeatureFlagService = async (): Promise<FeatureFlagService> => {
  const featureFlagService = new FeatureFlagService(env.FEATURE_FLAG_SERVER_BASE_URL || "", {
    x_api_key: env.FEATURE_FLAG_SERVER_AUTH_TOKEN || "",
  });
  return featureFlagService;
};
