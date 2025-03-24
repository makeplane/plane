import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { TImportJob, TWorkspaceCredential } from "@plane/types";
import { getJobCredentials } from "@/helpers/job";
import { getAPIClient } from "@/services/client";

export const getJobForMigration = async (jobId: string): Promise<TImportJob> => {
  const client = getAPIClient();
  const job = await client.importJob.getImportJob(jobId);
  return job as TImportJob;
};

export const validateJobForMigration = (job: TImportJob) => {
  if (!job.workspace_id || !job.source) {
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

export const getCredentialsForMigration = async (job: TImportJob) => {
  // Fetch credentials from the database
  const credentials = await getJobCredentials(job);

  if (!credentials.source_access_token && job.source !== E_IMPORTER_KEYS.FLATFILE) {
    throw new Error(`[${job.id}] No source access token or refresh token found in the credentials. Exiting...`);
  }

  if (!credentials.target_access_token && job.source !== E_IMPORTER_KEYS.FLATFILE) {
    throw new Error(`[${job.id}] No target access token found in the credentials. Exiting...`);
  }

  return credentials as TWorkspaceCredential & { target_access_token: string; source_access_token: string };
};
