import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { env } from "@/env";
import { convertIntegrationKeyToProvider } from "@/services/oauth/helpers";

export const getGitlabEntityWebhookURL = (workspaceId: string, glIntegrationKey: E_INTEGRATION_KEYS) => {
  const provider = convertIntegrationKeyToProvider(glIntegrationKey);
  return `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/${provider}/webhook/${workspaceId}`;
};

export const getGitlabAuthCallbackURL = (glIntegrationKey: E_INTEGRATION_KEYS) => {
  const provider = convertIntegrationKeyToProvider(glIntegrationKey);
  return encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + `/api/oauth/${provider}/auth/callback`);
};
