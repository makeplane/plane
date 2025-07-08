import {
  AsanaConfig,
  AsanaEntity,
  pullUsers,
  pullTasks,
  pullTags,
  AsanaTask,
  pullCustomFields,
  AsanaTaskWithChildren,
  pullAttachments,
  pullComments,
} from "@plane/etl/asana";
import { PlaneEntities } from "@plane/etl/core";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
// silo engine
import { BaseDataMigrator } from "@/etl/base-import-worker";
import { getJobData, resetJobIfStarted, getJobCredentials, updateJobWithReport } from "@/helpers/job";
import { MQ, Store } from "@/worker/base";
import { TBatch } from "@/worker/types";
import { createAsanaClient } from "../helpers/migration-helpers";
import {
  getTransformedTasks,
  getTransformedUsers,
  getTransformedTags,
  getTransformedCustomFields,
  getTransformedCustomFieldOptions,
  getTransformedCustomFieldValues,
  getTransformedComments,
} from "./transformers";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

export class AsanaDataMigrator extends BaseDataMigrator<AsanaConfig, AsanaEntity> {
  constructor(mq: MQ, store: Store) {
    super(mq, store);
  }

  async getJobData(jobId: string): Promise<TImportJob<AsanaConfig>> {
    return getJobData(jobId);
  }

  async pull(job: TImportJob<AsanaConfig>): Promise<AsanaEntity[]> {
    await resetJobIfStarted(job);
    const credentials = await getJobCredentials(job);
    const client = createAsanaClient(job, credentials);

    if (!job.config) {
      return [];
    }
    // derived values
    const workspaceGid = job.config.workspace.gid;
    const projectGid = job.config.project.gid;
    // pull data
    const users = job.config.skipUserImport ? [] : await pullUsers(client, workspaceGid);
    const tasks = await pullTasks(client, projectGid);
    const tags = await pullTags(client, workspaceGid);
    const fields = await pullCustomFields(client, projectGid);
    const attachments = await pullAttachments(client, tasks);
    const comments = await pullComments(client, tasks);

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
        tasks,
        tags,
        fields,
        attachments,
        comments,
      },
    ];
  }

  async transform(job: TImportJob<AsanaConfig>, data: AsanaEntity[]): Promise<PlaneEntities[]> {
    if (data.length < 1) {
      return [];
    }
    const entities = data[0];
    const transformedUsers = getTransformedUsers(entities);
    const transformedTasks = await getTransformedTasks(job, entities);
    const transformedTags = getTransformedTags(entities);
    const transformedCustomFields = getTransformedCustomFields(job, entities);
    const transformedCustomFieldOptions = getTransformedCustomFieldOptions(job, entities);
    const transformedCustomFieldValues = getTransformedCustomFieldValues(entities, transformedCustomFields);
    const transformedComments = getTransformedComments(entities);

    return [
      {
        issues: transformedTasks,
        labels: transformedTags,
        users: transformedUsers,
        issue_comments: transformedComments,
        cycles: [],
        modules: [],
        issue_properties: transformedCustomFields,
        issue_property_options: transformedCustomFieldOptions,
        issue_property_values: transformedCustomFieldValues,
      },
    ];
  }

  async batches(job: TImportJob<AsanaConfig>): Promise<TBatch<AsanaEntity>[]> {
    const sourceData = await this.pull(job);
    const batchSize = env.BATCH_SIZE ? parseInt(env.BATCH_SIZE) : 40;
    const data = sourceData[0];

    // Build a tree structure of issues, where each issue has a parent and children
    const buildTaskTree = (tasks: AsanaTask[]) => {
      const taskMap = new Map<string, AsanaTaskWithChildren>(
        tasks.map((task: AsanaTask) => [task.gid, { ...task, children: [] }])
      );
      const rootTasks: AsanaTaskWithChildren[] = [];
      for (const task of tasks) {
        const node = taskMap.get(task.gid);
        if (task.parent?.gid === undefined) {
          if (node) rootTasks.push(node);
        } else {
          const parentNode = task?.parent?.gid && taskMap.get(task.parent?.gid);
          if (parentNode) {
            if (node && parentNode.children) parentNode.children.push(node);
          }
        }
      }
      return rootTasks;
    };

    // Flatten a single tree branch and its children
    const flattenSingleTree = (root: AsanaTaskWithChildren): AsanaTask[] => {
      // BFS to flatten the tree
      const result: AsanaTask[] = [];
      const queue: { node: AsanaTaskWithChildren; level: number }[] = [{ node: root, level: 0 }];
      // BFS
      while (queue.length > 0) {
        const { node, level } = queue.shift()!;
        const { children, ...taskWithoutChildren } = node;
        result.push(taskWithoutChildren);
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
    const batchTasks = (tasks: AsanaTask[], batchSize: number): AsanaTask[][] => {
      // First build the tree
      const rootTasks = buildTaskTree(tasks);
      // Batch the root level issues
      if (batchSize <= 0) throw new Error("Batch size must be greater than 0");
      if (rootTasks.length === 0) return [];
      // Split the root issues into batches
      const batches: AsanaTask[][] = [];
      const numBatches = Math.ceil(rootTasks.length / batchSize);
      // For each batch of root issues, flatten their trees
      for (let i = 0; i < numBatches; i++) {
        const startIndex = i * batchSize;
        const rootBatch = rootTasks.slice(startIndex, startIndex + batchSize);
        // Flatten each root issue and its children, then combine them
        const flattenedBatch = rootBatch.reduce(
          (acc: AsanaTask[], rootTask) => acc.concat(flattenSingleTree(rootTask)),
          []
        );
        // Add the flattened batch to the batches
        batches.push(flattenedBatch);
      }
      // Return the batches
      return batches;
    };

    const batches = batchTasks(data.tasks, batchSize);
    const finalBatches: TBatch<AsanaEntity>[] = [];
    for (const [i, batch] of batches.entries()) {
      const random = Math.floor(Math.random() * 10000);
      finalBatches.push({
        id: random,
        jobId: job.id,
        meta: {
          batchId: random,
          batch_start: i * batchSize,
          batch_size: batch.length,
          batch_end: i * batchSize + batch.length,
          total: {
            users: data.users.length,
            tasks: data.tasks.length,
            tags: data.tags.length,
            fields: data.fields.length,
            attachments: Object.keys(data.attachments).length,
            comments: data.comments.length,
          },
        },
        data: [
          {
            users: data.users,
            tasks: batch,
            tags: data.tags,
            fields: data.fields,
            attachments: data.attachments,
            comments: data.comments,
          },
        ],
      });
    }

    return finalBatches;
  }
}
