import {
  ClickupAPIService,
  ClickUpPullService,
  TClickUpConfig,
  TClickUpEntity,
  getUniqueTasks,
  TClickUpTaskWithComments,
  TClickUpUser,
  TClickUpListsWithTasks,
  TClickUpCustomTaskType,
  TClickUpStatus,
  TClickUpTag,
  TClickUpPriority,
  TClickUpCustomFieldWithTaskType,
  E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS,
  TClickUpTask,
  E_CLICKUP_IMPORT_PHASE,
} from "@plane/etl/clickup";
import { E_IMPORTER_KEYS, E_JOB_STATUS, PlaneEntities } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
import { migrateToPlane } from "@/etl/migrator/migrator";
import { getJobCredentials, getJobData } from "@/helpers/job";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { TBatch } from "@/worker/types";
import { getClickUpClient } from "../helpers/clickup-client";
import { ClickUpBulkTransformer } from "./transformers/etl";

const client = getAPIClient();

export const ExecutionOrder = [
  E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PULL,
  E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.TRANSFORM,
  E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PUSH,
];

type TClickUpAdditionalTransformData = {
  data: PlaneEntities;
  meta: any;
};

type TClickUpAdditionalPullData = {
  page: number;
  last_page: boolean;
};

export class ClickUpAdditionalDataMigrator extends TaskHandler {
  constructor(
    private readonly mq: MQ,
    private readonly store: Store
  ) {
    super();
  }

  async handleTask(headers: TaskHeaders, data: any): Promise<boolean> {
    // Get the job data
    try {
      const job = await getJobData<TClickUpConfig>(headers.jobId);
      const credentials = await getJobCredentials(job);
      const clickUpClient = getClickUpClient(credentials);

      if (!job.config) {
        return false;
      }

      let lastResult: any;

      switch (headers.type) {
        case E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PULL:
          // eslint-disable-next-line no-case-declarations
          const { clickUpEntity, page, isLastPage } = await this.pull(headers, job, clickUpClient, data);
          // Split the result into batches and dispatch them
          await this.dispatchBatches(headers, job, clickUpEntity, page, isLastPage);
          break;
        case E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.TRANSFORM:
          lastResult = await this.transform(headers, job, data);
          await this.dispatchNextStep(headers, lastResult);
          break;
        case E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PUSH:
          await this.push(headers, job, data);
          break;
      }

      logger.info(`[${headers.route.toUpperCase()}] Finished step ${headers.type} for batch 🚀`, {
        jobId: headers.jobId,
        type: headers.type,
      });
      return true;
    } catch (error) {
      logger.error(`Error while handling task in additional data migrator`, {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        jobId: headers.jobId,
        type: headers.type,
      });
      return false;
    }
  }

  async pull(
    headers: TaskHeaders,
    job: TImportJob<TClickUpConfig>,
    clickUpClient: ClickupAPIService,
    data: TClickUpAdditionalPullData | undefined
  ): Promise<{ clickUpEntity: TClickUpEntity; page: number; isLastPage: boolean }> {
    // pulling data from clickup for the given page and if not last page, push the next page to the queue as pull type
    const clickUpPullService = new ClickUpPullService(clickUpClient);

    const page: number = data?.page || 0;

    const { last_page, tasks } = await clickUpPullService.pullTasksForFolderPaginated(
      job.config.team.id,
      job.config.folder.id,
      page
    );
    logger.info(`[${headers.route.toUpperCase()}] Pulling data for batch 🧹`, { jobId: job.id, page, last_page });
    const uniqueTasks = getUniqueTasks(tasks);
    const taskIds = uniqueTasks.map((task) => task.id);
    const tasksWithAttachments = await clickUpPullService.pullTasksWithAttachments(taskIds);
    const taskComments = await clickUpPullService.pullTasksComments(taskIds);

    const clickUpEntity: TClickUpEntity = {
      users: [] as TClickUpUser[],
      listsWithTasks: [] as TClickUpListsWithTasks[],
      tasks: tasksWithAttachments,
      taskComments,
      tags: [] as TClickUpTag[],
      statuses: [] as TClickUpStatus[],
      priorities: [] as TClickUpPriority[],
      customTaskTypes: [] as TClickUpCustomTaskType[],
      customFieldsForTaskTypes: [] as TClickUpCustomFieldWithTaskType[],
    };

    // If not last page, push the next page of pulling tasks to the queue
    if (!last_page) {
      this.pushToQueue(
        { ...headers, type: E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PULL },
        {
          page: page + 1,
        }
      );
    }
    logger.info(`[${headers.route.toUpperCase()}] Pulled data for batch 🧹`, {
      jobId: job.id,
      page,
      isLastPage: last_page,
    });
    return { clickUpEntity, page, isLastPage: last_page };
  }

