import axios, { AxiosInstance, RawAxiosResponseHeaders } from "axios";
import { getWaitTimeInMs } from "../helpers";
import {
  TClickUpComment,
  TClickUpCustomField,
  TClickUpCustomTaskType,
  TClickUpFolder,
  TClickUpList,
  TClickUpSpace,
  TClickUpTag,
  TClickUpTask,
  TClickUpTeam,
  TClickUpUser,
} from "../types";

const CLICKUP_API_URL = "https://api.clickup.com/api/v2";

/**
 * ClickUp API service
 * @description This service is used to interact with the ClickUp API
 * @constructor
 * @param apiKey - the api key for the ClickUp API (required) like "pk_1234567890"
 * @param apiUrl - the url for the ClickUp API (optional, defaults to CLICKUP_API_URL)
 */
export class ClickupAPIService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private client: AxiosInstance;

  constructor(apiKey: string, apiUrl: string = CLICKUP_API_URL) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error("Error in ClickUp API", { status: error?.response?.status });
        if (error.response?.status === 429) {
          const headers = error.response.headers as RawAxiosResponseHeaders;
          if (headers && headers["x-ratelimit-reset"]) {
            let waitTime = getWaitTimeInMs(headers["x-ratelimit-reset"] as string);
            console.log("Rate limit exceeded ======> waiting for", waitTime, "ms");
            // add a random jitter of 20% to the wait time
            const jitter = Math.random() * 0.2;
            waitTime = waitTime * (1 + jitter);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.client.request(error.config);
          }
        } else {
          // retry 2 times with fixed delay
          const MAX_RETRIES = 1;
          const RETRY_DELAY = 1000;

          for (let i = 0; i < MAX_RETRIES; i++) {
            console.log("Retrying ClickUp API", {
              status: error?.response?.status,
              retry: i + 1,
              max_retries: MAX_RETRIES,
              retry_delay: RETRY_DELAY,
            });
            try {
              return await this.client.request(error.config);
            } catch (retryError: any) {
              // If this is the last retry, reject the promise
              if (i === MAX_RETRIES - 1) {
                throw retryError;
              }
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all teams
   * @returns all teams using auth token
   */
  async getTeams(): Promise<TClickUpTeam[]> {
    return this.client.get("/team").then((response) => response.data.teams);
  }

  /**
   * Get all spaces for a team
   * @param teamId - the id of the team
   * @returns all spaces for a team
   */
  async getSpaces(teamId: string): Promise<TClickUpSpace[]> {
    return this.client.get(`/team/${teamId}/space`).then((response) => response.data.spaces);
  }

  /**
   * Get all folders for a space
   * @param spaceId - the id of the space
   * @returns all folders for a space
   */
  async getFolders(spaceId: string): Promise<TClickUpFolder[]> {
    return this.client.get(`/space/${spaceId}/folder`).then((response) => response.data.folders);
  }

  /**
   * Get a folder by id
   * @param folderId - the id of the folder
   * @returns a folder
   */
  async getFolder(folderId: string): Promise<TClickUpFolder> {
    return this.client.get(`/folder/${folderId}`).then((response) => response.data);
  }

  /**
   * Get all lists for a folder
   * @param folderId - the id of the folder
   * @returns all lists for a folder
   */
  async getLists(folderId: string): Promise<TClickUpList[]> {
    return this.client.get(`/folder/${folderId}/list`).then((response) => response.data.lists);
  }

  /**
   * Get all tasks for a list
   * @param listId - the id of the list
   * @returns all tasks for a list
   */
  async getTasks(listId: string, page: number = 0): Promise<{ tasks: TClickUpTask[]; last_page: boolean }> {
    return this.client
      .get(`/list/${listId}/task`, {
        params: {
          subtasks: true,
          include_markdown_description: true,
          include_closed: true,
          page,
        },
      })
      .then((response) => response.data);
  }

  /**
   * Get a task by id
   * @param taskId - the id of the task
   * @returns a task
   */
  async getTask(taskId: string): Promise<TClickUpTask> {
    return this.client
      .get(`/task/${taskId}`, {
        params: {
          subtasks: true,
          include_markdown_description: true,
          include_closed: true,
        },
      })
      .then((response) => response.data);
  }

  /**
   * Get all comments for a task
   * @param taskId - the id of the task
   * @param lastCommentId - the id of the last comment
   * @param lastCommentUnixTimestamp - the unix timestamp of the last comment
   * @returns all comments for a task
   */
  async getTaskComments(
    taskId: string,
    lastCommentId: string | null,
    lastCommentUnixTimestamp: number | null
  ): Promise<TClickUpComment[]> {
    return this.client
      .get(`/task/${taskId}/comment`, {
        params: {
          start: lastCommentUnixTimestamp,
          start_id: lastCommentId,
        },
      })
      .then((response) => response.data.comments);
  }

  /**
   * Get all custom fields for a team
   * @param teamId - the id of the team
   * @returns all custom fields for a team
   */
  async getTeamCustomFields(teamId: string): Promise<TClickUpCustomField[]> {
    return this.client.get(`/team/${teamId}/field`).then((response) => response.data.fields);
  }

  /**
   * Get all custom fields for a space
   * @param spaceId - the id of the space
   * @returns all custom fields for a space
   */
  async getSpaceCustomFields(spaceId: string): Promise<TClickUpCustomField[]> {
    return this.client.get(`/space/${spaceId}/field`).then((response) => response.data.fields);
  }

  /**
   * Get all custom fields for a folder
   * @param folderId - the id of the folder
   * @returns all custom fields for a folder
   */
  async getFolderCustomFields(folderId: string): Promise<TClickUpCustomField[]> {
    return this.client.get(`/folder/${folderId}/field`).then((response) => response.data.fields);
  }

  /**
   * Get all custom fields for a list
   * @param listId - the id of the list
   * @returns all custom fields for a list
   */
  async getListCustomFields(listId: string): Promise<TClickUpCustomField[]> {
    return this.client.get(`/list/${listId}/field`).then((response) => response.data.fields);
  }

  /**
   * Get all custom task types for a team
   * @param teamId - the id of the team
   * @returns all custom task types for a team
   */
  async getCustomTaskTypes(teamId: string): Promise<TClickUpCustomTaskType[]> {
    return this.client.get(`/team/${teamId}/custom_item`).then((response) => response.data.custom_items);
  }

  /**
   * Get all tags for a space
   * @param spaceId - the id of the space
   * @returns all tags for a space
   */
  async getSpaceTags(spaceId: string): Promise<TClickUpTag[]> {
    return this.client.get(`/space/${spaceId}/tag`).then((response) => response.data.tags);
  }

  /**
   * Get the number of tasks for a folder
   * @param folderId - the id of the folder
   * @returns the number of tasks for a folder
   */
  async getTasksCount(folderId: string): Promise<number> {
    const lists = await this.getLists(folderId);
    let tasksCount = 0;
    for (const list of lists) {
      let page = 0;
      let lastPage = false;
      while (!lastPage) {
        const tasks = await this.getTasks(list.id, page);
        tasksCount += tasks.tasks.length;
        page++;
        if (tasks.last_page) {
          lastPage = true;
        }
      }
    }
    return tasksCount;
  }

  /**
   * Get all users for a team
   * @param teamId - the id of the team
   * @returns all users for a team
   */
  async getTeamMembers(teamId: string): Promise<TClickUpUser[]> {
    const teams = await this.getTeams();
    const team = teams.find((team) => team.id === teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    return team.members.map((member) => member.user);
  }

  /**
   * Get all tasks for a team with pagination
   * @param teamId - the id of the team
   * @param projectIds - the ids of the projects
   * @returns all tasks for a team for all projects with pagination
   */
  async getAllTeamTasks(teamId: string, projectIds: string[]): Promise<TClickUpTask[]> {
    const tasks: TClickUpTask[] = [];
    let page = 0;
    let lastPage = false;
    while (!lastPage) {
      const teamTasks = await this.getTeamTasks(teamId, projectIds, page);
      tasks.push(...teamTasks.tasks);
      page++;
      if (teamTasks.last_page) {
        lastPage = true;
      }
    }
    return tasks;
  }

  /**
   * Get all tasks for a list
   * @param listId - the id of the list
   * @returns all tasks for a list
   */
  async getTeamTasks(
    teamId: string,
    projectIds: string[],
    page: number = 0
  ): Promise<{ tasks: TClickUpTask[]; last_page: boolean }> {
    return this.client
      .get(`/team/${teamId}/task`, {
        params: {
          subtasks: true,
          include_markdown_description: true,
          include_closed: true,
          project_ids: projectIds,
          page,
        },
      })
      .then((response) => response.data);
  }
}
