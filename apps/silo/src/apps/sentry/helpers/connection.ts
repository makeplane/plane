import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createSentryService } from "@plane/etl/sentry";
import { env } from "@/env";
import { getConnectionDetails } from "@/helpers/connection-details";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { sentryAuth } from "../auth/auth";
import { getRefreshTokenCallback } from "./auth";

export const getSentryConnectionDetails = async (installationId: string) => {

  const details = await getConnectionDetails(E_INTEGRATION_KEYS.SENTRY, installationId)

  const { credential, workspaceConnection } = details;

  const planeClient = await getPlaneAPIClient(credential, E_INTEGRATION_KEYS.SENTRY);

  const sentryService = createSentryService({
    access_token: credential.source_access_token as string,
    refresh_token: credential.source_refresh_token as string,
    installation_id: installationId,
    refresh_callback: getRefreshTokenCallback(credential.id),
    auth_service: sentryAuth,
    base_url: env.SENTRY_BASE_URL,
  });

  return { planeClient, credential, workspaceConnection, sentryService };
};
