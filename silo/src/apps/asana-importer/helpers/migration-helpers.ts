// silo db
import {
  createOrUpdateCredentials,
  deactivateCredentials,
  getCredentialsByWorkspaceId,
  getJobById,
  updateJob,
} from "@/db/query";
// silo asana
import { AsanaConfig, AsanaService, createAsanaService } from "@silo/asana";
// silo core
import { TJobWithConfig, TServiceCredentials } from "@silo/core";
// auth
import { asanaAuth } from "../auth/auth";

export async function getJobData(jobId: string): Promise<TJobWithConfig<AsanaConfig>> {
  const [jobData] = await getJobById(jobId);
  if (!jobData) {
    throw new Error(`[${jobId.slice(0, 7)}] No job data or metadata found. Exiting...`);
  }
  validateJobData(jobData as unknown as TJobWithConfig<AsanaConfig>, jobId);
  return jobData as unknown as TJobWithConfig<AsanaConfig>;
}

export function validateJobData(jobData: TJobWithConfig<AsanaConfig>, jobId: string): void {
  if (!jobData.workspace_id || !jobData.migration_type) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing workspace id. Exiting...`);
  }
  if (!jobData.initiator_id) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing initiator id. Exiting...`);
  }
  if (!jobData.config) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing job config. Exiting...`);
  }
}

export const resetJobIfStarted = async (jobId: string, job: TJobWithConfig<AsanaConfig>) => {
  if (job.start_time) {
    await updateJob(jobId, {
      total_batch_count: 0,
      completed_batch_count: 0,
      transformed_batch_count: 0,
      end_time: undefined,
      error: "",
    });
  }
};

export const getJobCredentials = async (job: TJobWithConfig<AsanaConfig>): Promise<TServiceCredentials> => {
  const credentials = await getCredentialsByWorkspaceId(job.workspace_id!, job.initiator_id!, "ASANA");
  if (!credentials || credentials.length === 0) {
    throw new Error(`Credentials not available for job ${job.workspace_id}`);
  }
  return credentials[0] as TServiceCredentials;
};

export const createAsanaClient = (job: TJobWithConfig<AsanaConfig>, credentials: TServiceCredentials): AsanaService => {
  const refreshTokenCallback = async ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    await createOrUpdateCredentials(job.workspace_id, job.initiator_id, {
      source_access_token: access_token,
      source_refresh_token: refresh_token,
      source: "ASANA",
    });
  };

  const refreshTokenRejectCallback = async () => {
    await deactivateCredentials(job.workspace_id, job.initiator_id, "ASANA");
  };

  return createAsanaService({
    accessToken: credentials.source_access_token!,
    refreshToken: credentials.source_refresh_token!,
    refreshTokenFunc: asanaAuth.getRefreshToken.bind(asanaAuth),
    refreshTokenCallback: refreshTokenCallback,
    refreshTokenRejectCallback: refreshTokenRejectCallback,
  });
};
