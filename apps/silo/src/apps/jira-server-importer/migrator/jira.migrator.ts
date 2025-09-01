import { Issue as IJiraIssue } from "jira.js/out/version2/models";
import { PlaneEntities } from "@plane/etl/core";
import {
  JiraConfig,
  JiraEntity,
  TJiraIssueWithChildren,
  pullComments,
  pullComponents,
  pullIssueFields,
  pullIssues,
  pullIssueTypes,
  pullLabels,
  pullSprints,
  pullUsers,
} from "@plane/etl/jira-server";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { getJobCredentials, getJobData, resetJobIfStarted, updateJobWithReport } from "@/helpers/job";
import { logger } from "@/logger";
import { TBatch } from "@/worker/types";
import { createJiraClient, filterComponentsForIssues, filterSprintsForIssues } from "../helpers/migration-helpers";
import {
  getTransformedComments,
  getTransformedComponents,
  getTransformedIssueFieldOptions,
  getTransformedIssueFields,
  getTransformedIssuePropertyValues,
  getTransformedIssues,
  getTransformedIssueTypes,
  getTransformedLabels,
  getTransformedSprints,
  getTransformedUsers,
} from "./transformers";

export class JiraDataCenterMigrator extends BaseDataMigrator<JiraConfig, JiraEntity> {
  constructor(mq: any, store: any) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TImportJob<JiraConfig>> {
    return getJobData(jobId);
  }

