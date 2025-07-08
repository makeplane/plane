// silo db
// silo asana
import { AsanaConfig, AsanaService, createAsanaService } from "@plane/etl/asana";
// silo core
import { TImportJob, TWorkspaceCredential } from "@plane/types";
// auth
import { createOrUpdateCredentials } from "@/helpers/credential";
import { asanaAuth } from "../auth/auth";
import { E_IMPORTER_KEYS } from "@plane/etl/core";

export const createAsanaClient = (job: TImportJob<AsanaConfig>, credentials: TWorkspaceCredential): AsanaService => {
  const refreshTokenCallback = async ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    await createOrUpdateCredentials(job.workspace_id, job.initiator_id, E_IMPORTER_KEYS.ASANA, {
      source_access_token: access_token,
      source_refresh_token: refresh_token,
    });
  };

  const refreshTokenRejectCallback = async () => {
    // Deactivate the credentials
    await createOrUpdateCredentials(job.workspace_id, job.initiator_id, E_IMPORTER_KEYS.ASANA, {
      is_active: false,
    });
  };

  return createAsanaService({
    accessToken: credentials.source_access_token!,
    refreshToken: credentials.source_refresh_token!,
    refreshTokenFunc: asanaAuth.getRefreshToken.bind(asanaAuth),
    refreshTokenCallback: refreshTokenCallback,
    refreshTokenRejectCallback: refreshTokenRejectCallback,
  });
};
