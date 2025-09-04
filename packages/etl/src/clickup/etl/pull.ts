import { CLICKUP_TASK_EXTERNAL_ID } from "../helpers";
import { CLICKUP_ALLOWED_CUSTOM_FIELD_TYPES } from "../helpers/constants";
import { ClickupAPIService } from "../services/api.service";
import {
  TClickUpComment,
  TClickUpCustomField,
  TClickUpCustomTaskType,
  TClickUpList,
  TClickUpListsWithTasks,
  TClickUpTag,
  TClickUpTask,
  TClickUpTaskRelation,
  TClickUpTaskWithComments,
  TClickUpUser,
} from "../types";

export class ClickUpPullService {
  private apiService: ClickupAPIService;

  constructor(apiService: ClickupAPIService) {
    this.apiService = apiService;
  }

  async pullSpaceMembers(teamId: string): Promise<TClickUpUser[]> {
    const teams = await this.apiService.getTeams();
    const team = teams.find((team) => team.id === teamId);
    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }
    return team.members.map((member) => member.user);
  }

  async pullTags(spaceId: string): Promise<TClickUpTag[]> {
    return this.apiService.getSpaceTags(spaceId);
  }

  async pullLists(folderId: string): Promise<TClickUpList[]> {
    return this.apiService.getLists(folderId);
  }

  async pullTasks(teamId: string, folderId: string): Promise<TClickUpTask[]> {
    const tasks = await this.apiService.getAllTeamTasks(teamId, [folderId]);
    return tasks;
  }

  async pullTasksForFolderPaginated(
    teamId: string,
    folderId: string,
    page: number = 0
  ): Promise<{ tasks: TClickUpTask[]; last_page: boolean }> {
    return this.apiService.getTeamTasks(teamId, [folderId], page);
  }

  async pullTasksComments(taskIds: string[]): Promise<TClickUpTaskWithComments[]> {
    taskIds = [...new Set(taskIds)];
    const taskComments: TClickUpTaskWithComments[] = [];
    // add percent count progress to the task
    const totalTasks = taskIds.length;
    let completedTasks = 0;
    for (const taskId of taskIds) {
      const comments = await this.pullTaskComments(taskId, null, null);
      comments.forEach((comment) => {
        taskComments.push({
          taskId,
          comment,
        });
      });
      completedTasks++;
      const percentProgress = Math.round((completedTasks / totalTasks) * 100);
      console.log(`Pulling tasks comments: ${percentProgress}%`);
    }
    return taskComments;
  }

  pullListsWithTasks(lists: TClickUpList[], tasks: TClickUpTask[]): TClickUpListsWithTasks[] {
    const listWithTasks: TClickUpListsWithTasks[] = [];
    for (const list of lists) {
      const listTasks = tasks.filter((task) => task.list.id === list.id);
      listWithTasks.push({ ...list, tasks: listTasks });
    }
    return listWithTasks;
  }

  async pullCustomTaskTypes(teamId: string): Promise<TClickUpCustomTaskType[]> {
    const customTaskTypes = await this.apiService.getCustomTaskTypes(teamId);
    const defaultTaskType: TClickUpCustomTaskType = {
      id: 0,
      name: "Task",
      name_plural: "Tasks",
      description: "Default task type from clickup",
    };
    return [defaultTaskType, ...customTaskTypes];
  }

  // since in plane custom fields are associated with task types, but in clckup they are at global level
  // we need to fetch all custom fields and then associate them with all the task types at plane
  async pullCustomFieldsForTaskTypes(
    folderId: string,
    customTaskTypes: TClickUpCustomTaskType[]
  ): Promise<{ customTaskType: TClickUpCustomTaskType; customField: TClickUpCustomField }[]> {
    const customFields = await this.pullCustomFieldsAtAllLevels(folderId);
    const customFieldsForTaskTypes: { customTaskType: TClickUpCustomTaskType; customField: TClickUpCustomField }[] = [];
    for (const customTaskType of customTaskTypes) {
      for (const customField of customFields) {
        customFieldsForTaskTypes.push({ customTaskType, customField });
      }
    }
    return customFieldsForTaskTypes;
  }

  /**
   * This function pulls the tasks with attachments.
   * @param taskIds array of task ids
   * @returns array of TClickUpTask
   */
  async pullTasksWithAttachments(taskIds: string[]): Promise<TClickUpTask[]> {
    const tasksWithAttachments: TClickUpTask[] = [];
    // add percent count progress to the task
    const totalTasks = taskIds.length;
    let completedTasks = 0;
    for (const taskId of taskIds) {
      const task: TClickUpTask = await this.apiService.getTask(taskId);
      tasksWithAttachments.push(task);
      completedTasks++;
      const percentProgress = Math.round((completedTasks / totalTasks) * 100);
      console.log(`Pulling tasks with attachments: ${percentProgress}%`);
    }

    return tasksWithAttachments;
  }

  /**
   * This function pulls the relations for all the tasks. and maps them to the task external id.
   * @param tasks
   * @returns Record<taskExternalId as string, TClickUpTaskRelation[]>
   */
  // instead of pulling all relations for a single task, we pass object and keep adding relations for each task to it
  fetchTaskRelations(tasks: TClickUpTask[]): Record<string, TClickUpTaskRelation[]> {
    const taskRelations: Record<string, TClickUpTaskRelation[]> = {};
    for (const task of tasks) {
      // add relation to blocked by tasks
      for (const dependency of task.dependencies) {
        if (dependency.type === 1) {
          const relation: TClickUpTaskRelation = {
            identifier: CLICKUP_TASK_EXTERNAL_ID(dependency.depends_on),
            relation: "blocked_by",
          };
          const taskExternalId = CLICKUP_TASK_EXTERNAL_ID(dependency.task_id);
          if (taskRelations[taskExternalId]) {
            taskRelations[taskExternalId].push(relation);
          } else {
            taskRelations[taskExternalId] = [relation];
          }
        }
      }

      // add relation to linked tasks
      for (const linkedTask of task.linked_tasks) {
        const taskExternalId = CLICKUP_TASK_EXTERNAL_ID(linkedTask.task_id);
        const relation: TClickUpTaskRelation = {
          identifier: CLICKUP_TASK_EXTERNAL_ID(linkedTask.link_id),
          relation: "relates_to",
        };
        if (taskRelations[taskExternalId]) {
          taskRelations[taskExternalId].push(relation);
        } else {
          taskRelations[taskExternalId] = [relation];
        }
      }

      // add relation to parent task
      if (task.parent !== null) {
        const relation: TClickUpTaskRelation = {
          identifier: CLICKUP_TASK_EXTERNAL_ID(task.parent),
          relation: "parent_id",
        };
        const taskExternalId = CLICKUP_TASK_EXTERNAL_ID(task.id);
        if (taskRelations[taskExternalId]) {
          taskRelations[taskExternalId].push(relation);
        } else {
          taskRelations[taskExternalId] = [relation];
        }
      }
    }
    return taskRelations;
  }

  private async pullTaskComments(
    taskId: string,
    lastCommentTimeStamp: number | null,
    lastCommentId: string | null
  ): Promise<TClickUpComment[]> {
    const taskComments: TClickUpComment[] = [];
    // passing null for lastCommentId and lastCommentTimeStamp will recent 25 comments
    while (true) {
      const comments = await this.apiService.getTaskComments(taskId, lastCommentId, lastCommentTimeStamp);
      if (comments.length === 0) {
        break;
      }
      comments.reverse();
      for (const comment of comments) {
        // push the top level comment
        taskComments.push(comment);
        const threadedComments = await this.pullThreadedCommentsForAComment(comment.id);
        // push the threaded comments
        if (threadedComments.length > 0) {
          taskComments.push(...threadedComments.reverse());
        }
      }
      lastCommentId = comments[0].id;
      lastCommentTimeStamp = Number(comments[0].date);
    }

    return taskComments;
  }

  private async pullThreadedCommentsForAComment(commentId: string): Promise<TClickUpComment[]> {
    const comments = await this.apiService.getThreadedComments(commentId);
    return comments;
  }

  private async pullTasksForAList(listId: string): Promise<TClickUpTask[]> {
    const tasks: TClickUpTask[] = [];
    let page = 0;
    let lastPage = false;
    while (!lastPage) {
      const listTasks = await this.apiService.getTasks(listId, page);
      tasks.push(...listTasks.tasks);
      page++;
      if (listTasks.last_page) {
        lastPage = true;
      }
    }

    return this.pullTasksWithAttachments(tasks.map((task) => task.id));
  }

  /**
   * This function pulls the custom fields at all the levels.
   * @param teamId
   * @param spaceId
   * @param folderId
   * @returns array of TClickUpCustomField
   */
  private async pullCustomFieldsAtAllLevels(folderId: string): Promise<TClickUpCustomField[]> {
    const folderCustomFields = await this.apiService.getFolderCustomFields(folderId);
    const supportedCustomFields = folderCustomFields.filter((customField) =>
      CLICKUP_ALLOWED_CUSTOM_FIELD_TYPES.includes(customField.type)
    );
    return supportedCustomFields;
  }
}