  async dispatchBatches(
    headers: TaskHeaders,
    job: TImportJob<TClickUpConfig>,
    data: TClickUpEntity,
    page: number,
    isLastPage: boolean
  ): Promise<void> {
    logger.info(`[${headers.route.toUpperCase()}] Dispatching new batches for batch 🧹`, {
      jobId: job.id,
      page,
      isLastPage,
    });
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;
    const batchIssues = (issues: TClickUpTask[], batchSize: number): TClickUpTask[][] => {
      if (batchSize <= 0) throw new Error("Batch size must be greater than 0");

      // Split the issues into batches
      const batches: TClickUpTask[][] = [];
      const numBatches = Math.ceil(issues.length / batchSize);

      // For each batch of root issues, flatten their trees
      for (let i = 0; i < numBatches; i++) {
        const startIndex = i * batchSize;
        const batch = issues.slice(startIndex, startIndex + batchSize);
        // Add the flattened batch to the batches
        if (batch.length > 0) {
          batches.push(batch);
        }
      }
      // Return the batches
      return batches;
    };

    const batches = batchIssues(data.tasks, batchSize);

    const finalBatches: TBatch<TClickUpEntity>[] = [];

    for (const [i, batch] of batches.entries()) {
      const random = Math.floor(Math.random() * 10000);
      const associatedComments = data.taskComments.filter((comment: TClickUpTaskWithComments) =>
        batch.some((issue: TClickUpTask) => issue.id === comment.taskId)
      );

      finalBatches.push({
        id: random,
        jobId: job.id,
        meta: {
          batchId: random,
          batch_start: i * batchSize,
          batch_size: batch.length,
          batch_end: i * batchSize + batch.length,
          total: {
            tasks: data.tasks.length,
            taskComments: data.taskComments.length,
            users: data.users.length,
            listsWithTasks: data.listsWithTasks.length,
            tags: data.tags.length,
            statuses: data.statuses.length,
            priorities: data.priorities.length,
            customTaskTypes: data.customTaskTypes.length,
            customFieldsForTaskTypes: data.customFieldsForTaskTypes.length,
          },
          phase: E_CLICKUP_IMPORT_PHASE.ADDITIONAL_DATA,
          isLastBatch: i === batches.length - 1 && isLastPage,
        },
        data: [
          {
            users: data.users,
            listsWithTasks: data.listsWithTasks,
            tasks: batch,
            taskComments: associatedComments,
            tags: data.tags,
            statuses: data.statuses,
            priorities: data.priorities,
            customTaskTypes: data.customTaskTypes,
            customFieldsForTaskTypes: data.customFieldsForTaskTypes,
          },
        ],
      });
    }

    // Update the job with the batches
    await client.importReport.incrementImportReportCount(job.report_id, {
      total_batch_count: batches.length,
    });

    for (const batch of finalBatches) {
      this.dispatchNextStep(headers, batch);
    }

    logger.info(`[${headers.route.toUpperCase()}] Finished dispatching new batches for batch 🚀`, {
      jobId: job.id,
      page,
      isLastPage,
    });
  }