  async pull(job: TImportJob<JiraConfig>): Promise<JiraEntity[]> {
    // Retrieve and validate the job data
    await resetJobIfStarted(job);

    // Obtain the Jira client and the job credentials
    const credentials = await getJobCredentials(job);
    const client = createJiraClient(job, credentials);

    if (!job.config) {
      logger.info(`No Job Config found for the Job, ${job.id} ${job.workspace_slug}`);
      return [];
    }

    const projectId = job.config.project.id;
    const projectKey = job.config.project.key;

    if (!projectId || !projectKey) {
      logger.info(`No Project ID or Project Key found for the Job, ${job.id} ${job.workspace_slug}`);
      return [];
    }

    /* -------------- Pull Jira Data --------------- */
    const users = job.config.skipUserImport ? [] : await pullUsers(client);
    const labels = await pullLabels(client, projectId);
    const issues = await pullIssues(client, projectKey);
    const sprints = await pullSprints(client, projectId);
    const comments = await pullComments(issues, client);
    const components = await pullComponents(client, projectKey);
    const issueTypes = await pullIssueTypes(client, projectId);
    const issueFields = await pullIssueFields(client, projectId);
    /* -------------- Pull Jira Data --------------- */

    // Update Job for the actual start time of the migration
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
        issues,
        labels,
        sprints,
        components,
        issueTypes,
        issue_comments: comments,
        issueFields,
      },
    ];
  }

  // NOOP, as transform will be done as the integration level
  // Transforms all the details from Jira to Plane
  transform = async (job: TImportJob<JiraConfig>, data: JiraEntity[]): Promise<PlaneEntities[]> => {
    // Get the job by the job configuration
    if (data.length < 1) {
      return [];
    }
    const entities = data[0];

    const credentials = await getJobCredentials(job);

    const resourceUrl = job.config.resource?.url || credentials.source_hostname;
    const transformedIssue = getTransformedIssues(job, entities, resourceUrl || "");

    /* Todo: Remove this antipattern logic when issue types come to plane */
    if (job.config.issueType) {
      if (job.config.issueType === "create_as_label") {
        for (const issue of transformedIssue) {
          // For each label of an issue, if the transformed labels doesn't
          // contain the label, we need to add it to the transformed labels
          if (issue.labels) {
            issue.labels.forEach((label) => {
              if (!entities.labels.includes(label)) {
                entities.labels.push(label);
              }
            });
          }
        }
      }
    }

    // Add a new label for the issues that are imported from Jira
    entities.labels.push("JIRA IMPORTED");

    // Perrforming the transformation of the data from Jira to Plane
    const transformedLabels = getTransformedLabels(job, entities.labels);
    const transformedUsers = getTransformedUsers(job, entities);
    const transformedModules = getTransformedComponents(job, entities);
    const transformedComments = getTransformedComments(job, entities);
    const transformedSprintsAsCycles = getTransformedSprints(job, entities);
    const transformedIssueTypes = getTransformedIssueTypes(job, entities);
    const transformedIssueFields = getTransformedIssueFields(job, entities);
    const transformedIssueFieldOptions = getTransformedIssueFieldOptions(job, entities);
    const transformedIssuePropertyValues = getTransformedIssuePropertyValues(job, entities, transformedIssueFields);

    // Return the transformed data
    return [
      {
        users: transformedUsers,
        issues: transformedIssue,
        labels: transformedLabels,
        cycles: transformedSprintsAsCycles,
        modules: transformedModules,
        issue_comments: transformedComments,
        issue_types: transformedIssueTypes,
        issue_properties: transformedIssueFields,
        issue_property_options: transformedIssueFieldOptions,
        issue_property_values: transformedIssuePropertyValues,
      },
    ];
  };

  async batches(job: TImportJob<JiraConfig>): Promise<TBatch<JiraEntity>[]> {
    const sourceData = await this.pull(job);
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;

    const data = sourceData[0];

    // Build a tree structure of issues, where each issue has a parent and children
    const buildIssueTree = (issues: IJiraIssue[]) => {
      const issueMap = new Map(
        issues.map((issue: IJiraIssue) => [issue.id, { ...issue, children: [] } as TJiraIssueWithChildren])
      );
      const rootIssues: TJiraIssueWithChildren[] = [];
      for (const issue of issues) {
        const node = issueMap.get(issue.id);
        if (issue.fields.parent?.id === undefined) {
          if (node) rootIssues.push(node);
        } else {
          const parentNode = issue?.fields.parent?.id && issueMap.get(issue.fields.parent?.id);
          if (parentNode) {
            if (node && parentNode.children) parentNode.children.push(node);
          }
        }
      }
      return rootIssues;
    };

    // Flatten a single tree branch and its children
    const flattenSingleTree = (root: TJiraIssueWithChildren): IJiraIssue[] => {
      // BFS to flatten the tree
      const result: IJiraIssue[] = [];
      const queue: { node: TJiraIssueWithChildren; level: number }[] = [{ node: root, level: 0 }];
      // BFS
      while (queue.length > 0) {
        const { node, level } = queue.shift()!;
        const { children, ...issueWithoutChildren } = node;
        result.push(issueWithoutChildren);

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
    const batchIssues = (issues: IJiraIssue[], batchSize: number): IJiraIssue[][] => {
      // First build the tree
      const rootIssues = buildIssueTree(issues);
      // Batch the root level issues
      if (batchSize <= 0) throw new Error("Batch size must be greater than 0");
      if (rootIssues.length === 0) return [];

      // Split the root issues into batches
      const batches: IJiraIssue[][] = [];
      const numBatches = Math.ceil(rootIssues.length / batchSize);

      // For each batch of root issues, flatten their trees
      for (let i = 0; i < numBatches; i++) {
        const startIndex = i * batchSize;
        const rootBatch = rootIssues.slice(startIndex, startIndex + batchSize);
        // Flatten each root issue and its children, then combine them
        const flattenedBatch = rootBatch.reduce(
          (acc: IJiraIssue[], rootIssue) => acc.concat(flattenSingleTree(rootIssue)),
          []
        );
        // Add the flattened batch to the batches
        batches.push(flattenedBatch);
      }
      // Return the batches
      return batches;
    };

    const batches = batchIssues(data.issues, batchSize);

    // Now for every batch we need to figure out the associations, such as
    // comments, sprints and components and push that all to the final batch. Do
    // understand that sprint and components are linked to issues, so there is a
    // possibility that the same sprint or component can be present in multiple
    // batches.
    const finalBatches: TBatch<JiraEntity>[] = [];
    for (const [i, batch] of batches.entries()) {
      const random = Math.floor(Math.random() * 10000);
      const sprints = filterSprintsForIssues(batch, data.sprints);
      const components = filterComponentsForIssues(batch, data.components);
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
            sprints: data.sprints.length,
            components: data.components.length,
            issueTypes: data.issueTypes.length,
            issueFields: data.issueFields.length,
          },
        },
        data: [
          {
            issues: batch,
            issue_comments: associatedComments,
            sprints: sprints,
            components: components,
            labels: data.labels,
            users: data.users,
            issueTypes: data.issueTypes,
            issueFields: data.issueFields,
          },
        ],
      });
    }

    return finalBatches;
  }
}
