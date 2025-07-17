import {
  ClickUpPullService,
  E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS,
  E_CLICKUP_IMPORT_PHASE,
  getUniqueTasks,
  TClickUpConfig,
  TClickUpEntity,
  TClickUpTask,
  TClickUpTaskWithComments,
} from "@plane/etl/clickup";
import { E_IMPORTER_KEYS, PlaneEntities } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { wait } from "@/helpers/delay";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getJobCredentials, getJobData, resetJobIfStarted } from "@/helpers/job";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { logger } from "@/logger";
import { TaskHeaders } from "@/types";
import { importTaskManger } from "@/worker";
import { MQ, Store } from "@/worker/base";
import { TBatch, TPaginationContext, TBatchPullResult } from "@/worker/types";
import { getClickUpClient } from "../helpers";
import { ClickUpBulkTransformer } from "./transformers/etl";

const CLICKUP_BATCH_SIZE = 100;

export class ClickUpDataMigrator extends BaseDataMigrator<TClickUpConfig, TClickUpEntity> {
  constructor(mq: MQ, store: Store) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TImportJob<TClickUpConfig>> {
    return getJobData<TClickUpConfig>(jobId);
  }

  async transform(job: TImportJob<TClickUpConfig>, data: TClickUpEntity[]): Promise<PlaneEntities[]> {
    if (data.length < 1) {
      return [];
    }
    const entities = data[0];
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

    return [
      {
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
      },
    ];
  }

  async batches(
    job: TImportJob<TClickUpConfig>,
    paginationContext: TPaginationContext,
    headers: TaskHeaders
  ): Promise<TBatch<TClickUpEntity>[]> {
    const batchSize = CLICKUP_BATCH_SIZE;

    // pull the data for the current page and page context for the next page
    const { sourceData, paginationContext: currentPageData } = await this.pullInBatches(
      job,
      paginationContext,
      headers
    );

    const data = sourceData;
    // Batch root level issues and flatten each batch
    const batchIssues = (issues: TClickUpTask[], batchSize: number): TClickUpTask[][] => {
      // Batch the issues
      if (batchSize <= 0) throw new Error("Batch size must be greater than 0");

      // Split the issues into batches
      const batches: TClickUpTask[][] = [];
      const numBatches = Math.ceil(issues.length / batchSize);

      // For each batch of root issues, flatten their trees
      for (let i = 0; i < numBatches; i++) {
        const startIndex = i * batchSize;
        const batch = issues.slice(startIndex, startIndex + batchSize);
        // Add the flattened batch to the batches
        batches.push(batch);
      }
      // Return the batches
      return batches;
    };

    const batches = batchIssues(data.tasks, batchSize);

    const finalBatches: TBatch<TClickUpEntity>[] = [];

    // Now for every batch we need to figure out the associations, such as
    // comments, sprints and lists and push that all to the final batch. Do
    // understand that sprint and lists are linked to issues, so there is a
    // possibility that the same sprint or list can be present in multiple
    // batches.
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
          phase: E_CLICKUP_IMPORT_PHASE.ISSUES,
          isLastBatch: currentPageData.isLastPage,
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

    // Update the job with the batches count
    await integrationConnectionHelper.incrementImportReportCount({
      report_id: job.report_id,
      total_batch_count: batches.length,
    });

    logger.info("[CLICKUP] Batching completed", {
      jobId: job.id,
      batchCount: batches.length,
      paginationContext: currentPageData,
    });

    return finalBatches;
  }

  async markJobAsFinished(jobId: string, data: any): Promise<void> {
    const phase = data.phase;
    const isLastBatch = data.isLastBatch || false;
    // since phase we are taking from meta and meta is getting passed in each batch
    // we don't know which batch is the last one, so we check by job completion
    const job = await this.getJobData(jobId);
    const report = await integrationConnectionHelper.getImportReport({ report_id: job.report_id });
    logger.info(`Marking job as finished for ${jobId}`, {
      data,
      jobId,
      phase,
      isLastBatch,
      completed_batch_count: report.completed_batch_count,
      total_batch_count: report.total_batch_count,
    });
    if (phase === E_CLICKUP_IMPORT_PHASE.ISSUES) {
      // check if the job is completed
      if (isLastBatch) {
        // Dispatch clickup additional data importer job
        await importTaskManger.registerTask(
          {
            route: "clickup_additional_data",
            jobId: jobId,
            type: E_CLICKUP_ADDITIONAL_DATA_MIGRATOR_STEPS.PULL,
          },
          {}
        );
      }
    } else if (phase === E_CLICKUP_IMPORT_PHASE.ADDITIONAL_DATA) {
      if (isLastBatch) {
        // retry logic
        for (let i = 0; i < 5; i++) {
          // retry for ~5 seconds
          logger.info(`Retrying to mark job as finished for ${jobId}`, { jobId, phase, isLastBatch });
          const report = await integrationConnectionHelper.getImportReport({ report_id: job.report_id });
          if (report.completed_batch_count >= report.total_batch_count) {
            await super.markJobAsFinished(jobId, data);
            return;
          }
          await wait(5000);
        }
        // fallback – re-queue the finished event once more
        await importTaskManger.registerTask({ route: "clickup", jobId, type: "finished" }, data);
      }
    }
  }