  async transform(
    headers: TaskHeaders,
    job: TImportJob<TClickUpConfig>,
    data: TBatch<TClickUpEntity>
  ): Promise<TClickUpAdditionalTransformData | undefined> {
    try {
      logger.info(`[${headers.route.toUpperCase()}] Transforming data for batch 🧹`, {
        batchId: data.meta.batchId,
        jobId: job.id,
      });
      if (!data.data) {
        return undefined;
      }
      const entities = data.data[0];
      const credential = await getJobCredentials(job);
      const planeClient = await getPlaneAPIClient(credential, E_IMPORTER_KEYS.IMPORTER);
      const clickUpClient = getClickUpClient(credential);
      const clickUpBulkTransformer = new ClickUpBulkTransformer(job, entities, planeClient, clickUpClient, credential);
      const transformedIssues = await clickUpBulkTransformer.getTransformedTasks();
      const transformedLabels = clickUpBulkTransformer.getTransformedTags();
      const transformedUsers = clickUpBulkTransformer.getTransformedUsers();
      const transformedModules = clickUpBulkTransformer.getTransformedLists();
      const transformedComments = clickUpBulkTransformer.getTransformedComments();
      const transformedIssueTypes = clickUpBulkTransformer.getTransformedIssueTypes();
      const transformedIssueFields = clickUpBulkTransformer.getTransformedIssueFields();
      const transformedIssueFieldOptions = clickUpBulkTransformer.getTransformedIssueFieldOptions();
      const transformedIssuePropertyValues = clickUpBulkTransformer.getTransformedIssuePropertyValues();

      const transformedData = {
        issues: transformedIssues,
        labels: transformedLabels,
        users: transformedUsers,
        cycles: [],
        issue_comments: transformedComments,
        modules: transformedModules,
        issue_types: transformedIssueTypes,
        issue_properties: transformedIssueFields,
        issue_property_options: transformedIssueFieldOptions,
        issue_property_values: transformedIssuePropertyValues,
      };
      return {
        data: transformedData,
        meta: data.meta,
      };
    } catch (error) {
      logger.error(`[${headers.route.toUpperCase()}] Error while transforming data`, {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        jobId: job.id,
      });
      await client.importReport.incrementImportReportCount(job.report_id, {
        errored_batch_count: 1,
        completed_batch_count: 1,
      });
      throw error;
    }
  }

  async push(
    headers: TaskHeaders,
    job: TImportJob<TClickUpConfig>,
    data: TClickUpAdditionalTransformData
  ): Promise<void> {
    logger.info(`[${headers.route.toUpperCase()}] Pushing data for batch 🧹`, { batchId: data.meta.batchId });
    if (data.meta.isLastBatch) {
      logger.info(`[${headers.route.toUpperCase()}] Marking job as finished in the last batch 🚀`, { jobId: job.id });
      await client.importJob.updateImportJob(job.id, {
        status: E_JOB_STATUS.FINISHED,
      });
    }
    await migrateToPlane(job as TImportJob, [data.data], data.meta);
    logger.info(`[${headers.route.toUpperCase()}] Finished pushing data to batch 🚀`, { batchId: data.meta.batchId });
    return;
  }

  async dispatchNextStep(headers: TaskHeaders, lastResult: any): Promise<void> {
    if (!lastResult) {
      logger.info(`[${headers.route.toUpperCase()}] No result to dispatch next step, skipping`, {
        type: headers.type,
        jobId: headers.jobId,
      });
      return;
    }
    const step = ExecutionOrder.findIndex((step) => step === headers.type);
    if (step === -1) {
      throw new Error(`Step ${headers.type} not found`);
    }

    const nextStep = ExecutionOrder[step + 1];
    if (!nextStep) {
      logger.info("No more steps to dispatch");
      return;
    }

    this.pushToQueue({ ...headers, type: nextStep }, lastResult);
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
}
