const Asana = require("asana");
// types
import {
  AsanaAttachment,
  AsanaCustomFieldSettings,
  AsanaProject,
  AsanaProjectTaskCount,
  AsanaSection,
  AsanaServiceProps,
  AsanaTag,
  AsanaTask,
  AsanaTaskComment,
  AsanaUser,
  AsanaWorkspace,
  PaginatedResponse,
  PaginationPayload,
  TokenRefreshResponse,
} from "@/asana/types";
// rate limiter
import RateLimiter from "./rate-limiter";

type FetchRefreshTokenProps = {
  isRefreshed: boolean;
  isRejected: boolean;
};

const TASK_OPT_FIELDS =
  "name,html_notes,start_on,due_on,permalink_url,created_at,created_by,assignee,tags,memberships,memberships.project,memberships.section,parent,num_subtasks,custom_fields,offset";

export class AsanaService {
  private accessToken: string;
  private refreshToken: string | null;
  private asanaClient: any;
  private usersApiInstance: any;
  private workspacesApiInstance: any;
  private projectsApiInstance: any;
  private sectionsApiInstance: any;
  private tasksApiInstance: any;
  private tagsApiInstance: any;
  private storiesApiInstance: any;
  private customFieldSettingsApiInstance: any;
  private attachmentsApiInstance: any;
  private rateLimiter: RateLimiter;
  private refreshTokenFunc?: (refreshToken: string) => Promise<TokenRefreshResponse>;
  private refreshTokenCallback?: (response: TokenRefreshResponse) => Promise<void>;
  private refreshTokenRejectCallback?: () => Promise<void>;

  constructor(props: AsanaServiceProps) {
    this.accessToken = props.accessToken;
    this.refreshToken = props.refreshToken;
    this.refreshTokenFunc = props.refreshTokenFunc;
    this.refreshTokenCallback = props.refreshTokenCallback;
    this.refreshTokenRejectCallback = props.refreshTokenRejectCallback;
    // Initialize client
    this.initializeClient();
    // Initialize rate limiter: 150 requests per minute
    this.rateLimiter = new RateLimiter(150, 60 * 1000);
  }

  private initializeClient() {
    this.asanaClient = Asana.ApiClient.instance;
    this.asanaClient.authentications["token"].accessToken = this.accessToken;
    this.usersApiInstance = new Asana.UsersApi();
    this.workspacesApiInstance = new Asana.WorkspacesApi();
    this.projectsApiInstance = new Asana.ProjectsApi();
    this.sectionsApiInstance = new Asana.SectionsApi();
    this.tasksApiInstance = new Asana.TasksApi();
    this.tagsApiInstance = new Asana.TagsApi();
    this.storiesApiInstance = new Asana.StoriesApi();
    this.customFieldSettingsApiInstance = new Asana.CustomFieldSettingsApi();
    this.attachmentsApiInstance = new Asana.AttachmentsApi();
  }

  private async refreshAccessToken(): Promise<FetchRefreshTokenProps> {
    if (!this.refreshToken || !this.refreshTokenFunc || !this.refreshTokenCallback) {
      return {
        isRefreshed: false,
        isRejected: true,
      };
    }

    try {
      const response = await this.refreshTokenFunc(this.refreshToken);
      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;

      // Reinitialize the client with the new access token
      this.initializeClient();

      // Notify callback about the token refresh
      await this.refreshTokenCallback(response);
      return {
        isRefreshed: true,
        isRejected: false,
      };
    } catch (error) {
      // if it fails, reset the credentials from db.
      if (this.refreshTokenRejectCallback) {
        await this.refreshTokenRejectCallback();
      }
      console.error("Failed to refresh access token:", error);
      return {
        isRefreshed: false,
        isRejected: true,
      };
    }
  }