  private async pullInBatches(
    job: TImportJob<TClickUpConfig>,
    paginationContext: TPaginationContext,
    headers: TaskHeaders
  ): Promise<TBatchPullResult<TClickUpEntity>> {
    const credential = await getJobCredentials(job);
    const clickUpClient = getClickUpClient(credential);
    const clickUpPullService = new ClickUpPullService(clickUpClient);

    if (!job.config) {
      logger.error(`Job config not found`, { jobId: job.id });
      return {} as TBatchPullResult<TClickUpEntity>;
    }

    const users = job.config.skipUserImport ? [] : await clickUpPullService.pullSpaceMembers(job.config.team.id);
    const lists = await clickUpPullService.pullLists(job.config.folder.id);
    const page = paginationContext.page;
    const { last_page, tasks } = await clickUpPullService.pullTasksForFolderPaginated(
      job.config.team.id,
      job.config.folder.id,
      page
    );
    logger.info(`[CLICKUP] Pulling tasks for page ${page}`, {
      jobId: job.id,
      page,
      last_page,
      taskCount: tasks.length,
    });
    const listsWithTasks = clickUpPullService.pullListsWithTasks(lists, tasks);
    const uniqueTasks = getUniqueTasks(tasks);
    // const taskIds = uniqueTasks.map((task) => task.id);
    // const taskComments = await clickUpPullService.pullTasksComments(taskIds);
    const taskComments: TClickUpTaskWithComments[] = [];
    const tags = await clickUpPullService.pullTags(job.config.space.id);
    const statuses = job.config?.statuses || [];
    const priorities = job.config?.space?.features?.priorities?.enabled
      ? job.config?.space?.features?.priorities?.priorities
      : [];
    const customTaskTypes = await clickUpPullService.pullCustomTaskTypes(job.config.team.id);
    const customFieldsForTaskTypes = await clickUpPullService.pullCustomFieldsForTaskTypes(
      job.config.folder.id,
      customTaskTypes
    );

    // pull task relations
    const tasksRelations = clickUpPullService.fetchTaskRelations(tasks);

    // update the import job and report
    await integrationConnectionHelper.updateImportJob({ job_id: job.id, relation_map: { issue: tasksRelations } });
    await integrationConnectionHelper.updateImportReport({
      report_id: job.report_id,
      start_time: new Date().toISOString(),
    });

    const sourceData = {
      users,
      listsWithTasks,
      tasks: uniqueTasks,
      taskComments,
      tags,
      statuses,
      priorities,
      customTaskTypes,
      customFieldsForTaskTypes,
    };

    // Verify states and project only for the first page
    if (paginationContext.page === 0) {
      const planeClient = await getPlaneAPIClient(credential, E_IMPORTER_KEYS.IMPORTER);
      const clickUpBulkTransformer = new ClickUpBulkTransformer(
        job,
        sourceData,
        planeClient,
        clickUpClient,
        credential
      );

      // verify availablity of states and plane project update the job config if required
      const isStatesAndProjectAvailable = await clickUpBulkTransformer.verifyStatesAndProject();
      // clear the cache for the job after updating with states and project
      await this.store.del(`job:${job.id}:data`);
      if (!isStatesAndProjectAvailable) {
        logger.error(`States and project not available, skipping transformation`, { jobId: job.id });
        return {} as TBatchPullResult<TClickUpEntity>;
      }
    }

    if (!last_page) {
      headers.type = "pull";
      await this.pushToQueue(headers, {
        paginationContext: {
          page: page + 1,
          isLastPage: last_page,
        },
      });
    }

    return {
      sourceData,
      paginationContext: {
        page: page + 1,
        isLastPage: last_page,
      },
    };
  }
}
