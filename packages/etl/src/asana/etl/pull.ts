// services
import { AsanaService } from "@/asana/services/api.service";
// types
import {
  AsanaAttachment,
  AsanaCustomFieldSettings,
  AsanaTag,
  AsanaTask,
  AsanaTaskComment,
  AsanaUser,
  PaginationPayload,
} from "@/asana/types";

const DEFAULT_PAGINATION_LIMIT = 100;

interface TaskPullOptions {
  batchSize?: number;
  maxConcurrent?: number;
}

const DEFAULT_OPTIONS: TaskPullOptions = {
  batchSize: 15,
  maxConcurrent: 8,
};

export async function pullTasks(
  client: AsanaService,
  projectGid: string,
  options: TaskPullOptions = DEFAULT_OPTIONS
): Promise<AsanaTask[]> {
  return await getAllProjectTasks(client, projectGid, options);
}

async function getAllProjectTasks(
  client: AsanaService,
  projectGid: string,
  options: TaskPullOptions
): Promise<AsanaTask[]> {
  const allTasks: AsanaTask[] = [];
  let offset = "";

  do {
    const response = await client.getProjectTasks(projectGid, {
      limit: DEFAULT_PAGINATION_LIMIT,
      offset,
    });

    // Process tasks in batches
    for (let i = 0; i < response.data.length; i += options.batchSize!) {
      const batch = response.data.slice(i, i + options.batchSize!);
      const batchResults = await processBatch(batch, client, options);
      allTasks.push(...batchResults);
    }

    offset = response._response.next_page?.offset || "";
  } while (offset);

  return allTasks;
}

async function processBatch(tasks: AsanaTask[], client: AsanaService, options: TaskPullOptions): Promise<AsanaTask[]> {
  const results: AsanaTask[] = [];

  // Process tasks in smaller concurrent groups
  for (let i = 0; i < tasks.length; i += options.maxConcurrent!) {
    const concurrent = tasks.slice(i, i + options.maxConcurrent!);
    const concurrentResults = await Promise.all(concurrent.map((task) => processTask(task, client, options)));
    results.push(...concurrentResults.flat());
  }

  return results;
}

async function processTask(task: AsanaTask, client: AsanaService, options: TaskPullOptions): Promise<AsanaTask[]> {
  const results = [task];

  if (task.num_subtasks > 0) {
    const subtasks = await getAllSubtasks(client, task.gid, options);
    results.push(...subtasks);
  }

  return results;
}

async function getAllSubtasks(client: AsanaService, taskGid: string, options: TaskPullOptions): Promise<AsanaTask[]> {
  const allSubtasks: AsanaTask[] = [];
  let offset = "";

  do {
    const response = await client.getTaskSubtasks(taskGid, {
      limit: DEFAULT_PAGINATION_LIMIT,
      offset,
    });

    // Process subtasks in batches
    for (let i = 0; i < response.data.length; i += options.batchSize!) {
      const batch = response.data.slice(i, i + options.batchSize!);
      const batchResults = await processBatch(batch, client, options);
      allSubtasks.push(...batchResults);
    }

    offset = response._response.next_page?.offset || "";
  } while (offset);

  return allSubtasks;
}

export async function pullUsers(client: AsanaService, workspaceGId: string): Promise<AsanaUser[]> {
  const users: AsanaUser[] = [];
  const pagination: PaginationPayload = {
    limit: DEFAULT_PAGINATION_LIMIT,
    offset: "",
  };

  do {
    const response = await client.getWorkspaceUsers(workspaceGId, pagination);
    users.push(...response.data);
    pagination.offset = response._response.next_page?.offset || "";
  } while (pagination.offset);

  return users;
}

export async function pullTags(client: AsanaService, workspaceGid: string): Promise<AsanaTag[]> {
  const tags: AsanaTag[] = [];
  const pagination: PaginationPayload = {
    limit: DEFAULT_PAGINATION_LIMIT,
    offset: "",
  };

  do {
    const response = await client.getWorkspaceTags(workspaceGid, pagination);
    tags.push(...response.data);
    pagination.offset = response._response.next_page?.offset || "";
  } while (pagination.offset);

  return tags;
}

export async function pullCustomFields(client: AsanaService, projectGid: string): Promise<AsanaCustomFieldSettings[]> {
  const customFields: AsanaCustomFieldSettings[] = [];
  const pagination: PaginationPayload = {
    limit: DEFAULT_PAGINATION_LIMIT,
    offset: "",
  };
  try {
    do {
      const response = await client.getProjectCustomFieldSettings(projectGid, pagination);
      customFields.push(...response.data);
      pagination.offset = response._response.next_page?.offset || "";
    } while (pagination.offset);
  } catch (error: any) {
    console.log("error while fetching custom fields from asana", error?.message);
  } finally {
    return customFields;
  }
}

export async function pullAttachments(
  client: AsanaService,
  tasks: AsanaTask[]
): Promise<Record<string, AsanaAttachment[]>> {
  const attachments: Record<string, AsanaAttachment[]> = {};

  for (const task of tasks) {
    if (!task.gid) continue;
    const pagination: PaginationPayload = {
      limit: DEFAULT_PAGINATION_LIMIT,
      offset: "",
    };
    do {
      const response = await client.getResourceAttachments(task.gid, pagination);
      if (!attachments[task.gid]) {
        attachments[task.gid] = [];
      }
      attachments[task.gid].push(...response.data);
    } while (pagination.offset);
  }
  return attachments;
}

export async function pullComments(client: AsanaService, tasks: AsanaTask[]): Promise<AsanaTaskComment[]> {
  // Fetch comments for each task
  const comments: AsanaTaskComment[] = [];

  // Pagination for comments
  const pagination: PaginationPayload = {
    limit: DEFAULT_PAGINATION_LIMIT,
    offset: "",
  };

  // Fetch comments for each task
  for (const task of tasks) {
    do {
      // Fetch comments for the task
      const response = await client.getTaskComments(task.gid, pagination);
      comments.push(
        ...response.data
          .filter((story: any) => story.type && story.type === "comment")
          .map((story: any) => ({ ...story, task_gid: task.gid }) as AsanaTaskComment)
      );

      // Update pagination
      pagination.offset = response._response.next_page?.offset || "";
    } while (pagination.offset);
  }

  return comments;
}
