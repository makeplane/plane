import { PlaneEntities } from "@plane/etl/core";
import {
  extractFlatfileEntity,
  FlatfileConfig,
  pullSheetRecords,
  TFlatfileEntity,
  transformCycle,
  transformIssue,
  transformIssueType,
  transformLabel,
  transformModule,
  transformUser,
} from "@plane/etl/flatfile";
import { TImportJob } from "@plane/types";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { getJobData, resetJobIfStarted } from "@/helpers/job";
import { logger } from "@/logger";
import { MQ, Store } from "@/worker/base";
import { TBatch } from "@/worker/types";
import { flatfileClient } from "../helpers/client";

export class FlatfileMigrator extends BaseDataMigrator<FlatfileConfig, TFlatfileEntity> {
  constructor(mq: MQ, store: Store) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TImportJob<FlatfileConfig>> {
    return getJobData(jobId);
  }

  async pull(job: TImportJob<FlatfileConfig>): Promise<TFlatfileEntity[]> {
    // Retrieve and validate the job data
    await resetJobIfStarted(job);

    if (!job.config) {
      logger.info(`No Job Config found for the Job, ${job.id} ${job.workspace_slug}`);
      return [];
    }

    const config = job.config;

    if (!flatfileClient) return [];

    const records = await pullSheetRecords(flatfileClient, config.workbookId);
    return extractFlatfileEntity(records);
  }

  async batches(job: TImportJob<FlatfileConfig>): Promise<TBatch<TFlatfileEntity>[]> {
    const entities = await this.pull(job);
    const batchSize = 100; // Fixed batch size for issues
    const issues = entities[0].issues;
    const numBatches = Math.ceil(issues.length / batchSize);
    const finalBatches: TBatch<TFlatfileEntity>[] = [];

    for (let i = 0; i < numBatches; i++) {
      const startIndex = i * batchSize;
      const batchIssues = issues.slice(startIndex, startIndex + batchSize);
      // Get modules and cycles associated with this batch of issues
      const batchModules = entities[0].modules.filter((module) =>
        module.issues.some((issueId) => batchIssues.some((issue) => issue.id === issueId))
      );
      const batchCycles = entities[0].cycles.filter((cycle) =>
        cycle.issues.some((issueId) => batchIssues.some((issue) => issue.id === issueId))
      );

      const random = Math.floor(Math.random() * 10000);
      finalBatches.push({
        id: random,
        jobId: job.id,
        data: [
          {
            issues: batchIssues,
            modules: batchModules,
            cycles: batchCycles,
            // Include all global entities
            labels: entities[0].labels,
            users: entities[0].users,
            issue_types: entities[0].issue_types || [],
          },
        ],
        meta: {
          batchId: random,
          batch_start: startIndex,
          batch_end: startIndex + batchIssues.length,
          batch_size: batchIssues.length,
          total: {
            modules: batchModules.length,
            cycles: batchCycles.length,
            issues: entities[0].issues.length,
            labels: entities[0].labels.length,
            users: entities[0].users.length,
            issue_types: entities[0].issue_types?.length || 0,
          },
        },
      });
    }

    return finalBatches;
  }

  async transform(job: TImportJob<FlatfileConfig>, data: TFlatfileEntity[]): Promise<PlaneEntities[]> {
    const { issues, cycles, labels, users, issue_types, modules } = data[0];

    const transformedIssues = issues.map((issue) => transformIssue(issue));
    const transformedCycles = cycles.map((cycle) => transformCycle(cycle));
    const transformedModules = modules.map((module) => transformModule(module));
    const transformedLabels = labels.map((label) => transformLabel(label));
    const transformedUsers = users.map((user) => transformUser(user));
    const transformedIssueTypes = issue_types?.map((issue_type) => transformIssueType(issue_type));

    return [
      {
        labels: transformedLabels,
        cycles: transformedCycles,
        issues: transformedIssues,
        users: transformedUsers,
        issue_types: transformedIssueTypes,
        issue_comments: [],
        modules: transformedModules,
      },
    ];
  }
}
