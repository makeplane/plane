import { Issue as LinearIssue } from "@linear/sdk";
import { getCredentialsByWorkspaceId, getJobById, updateJob } from "@/db/query";
import { TSyncServiceCredentials, TSyncJobWithConfig } from "@silo/core";
import { LinearConfig, LinearCycle, LinearService } from "@silo/linear";

export async function getJobData(jobId: string): Promise<TSyncJobWithConfig<LinearConfig>> {
  const [jobData] = await getJobById(jobId);
  if (!jobData) {
    throw new Error(`[${jobId.slice(0, 7)}] No job data or metadata found. Exiting...`);
  }
  validateJobData(jobData as unknown as TSyncJobWithConfig<LinearConfig>, jobId);
  return jobData as unknown as TSyncJobWithConfig<LinearConfig>;
}

export function validateJobData(jobData: TSyncJobWithConfig<LinearConfig>, jobId: string): void {
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

export const filterCyclesForIssues = (issues: LinearIssue[], cycles: LinearCycle[]): any[] => {
  const issueIds = new Set(issues.map((issue) => issue.id));

  return cycles
    .filter((cycle) => cycle.issues.some((issue) => issueIds.has(issue.id)))
    .map((cycle) => ({
      ...cycle,
      issues: cycle.issues.filter((issue) => issueIds.has(issue.id)),
    }));
};

export const resetJobIfStarted = async (jobId: string, job: TSyncJobWithConfig<LinearConfig>) => {
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

export const getJobCredentials = async (job: TSyncJobWithConfig<LinearConfig>): Promise<TSyncServiceCredentials> => {
  const credentials = await getCredentialsByWorkspaceId(job.workspace_id!, job.initiator_id!, "LINEAR");
  if (!credentials || credentials.length === 0) {
    throw new Error(`Credentials not available for job ${job.workspace_id}`);
  }
  return credentials[0] as TSyncServiceCredentials;
};

export const createLinearClient = (credentials: TSyncServiceCredentials): LinearService => {
  return new LinearService({
    accessToken: credentials.source_access_token!,
  });
};
