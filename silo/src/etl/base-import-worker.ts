import { MQ, Store } from "@/apps/engine/worker/base";
import { TBatch, UpdateEventType } from "@/apps/engine/worker/types";
import { updateJob } from "@/db/query";
import { wait } from "@/helpers/delay";
import { logger } from "@/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { TJobWithConfig, TJobStatus, PlaneEntities } from "@silo/core";
import { getJobForMigration, migrateToPlane } from "./migrator";

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
      // Wait for a random amount of time, such that we don't conflict with the
      // keys
      const randomWait = Math.floor(Math.random() * 3000);
      await wait(randomWait);
      const processingBatchKey = `silo:${job.workspace_id}:${headers.jobId}`;
      const processingBatch = await this.store.get(processingBatchKey);

      if (
        processingBatch != null &&
        processingBatch != "initiate" &&
        data.meta &&
        data.meta.batchId &&
        processingBatch != data.meta.batchId
      ) {
        /* To Be Solved:
         * Say if there is only one job with n number of batches,
         * is being processed, in that case, we would face a case of juggling,
         * we will continuously ack and requeue the messages and pick the same
         * messages again after n-1 retries, which is not good.
         */

        /*
         * Why not nacking the message directly?
         * If we nack the message directly, the message will stay on the same
         * position in the queue, as mq try to put the messages at the head
         * of the queue when rejected and when we try to consume again, we will
         * get the same message, which may be of the same batch, leading to the
         * same batch
         */
        // Push the message to the queue and requeue the message
        await this.pushToQueue(headers, data);
        return true;
      } else {
        // Set the batch as processing
        await this.store.set(processingBatchKey, data.meta?.batchId || "initiate");
      }

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
            return true;
          }
          for (const batch of batches) {
            await wait(1000);
            headers.type = "transform";
            this.pushToQueue(headers, batch);
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
          await this.store.del(processingBatchKey);
          logger.info(
            `[${headers.route.toUpperCase()}][${headers.jobId.slice(0, 7)}] Finished pushing data to batch 🚀 ------------------- [${data.meta.batchId}]`
          );
          return true;
        default:
          break;
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
