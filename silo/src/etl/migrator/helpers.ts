import { getCredentialsByWorkspaceId, getJobById } from "@/db/query";
import { TServiceCredentials, TJobWithConfig } from "@silo/core";

export const getJobForMigration = async (jobId: string): Promise<TJobWithConfig> => {
  const jobs = await getJobById(jobId);
  if (!jobs || jobs.length === 0) {
    throw new Error(`[${jobId.slice(0, 7)}] No job found for the given job id. Exiting...`);
  }

  return jobs[0] as TJobWithConfig;
};

export const validateJobForMigration = (job: TJobWithConfig) => {
  if (!job.workspace_id || !job.migration_type) {
    throw new Error(`[${job.id}] No workspace id found in the job data. Exiting...`);
  }

  if (!job.initiator_id) {
    throw new Error(`[${job.id}] No initiator id found in the job data. Exiting...`);
  }

  if (!job.workspace_id || !job.workspace_slug || !job.project_id) {
    throw new Error(`[${job.id}] Missing required fields in the job data. Exiting...
		Workspace ID: ${job.workspace_id},
		Workspace Slug: ${job.workspace_slug},
		Project ID: ${job.project_id}
		`);
  }
};

export const getCredentialsForMigration = async (job: TJobWithConfig): Promise<TServiceCredentials> => {
  // Fetch credentials from the database
  const credentials = await getCredentialsByWorkspaceId(job.workspace_id, job.initiator_id, job.migration_type);
  if (!credentials || credentials.length === 0) {
    throw new Error(`[${job.id}] No credentials found for the workspace id in the job data. Exiting...`);
  }

  const targetCredentials = credentials[0];
  if (!targetCredentials.source_access_token) {
    throw new Error(`[${job.id}] No source access token or refresh token found in the credentials. Exiting...`);
  }

  return credentials[0] as TServiceCredentials;
};
