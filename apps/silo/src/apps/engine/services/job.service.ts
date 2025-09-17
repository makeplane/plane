import { E_JOB_STATUS } from "@plane/etl/core";
import { resetJobIfStarted } from "@/helpers/job";
import { APIError } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { importTaskManger } from "@/worker";

const JOB_IN_PROGRESS_STATUSES = [
  E_JOB_STATUS.INITIATED,
  E_JOB_STATUS.PULLED,
  E_JOB_STATUS.PULLING,
  E_JOB_STATUS.PROGRESSING,
  E_JOB_STATUS.TRANSFORMING,
  E_JOB_STATUS.TRANSFORMED,
  E_JOB_STATUS.PUSHING,
];

const JOB_ALLOWED_FOR_RE_RUN_STATUSES = [
  E_JOB_STATUS.CREATED,
  E_JOB_STATUS.QUEUED,
  E_JOB_STATUS.CANCELLED,
  E_JOB_STATUS.ERROR,
  E_JOB_STATUS.FINISHED,
];

export class JobService {
  private readonly client = getAPIClient();

  async runJob(jobId: string) {
    // Get the job from the given job id
    const job = await this.client.importJob.getImportJob(jobId);
    const jobsInProgress = await this.client.importJob.listImportJobs({
      workspace_id: job.workspace_id,
      source: job.source,
      statuses: JOB_IN_PROGRESS_STATUSES.join(","),
    });
    const isAnyJobsInProgress = jobsInProgress.length > 0;
    // If the job is not finished or error, just send 400 OK, and don't do anything
    if (job.status && !JOB_ALLOWED_FOR_RE_RUN_STATUSES.includes(job.status as E_JOB_STATUS)) {
      throw new APIError("Job is not in a valid status to run, can't instantiate again", 400);
    }
    // Check if the config is already present, for the particular job or not
    if (!job.config || job.source == null) {
      throw new APIError(
        "Config for the requested job is not found, make sure to create a config before initiating a job",
        400
      );
    }

    // Update the job status to initiated or queued if there are any jobs started
    await this.client.importJob.updateImportJob(job.id, {
      status: !isAnyJobsInProgress ? E_JOB_STATUS.INITIATED : E_JOB_STATUS.QUEUED,
      cancelled_at: null,
      error_metadata: {},
    });

    // If there are no jobs created, then we need to register the task to initiate the job
    if (!isAnyJobsInProgress) {
      logger.info(`Initiating import job`, { jobId: job.id, source: job.source });
      // Reset the job if it has already started
      await resetJobIfStarted(job);
      await importTaskManger.registerTask(
        {
          route: job.source.toLowerCase(),
          jobId: job.id,
          type: "initiate",
        },
        {}
      );
    }

    return job;
  }
}
