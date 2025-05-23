import { Issue, Issue as LinearIssue } from "@linear/sdk";
import { PlaneEntities } from "@plane/etl/core";
import {
  pullComments,
  pullCycles,
  pullLabels,
  pullProjects,
  pullUsers,
  TLinearIssueWithChildren,
  LinearConfig,
  LinearEntity,
  pullIssues,
  E_LinearDocsMigratorStep,
  E_LINEAR_IMPORT_PHASE,
} from "@plane/etl/linear";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { getRandomColor } from "@/helpers/generic-helpers";
import { getJobCredentials, getJobData, resetJobIfStarted, updateJobWithReport } from "@/helpers/job";
import { importTaskManger } from "@/worker";
import { MQ, Store } from "@/worker/base";
import { TBatch } from "@/worker/types";
import { createLinearClient, filterCyclesForIssues } from "../helpers/migration-helpers";
import {
  getTransformedComments,
  getTransformedCycles,
  getTransformedIssues,
  getTransformedLabels,
  getTransformedProjects,
  getTransformedUsers,
} from "./tranformers/etl";

export class LinearDataMigrator extends BaseDataMigrator<LinearConfig, LinearEntity> {
  constructor(mq: MQ, store: Store) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TImportJob<LinearConfig>> {
    return getJobData<LinearConfig>(jobId);
  }

  async pull(job: TImportJob<LinearConfig>): Promise<LinearEntity[]> {
    await resetJobIfStarted(job);

    const credentials = await getJobCredentials(job);
    const client = createLinearClient(credentials);

    if (!job.config) {
      return [];
    }

    const users = job.config.skipUserImport ? [] : await pullUsers(client, job.config.teamId);
    const labels = await pullLabels(client);
    const issues = await pullIssues(client, job.config.teamId);
    const cycles = await pullCycles(client, job.config.teamId);
    const projects = await pullProjects(client, job.config.teamId);
    const comments = await pullComments(issues, client);

    await updateJobWithReport(
      job.id,
      job.report_id,
      {},
      {
        start_time: new Date().toISOString(),
      }
    );

    return [
      {
        users,
        labels,
        issues,
        cycles,
        projects,
        issue_comments: comments,
      },
    ];
  }

  async transform(job: TImportJob<LinearConfig>, data: LinearEntity[]): Promise<PlaneEntities[]> {
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
    const transformedCycles = getTransformedCycles(job, entities);
    const transformedComments = getTransformedComments(job, entities);
    const transformedModules = getTransformedProjects(job, entities);

    return [
      {
        issues: transformedIssue,
        labels: transformedLabels,
        users: transformedUsers,
        cycles: transformedCycles,
        issue_comments: transformedComments,
        modules: transformedModules,
      },
    ];
  }

  async batches(job: TImportJob<LinearConfig>): Promise<TBatch<LinearEntity>[]> {
    const sourceData = await this.pull(job);
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;

    const data = sourceData[0];

    // Build a tree structure of issues, where each issue has a parent and children
    const buildIssueTree = (issues: LinearIssue[]) => {
      // Create a map of issues by their external_id for quick lookup
      const issueMap = new Map<string, TLinearIssueWithChildren>(
        data.issues.map((issue: any) => [issue.id, { ...issue, children: [] } as unknown as TLinearIssueWithChildren]) // TODO: fix types
      );

      // Build the tree structure
      const rootIssues: TLinearIssueWithChildren[] = [];
      // For each issue, find its parent and add it to the parent's children
      for (const issue of issues) {
        const node = issueMap.get(issue.id);
        // Find the parent of the issue
        const parent = breakAndGetParent(issue);
        // If the issue has no parent, it is a root issue
        if (parent === undefined) {
          if (node) rootIssues.push(node);
        } else {
          // If the issue has a parent, add it to the parent's children
          const parentNode = parent && issueMap.get(parent);
          if (parentNode) {
            if (node && parentNode.children) parentNode.children.push(node);
          }
        }
      }
      return rootIssues;
    };

    // Flatten a single tree branch and its children
    const flattenSingleTree = (root: TLinearIssueWithChildren): LinearIssue[] => {
      // BFS to flatten the tree
      const result: LinearIssue[] = [];
      const queue: { node: TLinearIssueWithChildren; level: number }[] = [{ node: root, level: 0 }];
      // BFS
      while (queue.length > 0) {
        const { node, level } = queue.shift()!;
        const { children, ...issueWithoutChildren } = node;
        result.push(issueWithoutChildren as any); // TODO: fix types

        if (children && children.length > 0) {
          children.forEach((child) => {
            queue.push({ node: child, level: level + 1 });
          });
        }
      }
      // Return the flattened tree
      return result;
    };

    // Batch root level issues and flatten each batch
    const batchIssues = (issues: LinearIssue[], batchSize: number): LinearIssue[][] => {
      // First build the tree
      const rootIssues = buildIssueTree(issues);
      // Batch the root level issues
      if (batchSize <= 0) throw new Error("Batch size must be greater than 0");
      if (rootIssues.length === 0) return [];

      // Split the root issues into batches
      const batches: LinearIssue[][] = [];
      const numBatches = Math.ceil(rootIssues.length / batchSize);

      // For each batch of root issues, flatten their trees
      for (let i = 0; i < numBatches; i++) {
        const startIndex = i * batchSize;
        const rootBatch = rootIssues.slice(startIndex, startIndex + batchSize);
        // Flatten each root issue and its children, then combine them
        const flattenedBatch = rootBatch.reduce(
          (acc: LinearIssue[], rootIssue) => acc.concat(flattenSingleTree(rootIssue)),
          []
        );
        // Add the flattened batch to the batches
        batches.push(flattenedBatch);
      }
      // Return the batches
      return batches;
    };

    const batches = batchIssues(data.issues as any, batchSize); // TODO: fix types

    const finalBatches: TBatch<LinearEntity>[] = [];

    // Now for every batch we need to figure out the associations, such as
    // comments, sprints and components and push that all to the final batch. Do
    // understand that sprint and components are linked to issues, so there is a
    // possibility that the same sprint or component can be present in multiple
    // batches.
    for (const [i, batch] of batches.entries()) {
      const random = Math.floor(Math.random() * 10000);
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
            projects: data.projects.length,
          },
        },
        data: [
          {
            issues: batch as any,
            issue_comments: associatedComments,
            cycles: cycles,
            labels: data.labels,
            users: data.users,
            projects: data.projects,
          },
        ],
      });
    }

    return finalBatches;
  }

  async markJobAsFinished(jobId: string, data: any): Promise<void> {
    const phase = data.phase;

    if (phase === E_LINEAR_IMPORT_PHASE.ISSUES) {
      // Dispatch docs importer job
      await importTaskManger.registerTask(
        {
          route: "linear_docs",
          jobId: jobId,
          type: E_LinearDocsMigratorStep.PULL,
        },
        {}
      );
    } else if (phase === E_LINEAR_IMPORT_PHASE.PAGES) {
      await super.markJobAsFinished(jobId, data);
    }
  }
}

const breakAndGetParent = (issue: Issue): string | undefined => {
  // @ts-expect-error
  const parent = issue._parent;
  if (parent) {
    return parent.id;
  }
};
