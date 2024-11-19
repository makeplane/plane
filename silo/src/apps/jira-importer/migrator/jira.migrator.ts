import { TBatch } from "@/apps/engine/worker/types";
import { PlaneEntities } from "@plane/sdk";
import { updateJob } from "@/db/query";
import { env } from "@/env";
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { logger } from "@/logger";
import { TSyncJobWithConfig } from "@silo/core";
import {
  JiraConfig,
  JiraEntity,
  pullComments,
  pullComponents,
  pullIssues,
  pullLabels,
  pullSprints,
  pullUsers,
} from "@silo/jira";
import { Issue as IJiraIssue } from "jira.js/out/version3/models";
import {
  createJiraClient,
  filterComponentsForIssues,
  filterSprintsForIssues,
  getJobCredentials,
  getJobData,
  resetJobIfStarted,
} from "../helpers/migration-helpers";
import {
  getTransformedComments,
  getTransformedComponents,
  getTransformedIssues,
  getTransformedLabels,
  getTransformedSprints,
  getTransformedUsers,
} from "./transformers";

export class JiraDataMigrator extends BaseDataMigrator<JiraConfig, JiraEntity> {
  constructor(mq: any, store: any) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TSyncJobWithConfig<JiraConfig>> {
    return getJobData(jobId);
  }

  async pull(job: TSyncJobWithConfig<JiraConfig>): Promise<JiraEntity[]> {
    // Retrieve and validate the job data
    await resetJobIfStarted(job.id, job);

    // Obtain the Jira client and the job credentials
    const credentials = await getJobCredentials(job);
    const client = createJiraClient(job, credentials);

    if (!job.config) {
      logger.info(`No Job Config found for the Job, ${job.id} ${job.workspace_slug}`);
      return [];
    }

    const projectId = job.config.meta.project.id;
    const projectKey = job.config.meta.project.key;

    /* -------------- Pull Jira Data --------------- */
    const users = pullUsers(job.config.meta.users);
    const labels = await pullLabels(client);
    const issues = await pullIssues(client, projectKey, job.start_time);
    const sprints = await pullSprints(client, projectId);
    const comments = await pullComments(issues, client);
    const components = await pullComponents(client, projectKey);
    const customFields = await client.getFields();
    /* -------------- Pull Jira Data --------------- */

    // Update Job for the actual start time of the migration
    await updateJob(job.id, { start_time: new Date() });

    return [
      {
        users,
        issues,
        labels,
        sprints,
        components,
        customFields,
        issue_comments: comments,
      },
    ];
  }

  // NOOP, as transform will be done as the integration level
  // Transforms all the details from Jira to Plane
  transform = async (job: TSyncJobWithConfig<JiraConfig>, data: JiraEntity[]): Promise<PlaneEntities[]> => {
    // Get the job by the job configuration
    if (data.length < 1) {
      return [];
    }
    const entities = data[0];
    const transformedIssue = getTransformedIssues(job, entities);

    /* Todo: Remove this antipattern logic when issue types come to plane */
    if (job.config?.meta.issueType) {
      if (job.config.meta.issueType === "create_as_label") {
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

    // Return the transformed data
    return [
      {
        users: transformedUsers,
        issues: transformedIssue,
        labels: transformedLabels,
        cycles: transformedSprintsAsCycles,
        modules: transformedModules,
        issue_comments: transformedComments,
      },
    ];
  };

  async batches(job: TSyncJobWithConfig<JiraConfig>): Promise<TBatch<JiraEntity>[]> {
    const sourceData = await this.pull(job);
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;

    const data = sourceData[0];

    // Create a map of issues by their external_id for quick lookup
    const issueMap = new Map(data.issues.map((issue: any) => [issue.id, issue]));

    // Get all the related issues for a given issue, with DFS. Traverse the
    // issues and search for the parent and children of the issue, if the parent
    // is found then add it to the related issues, and if the children are
    // found, then add them to the related issues too, and mark them as visited.
    const getRelatedIssues = (issue: IJiraIssue, visited: Set<string>) => {
      const relatedIssues = new Set([issue]);
      const stack = [issue];

      while (stack.length > 0) {
        const currentIssue = stack.pop();
        if (!currentIssue || visited.has(currentIssue.id)) continue;

        visited.add(currentIssue.id);

        if (currentIssue.fields.parent?.id && issueMap.has(currentIssue.fields.parent?.id)) {
          const parentIssue = issueMap.get(currentIssue.fields.parent?.id);
          if (!visited.has(parentIssue.id)) {
            relatedIssues.add(parentIssue);
            stack.push(parentIssue);
          }
        }

        for (const [_id, potentialChild] of issueMap) {
          if (potentialChild.fields.parent?.id === currentIssue.id && !visited.has(potentialChild.id)) {
            relatedIssues.add(potentialChild);
            stack.push(potentialChild);
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

      const relatedIssues = getRelatedIssues(issue, visited);
      currentBatch.push(...relatedIssues);

      if (currentBatch.length >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    const finalBatches: TBatch<JiraEntity>[] = [];

    // Now for every batch we need to figure out the associations, such as
    // comments, sprints and components and push that all to the final batch. Do
    // understand that sprint and components are linked to issues, so there is a
    // possibility that the same sprint or component can be present in multiple
    // batches.
    for (const [i, batch] of batches.entries()) {
      let random = Math.floor(Math.random() * 10000);
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
            customFields: data.customFields.length,
            issues: data.issues.length,
            labels: data.labels.length,
            users: data.users.length,
            issue_comments: data.issue_comments.length,
            sprints: data.sprints.length,
            components: data.components.length,
          },
        },
        data: [
          {
            customFields: data.customFields,
            issues: batch,
            issue_comments: associatedComments,
            sprints: sprints,
            components: components,
            labels: data.labels,
            users: data.users,
          },
        ],
      });
    }

    return finalBatches;
  }
}
