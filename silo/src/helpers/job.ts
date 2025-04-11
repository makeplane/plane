import { TImportJob, TImportReport, TWorkspaceCredential } from "@plane/types";
import { getAPIClient } from "@/services/client";

export const updateJobWithReport = async (jobId: string, reportId: string, jobData: Partial<TImportJob>, reportData: Partial<TImportReport>) => {
  const client = getAPIClient()
  return await Promise.all([
    client.importJob.updateImportJob(jobId, jobData),
    client.importReport.updateImportReport(reportId, reportData),
  ]);
}

export const getJobData = async <TJobConfig>(jobId: string): Promise<TImportJob<TJobConfig>> => {
  const client = getAPIClient()
  const job = await client.importJob.getImportJob(jobId);
  if (!job) {
    throw new Error(`[${jobId.slice(0, 7)}] No job data or metadata found. Exiting...`);
  }
  validateJobData(job, jobId);
  return job as unknown as TImportJob<TJobConfig>;
}

export function validateJobData(jobData: TImportJob, jobId: string): void {
  if (!jobData.workspace_id || !jobData.source) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing workspace id. Exiting...`);
  }
  if (!jobData.initiator_id) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing initiator id. Exiting...`);
  }
  if (!jobData.config) {
    throw new Error(`[${jobId.slice(0, 7)}] Missing job config. Exiting...`);
  }
}

export const resetJobIfStarted = async (job: TImportJob) => {
  if (!job.report_id) {
    return;
  }
  const apiClient = getAPIClient();
  const report = await apiClient.importReport.getImportReport(job.report_id);
  if (!report) {
    return;
  }
  if (report.total_batch_count > 0) {
    await apiClient.importReport.updateImportReport(job.report_id, {
      start_time: new Date().toISOString(),
      end_time: null,
      total_batch_count: 0,
      transformed_batch_count: 0,
      completed_batch_count: 0,
      imported_batch_count: 0,
      errored_batch_count: 0,
      total_issue_count: 0,
      imported_issue_count: 0,
      errored_issue_count: 0,
      total_page_count: 0,
      imported_page_count: 0,
      errored_page_count: 0,
    });
  }
};

export const getJobCredentials = async (job: TImportJob): Promise<TWorkspaceCredential> => {
  const apiClient = getAPIClient();
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: job.workspace_id,
    source: job.source,
    user_id: job.initiator_id,
  });
  if (!credentials || credentials.length === 0) {
    throw new Error(`Credentials not available for job ${job.workspace_id}`);
  }
  return credentials[0] as TWorkspaceCredential;
};
