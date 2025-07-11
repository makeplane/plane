import { TJobStatus, PlaneEntities } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
import { IMPORT_JOB_FIRST_PAGE_PUSHED_CACHE_KEY } from "@/helpers/cache-keys";
import { wait } from "@/helpers/delay";
import { updateJobWithReport } from "@/helpers/job";
import { captureException, logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { TBatch, TPaginationContext, UpdateEventType } from "@/worker/types";
import { migrateToPlane } from "./migrator";

export abstract class BaseDataMigrator<TJobConfig, TSourceEntity> implements TaskHandler {
  private mq: MQ;
  private store: Store;

  constructor(mq: MQ, store: Store) {
    this.mq = mq;
    this.store = store;
  }

  abstract batches(
    job: TImportJob<TJobConfig>,
    paginationContext?: TPaginationContext,
    headers?: TaskHeaders
  ): Promise<TBatch<TSourceEntity>[]>;
  abstract transform(job: TImportJob<TJobConfig>, data: TSourceEntity[], meta: any): Promise<PlaneEntities[]>;
  abstract getJobData(jobId: string): Promise<TImportJob<TJobConfig>>;

  async cacheJobWorkspaceId(jobId: string, workspaceId: string) {
    await this.store.set(`job:${jobId}:workspaceId`, workspaceId);
  }

  async cacheJobData(jobId: string, jobData: TImportJob<TJobConfig>) {
    await this.store.set(`job:${jobId}:data`, JSON.stringify(jobData));
  }

  async getJobInfo(jobId: string): Promise<TImportJob<TJobConfig>> {
    // Try to get the cached job data
    const cachedJobData = await this.store.get(`job:${jobId}:data`);

    if (!cachedJobData) {
      const jobData = await this.getJobData(jobId);
      // Cache the full job data
      await this.cacheJobData(jobId, jobData);
      return jobData;
    }

    return JSON.parse(cachedJobData);
  }

  async markJobAsFinished(jobId: string, data: any) {
    const client = getAPIClient();

    // Get the job and the report
    const job = await client.importJob.getImportJob(jobId);
    const report = await client.importReport.getImportReport(job.report_id);

    // Update the job and the report
    await Promise.all([
      client.importJob.updateImportJob(jobId, {
        status: "FINISHED",
      }),
      client.importReport.updateImportReport(report.id, {
        end_time: new Date().toISOString(),
        transformed_batch_count: report.total_batch_count,
        completed_batch_count: report.total_batch_count,
      }),
    ]);
  }

  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {
    try {
      const job = await this.getJobInfo(headers.jobId);

      // if job is cancelled, return true
      if (job.cancelled_at) {
        logger.info(`Job is cancelled, skipping the task`, { jobId: headers.jobId });
        return true;
      }

      try {
        switch (headers.type) {
          case "initiate":
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.type.toUpperCase()}] Initiating job 🐼------------------- [${job.id.slice(0, 7)}]`
            );

            // For ClickUp, we dispatch pull task instead of this
            if (headers.route.toLowerCase() === "clickup" && job.source.toLowerCase() === "clickup") {
              logger.info(`Dispatching pull task for ClickUp job 🐼 --->`, {
                jobId: job.id,
              });
              headers.type = "pull";
              await this.pushToQueue(headers, {
                paginationContext: {
                  page: 0,
                  isLastPage: false,
                },
                meta: {},
              });
              return true;
            }

            // For other sources, we use the old way of pulling the data
            await this.update(headers.jobId, "PULLING", {});
            // eslint-disable-next-line no-case-declarations
            const batches = await this.batches(job);
            await this.update(headers.jobId, "PULLED", {
              total_batch_count: batches.length,
            });

            if (batches.length === 0) {
              await this.update(headers.jobId, "FINISHED", {
                total_batch_count: batches.length,
                completed_batch_count: batches.length,
                transformed_batch_count: batches.length,
                end_time: new Date(),
              });
              return true;
            }

            for (const batch of batches) {
              await wait(1000);
              headers.type = "transform";
              this.pushToQueue(headers, batch);
            }

            return true;
          case "pull":
            logger.info(`[${headers.route.toUpperCase()}] Initiating pull task 🐼-------------------`, {
              jobId: headers?.jobId,
              page: data?.paginationContext?.page,
              isLastPage: data?.paginationContext?.isLastPage,
            });
            // eslint-disable-next-line no-case-declarations
            const firstPagePushedCacheKey = IMPORT_JOB_FIRST_PAGE_PUSHED_CACHE_KEY(headers.jobId);
            // eslint-disable-next-line no-case-declarations
            const cachedFirstPagePushed = await this.store.get(firstPagePushedCacheKey);
            if (!cachedFirstPagePushed && data?.paginationContext?.page !== 0) {
              // requeue this page, as we are not sure if the first page is pushed or not
              logger.info(`First page not pushed, requeuing the next page`, { jobId: headers.jobId });
              await wait(5000);
              await this.pushToQueue(headers, data);
              return true;
            }
            if (data?.paginationContext?.page === 0) {
              await this.update(headers.jobId, "PULLING", {});
            }
            // eslint-disable-next-line no-case-declarations
            const paginatedBatches = await this.batches(job, data.paginationContext, headers);
            // Push the paginated batches to the queue
            for (const batch of paginatedBatches) {
              headers.type = "transform";
              await this.pushToQueue(headers, batch);
            }
            return true;
          case "transform":
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Transforming data for batch 🧹 ------------------- [${data.meta.batchId}]`
            );
            this.update(headers.jobId, "TRANSFORMING", {});
            // eslint-disable-next-line no-case-declarations
            const transformedData = await this.transform(job, data.data, data.meta);
            if (transformedData.length !== 0) {
              headers.type = "push";
              await this.pushToQueue(headers, {
                data: transformedData,
                meta: data.meta,
              });
            } else {
              await this.update(headers.jobId, "FINISHED", {});
              return true;
            }
            await this.update(headers.jobId, "TRANSFORMED", {});
            return true;
          case "push":
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Pushing data for batch 🧹 ------------------- [${data.meta.batchId}]`
            );
            await this.update(headers.jobId, "PUSHING", {});
            // eslint-disable-next-line no-case-declarations
            const jobData = await this.getJobData(headers.jobId);
            await migrateToPlane(jobData as TImportJob, data.data, data.meta);
            // Delete the workspace from the store, as we are done processing the
            // job, the worker is free to pick another job from the same workspace
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Finished pushing data to batch 🚀 ------------------- [${data.meta.batchId}]`
            );
            return true;

          case "finished":
            this.markJobAsFinished(headers.jobId, data);
            return true;

          default:
            break;
        }
      } catch (error) {
        logger.error(`Got error while iterating the task ${headers.jobId} ${headers.type}`, { error });
        captureException(error as Error);

        await this.update(headers.jobId, "ERROR", {
          error: `Something went wrong while pushing data to plane, ERROR: ${headers.type} ${error instanceof Error ? error.message : JSON.stringify(error)}`,
        });

        // IF the job is errored out, we need delete key from the store
        // Inditate that the task has been errored, don't need to requeue, the task
        // will be requeued manually
        logger.error("[ETL] Error processing etl job", error);
        return true;
      }
      return true;
    } catch (error) {
      await this.update(headers.jobId, "ERROR", {
        error: "Something went wrong while pushing data to plane, ERROR:" + error,
      });

      // Inditate that the task has been errored, don't need to requeue, the task
      // will be requeued manually
      logger.error("[ETL] Error processing etl job", error);
      return true;
    }
  }

  pushToQueue = async (headers: TaskHeaders, data: any) => {
    if (!this.mq) return;
    try {
      // Message should contain jobId, taskName and the task
      await this.mq.sendMessage(data, {
        headers,
      });
    } catch (error) {
      logger.error("Error pushing to job worker queue", error);
      throw new Error("Error pushing to job worker queue");
    }
  };

  update = async (jobId: string, stage: UpdateEventType, data: any): Promise<void> => {
    const client = getAPIClient();
    const job = await client.importJob.getImportJob(jobId);

    // If the job has been cancelled return
    if (job.cancelled_at) return;

    // Get the report of the import job
    const report = await client.importReport.getImportReport(job.report_id);

    switch (stage) {
      case "PULLING":
        await updateJobWithReport(
          job.id,
          report.id,
          {
            status: "PULLING",
          },
          {
            start_time: new Date().toISOString(),
          }
        );
        break;

      case "PULLED":
        if (data.total_batch_count) {
          await updateJobWithReport(
            job.id,
            report.id,
            {
              status: "PULLED",
            },
            {
              total_batch_count: data.total_batch_count,
            }
          );
        }
        break;

      case "TRANSFORMED":
        if (report.transformed_batch_count != null && report.total_batch_count != null) {
          if (report.transformed_batch_count + 1 === report.total_batch_count) {
            await updateJobWithReport(
              job.id,
              report.id,
              {
                status: "PUSHING",
              },
              {
                transformed_batch_count: report.transformed_batch_count + 1,
              }
            );
          } else {
            await client.importReport.updateImportReport(report.id, {
              transformed_batch_count: report.transformed_batch_count + 1,
            });
          }
        }
        break;

      case "PUSHING":
        if (report.transformed_batch_count != null && report.total_batch_count != null) {
          await client.importJob.updateImportJob(jobId, {
            status: stage,
          });
        }
        break;

      case "ERROR":
        if (data.error) {
          await client.importJob.updateImportJob(jobId, {
            status: stage,
            error_metadata: data,
          });
          await client.importReport.incrementImportReportCount(report.id, {
            errored_batch_count: 1,
            completed_batch_count: 1,
          });
        }
      default:
        await client.importJob.updateImportJob(jobId, {
          status: stage as any as TJobStatus,
        });
        break;
    }
  };
}
