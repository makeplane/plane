import { MQ, Store } from "@/apps/engine/worker/base";
import { TBatch } from "@/apps/engine/worker/types";
import { Issue as LinearIssue } from "@linear/sdk";
import { PlaneEntities } from "@plane/sdk";
import { updateJob } from "@/db/query";
import { env } from "@/env";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { logger } from "@/logger";
import { TSyncJobWithConfig } from "@silo/core";
import { pullComments, pullCycles, pullIssues, pullLabels, pullUsers } from "@silo/linear";
import { getRandomColor } from "../helpers/generic-helpers";
import {
  createLinearClient,
  filterCyclesForIssues,
  getJobCredentials,
  getJobData,
  resetJobIfStarted,
} from "../helpers/migration-helpers";
import { LinearConfig, LinearEntity } from "@silo/linear";
import {
  getTransformedComments,
  getTransformedCycles,
  getTransformedIssues,
  getTransformedLabels,
  getTransformedUsers,
} from "./tranformers/etl";

export class LinearDataMigrator extends BaseDataMigrator<LinearConfig, LinearEntity> {
  constructor(mq: MQ, store: Store) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TSyncJobWithConfig<LinearConfig>> {
    return getJobData(jobId);
  }

  async pull(job: TSyncJobWithConfig<LinearConfig>): Promise<LinearEntity[]> {
    await resetJobIfStarted(job.id, job);
    const credentials = await getJobCredentials(job);
    const client = createLinearClient(credentials);

    if (!job.config) {
      return [];
    }

    const users = await pullUsers(client, job.config.meta.teamId);
    const labels = await pullLabels(client);
    const issues = await pullIssues(client, job.config.meta.teamId);
    const cycles = await pullCycles(client, job.config.meta.teamId);
    const comments = await pullComments(issues, client);

    await updateJob(job.id, {
      start_time: new Date(),
    });

    return [
      {
        users,
        labels,
        issues,
        cycles,
        issue_comments: comments,
      },
    ];
  }

  async transform(job: TSyncJobWithConfig<LinearConfig>, data: LinearEntity[]): Promise<PlaneEntities[]> {
    if (data.length < 1) {
      return [];
    }
    const entities = data[0];
    const transformedIssue = await getTransformedIssues(job, entities);
    const transformedLabels = getTransformedLabels(job, entities);
    transformedLabels.push({
      name: "Linear Imported",
      color: getRandomColor(),
    });
    const transformedUsers = getTransformedUsers(job, entities);
    const transformedCycles = await getTransformedCycles(job, entities);
    const transformedComments = getTransformedComments(job, entities);

    return [
      {
        issues: transformedIssue,
        labels: transformedLabels,
        users: transformedUsers,
        cycles: transformedCycles,
        issue_comments: transformedComments,
        modules: [],
      },
    ];
  }

  async batches(job: TSyncJobWithConfig<LinearConfig>): Promise<TBatch<LinearEntity>[]> {
    const sourceData = await this.pull(job);
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;

    const data = sourceData[0];

    // Create a map of issues by their external_id for quick lookup
    const issueMap = new Map<string, LinearIssue>(data.issues.map((issue: LinearIssue) => [issue.id, issue]));

    // Get all the related issues for a given issue, with DFS. Traverse the
    // issues and search for the parent and children of the issue, if the parent
    // is found then add it to the related issues, and if the children are
    // found, then add them to the related issues too, and mark them as visited.
    const getRelatedIssues = async (issue: LinearIssue, visited: Set<string>) => {
      const relatedIssues = new Set([issue]);
      const stack = [issue];

      while (stack.length > 0) {
        const currentIssue = stack.pop();
        if (!currentIssue || visited.has(currentIssue.id)) continue;

        visited.add(currentIssue.id);

        if (issue.parent) {
          const parent = await issue.parent;
          if (parent && issueMap.has(parent.id)) {
            const parentIssue = issueMap.get(parent.id);
            if (parentIssue && !visited.has(parentIssue.id)) {
              relatedIssues.add(parentIssue);
              stack.push(parentIssue);
            }
          }
        }

        for (const [_id, potentialChild] of issueMap) {
          if (potentialChild.parent) {
            const parent = await potentialChild.parent;
            if (parent.id === currentIssue.id && !visited.has(potentialChild.id)) {
              relatedIssues.add(potentialChild);
              stack.push(potentialChild);
            }
          }
        }
      }

      return Array.from(relatedIssues);
    };

    const visited = new Set<string>();
    const batches: any[][] = [];
    let currentBatch: any[] = [];

    // For each issue, get the related issues and add them to the current batch
    for (const issue of data.issues) {
      if (visited.has(issue.id)) continue;

      const relatedIssues = await getRelatedIssues(issue, visited);
      currentBatch.push(...relatedIssues);

      if (currentBatch.length >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    const finalBatches: TBatch<LinearEntity>[] = [];

    // Now for every batch we need to figure out the associations, such as
    // comments, sprints and components and push that all to the final batch. Do
    // understand that sprint and components are linked to issues, so there is a
    // possibility that the same sprint or component can be present in multiple
    // batches.
    for (const [i, batch] of batches.entries()) {
      let random = Math.floor(Math.random() * 10000);
      const cycles = filterCyclesForIssues(batch, data.cycles);
      const associatedComments = data.issue_comments.filter((comment: any) =>
        batch.some((issue: any) => issue.id === comment.issue_id)
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
            issues: data.issues.length,
            labels: data.labels.length,
            users: data.users.length,
            issue_comments: data.issue_comments.length,
            cycles: data.cycles.length,
          },
        },
        data: [
          {
            issues: batch,
            issue_comments: associatedComments,
            cycles: cycles,
            labels: data.labels,
            users: data.users,
          },
        ],
      });
    }

    return finalBatches;
  }
}
