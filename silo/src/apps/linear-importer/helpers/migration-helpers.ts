import { Issue as LinearIssue } from "@linear/sdk";
import { getCredentialsByWorkspaceId, getJobById, updateJob } from "@/db/query";
import { TServiceCredentials, TJobWithConfig } from "@silo/core";
import { LinearConfig, LinearCycle, LinearService } from "@silo/linear";
import { env } from "@/env";

export async function getJobData(jobId: string): Promise<TJobWithConfig<LinearConfig>> {
  const [jobData] = await getJobById(jobId);
  if (!jobData) {
    throw new Error(`[${jobId.slice(0, 7)}] No job data or metadata found. Exiting...`);
  }
  validateJobData(jobData as unknown as TJobWithConfig<LinearConfig>, jobId);
  return jobData as unknown as TJobWithConfig<LinearConfig>;
}

export function validateJobData(jobData: TJobWithConfig<LinearConfig>, jobId: string): void {
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

export const resetJobIfStarted = async (jobId: string, job: TJobWithConfig<LinearConfig>) => {
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

export const getJobCredentials = async (job: TJobWithConfig<LinearConfig>): Promise<TServiceCredentials> => {
  const credentials = await getCredentialsByWorkspaceId(job.workspace_id!, job.initiator_id!, "LINEAR");
  if (!credentials || credentials.length === 0) {
    throw new Error(`Credentials not available for job ${job.workspace_id}`);
  }
  return credentials[0] as TServiceCredentials;
};

export const createLinearClient = (credentials: TServiceCredentials): LinearService => {
  if (env.LINEAR_OAUTH_ENABLED === "1") {
    return new LinearService({
      isPAT: false,
      accessToken: credentials.source_access_token!,
    });
  } else {
    return new LinearService({
      isPAT: true,
      apiKey: credentials.source_access_token!,
    });
  }
};