  private async makeRequest<T>(requestFn: () => Promise<T>, retryCount = 3): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        await this.rateLimiter.acquireToken();
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers["retry-after"] || "60", 10);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        // Handle unauthorized (401) - attempt token refresh
        if (error.response?.status === 401) {
          const { isRefreshed, isRejected } = await this.refreshAccessToken();
          if (isRejected) {
            // If token refresh fails, don't retry
            break;
          }
          if (isRefreshed) {
            // Retry immediately after successful token refresh
            continue;
          }
        }

        // For other errors or if token refresh failed, use exponential backoff
        if (attempt === retryCount - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    throw lastError || new Error("All retry attempts failed");
  }

  async getWorkspaceUsers(workspaceGId: string, pagination: PaginationPayload): Promise<PaginatedResponse<AsanaUser>> {
    return await this.makeRequest(() =>
      this.usersApiInstance.getUsersForWorkspace(workspaceGId, {
        limit: pagination.limit,
        offset: pagination.offset || undefined,
        opt_fields: "name,email,offset",
      })
    );
  }

  async getProjectTasks(projectGid: string, pagination: PaginationPayload): Promise<PaginatedResponse<AsanaTask>> {
    return await this.makeRequest(() =>
      this.tasksApiInstance.getTasks({
        project: projectGid,
        limit: pagination.limit,
        offset: pagination.offset || undefined,
        opt_fields: TASK_OPT_FIELDS,
      })
    );
  }

  async getTaskSubtasks(taskGid: string, pagination: PaginationPayload): Promise<PaginatedResponse<AsanaTask>> {
    return await this.makeRequest(() =>
      this.tasksApiInstance.getSubtasksForTask(taskGid, {
        limit: pagination.limit,
        offset: pagination.offset || undefined,
        opt_fields: TASK_OPT_FIELDS,
      })
    );
  }

  async getWorkspaceTags(workspaceGid: string, pagination: PaginationPayload): Promise<PaginatedResponse<AsanaTag>> {
    return await this.makeRequest(() =>
      this.tagsApiInstance.getTagsForWorkspace(workspaceGid, {
        limit: pagination.limit,
        offset: pagination.offset || undefined,
        opt_fields: "name,color,offset",
      })
    );
  }

  async getWorkspaces(): Promise<PaginatedResponse<AsanaWorkspace>> {
    return this.makeRequest(() => this.workspacesApiInstance.getWorkspaces());
  }

  async getWorkspaceProjects(workspaceGid: string): Promise<PaginatedResponse<AsanaProject>> {
    return this.makeRequest(() => this.projectsApiInstance.getProjectsForWorkspace(workspaceGid));
  }

  async getProjectSections(projectGid: string): Promise<PaginatedResponse<AsanaSection>> {
    return this.makeRequest(() => this.sectionsApiInstance.getSectionsForProject(projectGid));
  }

  async getProjectTaskCount(projectGid: string): Promise<PaginatedResponse<AsanaProjectTaskCount>> {
    return this.makeRequest(() =>
      this.projectsApiInstance.getTaskCountsForProject(projectGid, {
        opt_fields: "num_tasks",
      })
    );
  }

  async getProjectCustomFieldSettings(
    projectGid: string,
    pagination: PaginationPayload
  ): Promise<PaginatedResponse<AsanaCustomFieldSettings>> {
    return this.makeRequest<PaginatedResponse<AsanaCustomFieldSettings>>(() =>
      this.customFieldSettingsApiInstance.getCustomFieldSettingsForProject(projectGid, {
        opt_fields:
          "project,parent,custom_field,custom_field.name,custom_field.description,custom_field.type,custom_field.is_formula_field,custom_field.is_value_read_only,custom_field.enum_options",
        limit: pagination.limit,
        offset: pagination.offset || undefined,
      })
    );
  }

  async getResourceAttachments(
    resourceGid: string,
    pagination: PaginationPayload
  ): Promise<PaginatedResponse<AsanaAttachment>> {
    return this.makeRequest(() =>
      this.attachmentsApiInstance.getAttachmentsForObject(resourceGid, {
        opt_fields: "name,size,download_url",
        limit: pagination.limit,
        offset: pagination.offset || undefined,
      })
    );
  }

  async getTaskComments(taskGid: string, pagination: PaginationPayload): Promise<PaginatedResponse<AsanaTaskComment>> {
    return this.makeRequest(() =>
      this.storiesApiInstance.getStoriesForTask(taskGid, {
        opt_fields: "text,created_at,created_by,type,html_text,task",
        limit: pagination.limit,
        offset: pagination.offset || undefined,
      })
    );
  }
}

export default AsanaService;
