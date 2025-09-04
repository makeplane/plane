import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

export const getRefreshTokenCallback =
  (credential_id: string) => async (access_token: string, refresh_token: string) => {
    await integrationConnectionHelper.updateWorkspaceCredential({
      credential_id,
      source_access_token: access_token,
      source_refresh_token: refresh_token,
    });
  };
