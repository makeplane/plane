import { MQ, Store } from "@/apps/engine/worker/base";
import { TBatch, UpdateEventType } from "@/apps/engine/worker/types";
import { updateJob } from "@/db/query";
import { wait } from "@/helpers/delay";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { TJobWithConfig, TJobStatus, PlaneEntities } from "@silo/core";
import { getJobForMigration, migrateToPlane } from "./migrator";
import { Lock } from "@/apps/engine/worker/base/lock";

export abstract class BaseDataMigrator<TJobConfig, TSourceEntity> implements TaskHandler {
  private mq: MQ;
  private store: Store;

  constructor(mq: MQ, store: Store) {
    this.mq = mq;
    this.store = store;
  }

  abstract batches(job: TJobWithConfig<TJobConfig>): Promise<TBatch<TSourceEntity>[]>;
  abstract transform(job: TJobWithConfig<TJobConfig>, data: TSourceEntity[], meta: any): Promise<PlaneEntities[]>;
  abstract getJobData(jobId: string): Promise<TJobWithConfig<TJobConfig>>;

  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {
    try {
      const job = await this.getJobData(headers.jobId);
      const batchLock = new Lock(this.store, job.workspace_id, headers.jobId);

      if (job.is_cancelled) {
        await batchLock.releaseLock();
        return true;
      }

      // For transform/push operations, check if we can acquire the lock
      const currentBatch = await batchLock.getCurrentBatch();

      if (currentBatch && currentBatch !== data.meta?.batchId) {
        // Another batch is being processed, requeue this one
        await this.pushToQueue(headers, data);
        return true;
      }

      // Try to acquire lock for this batch
      const acquired = await batchLock.acquireLock(data.meta?.batchId || "initiate");
      if (!acquired) {
        await this.pushToQueue(headers, data);
        return true;
      }

      try {
        switch (headers.type) {
          case "initiate":
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.type.toUpperCase()}] Initiating job 🐼------------------- [${job.id.slice(0, 7)}]`
            );
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
              await batchLock.releaseLock();
              return true;
            }

            for (const batch of batches) {
              await wait(1000);
              headers.type = "transform";
              this.pushToQueue(headers, batch);
            }
            await batchLock.releaseLock();

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
              await batchLock.releaseLock();
            } else {
              await this.update(headers.jobId, "FINISHED", {});
              await batchLock.releaseLock();
              return true;
            }
            await this.update(headers.jobId, "TRANSFORMED", {});
            return true;
          case "push":
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Pushing data for batch 🧹 ------------------- [${data.meta.batchId}]`
            );
            await this.update(headers.jobId, "PUSHING", {});
            await migrateToPlane(job, data.data, data.meta);
            await this.update(headers.jobId, "FINISHED", {});
            // Delete the workspace from the store, as we are done processing the
            // job, the worker is free to pick another job from the same workspace
            await batchLock.releaseLock();
            logger.info(
              `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Finished pushing data to batch 🚀 ------------------- [${data.meta.batchId}]`
            );
            return true;
          default:
            break;
        }
      } catch (error) {
        logger.error("got error while iterating", error);
        await this.update(headers.jobId, "ERROR", {
          error: "Something went wrong while pushing data to plane, ERROR:" + error,
        });

        // IF the job is errored out, we need delete key from the store
        await batchLock.releaseLock();
        // Inditate that the task has been errored, don't need to requeue, the task
        // will be requeued manually
        return true;
      }
      return true;
    } catch (error) {
      logger.error("got error while iterating", error);
      await this.update(headers.jobId, "ERROR", {
        error: "Something went wrong while pushing data to plane, ERROR:" + error,
      });

      // Inditate that the task has been errored, don't need to requeue, the task
      // will be requeued manually
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
      console.error(error);
      throw new Error("Error pushing to job worker queue");
    }
  };

  update = async (jobId: string, stage: UpdateEventType, data: any): Promise<void> => {
    const job = await getJobForMigration(jobId);
    if (job.is_cancelled) return;

    switch (stage) {
      case "PULLED":
        if (data.total_batch_count) {
          await updateJob(jobId, {
            total_batch_count: data.total_batch_count,
            status: "PULLED",
          });
        }
        break;

      case "TRANSFORMED":
        if (job.transformed_batch_count != null && job.total_batch_count != null) {
          if (job.transformed_batch_count + 1 === job.total_batch_count) {
            await updateJob(jobId, {
              status: "PUSHING",
              transformed_batch_count: job.transformed_batch_count + 1,
            });
          } else {
            await updateJob(jobId, {
              transformed_batch_count: job.transformed_batch_count + 1,
            });
          }
        }
        break;

      case "PUSHING":
        if (job.transformed_batch_count === job.total_batch_count) {
          await updateJob(jobId, {
            status: stage,
          });
        }
        break;

      case "FINISHED":
        if (job.completed_batch_count != null && job.total_batch_count != null) {
          if (job.completed_batch_count + 1 >= job.total_batch_count) {
            await updateJob(jobId, {
              status: "FINISHED",
              end_time: new Date(),
              completed_batch_count: job.completed_batch_count + 1,
            });
          } else {
            await updateJob(jobId, {
              completed_batch_count: job.completed_batch_count + 1,
            });
          }
        }
        break;

      case "ERROR":
        await updateJob(jobId, {
          status: stage,
          error: data.error,
        });
        break;

      default:
        await updateJob(jobId, {
          status: stage as any as TJobStatus,
        });
        break;
    }
  };
}
