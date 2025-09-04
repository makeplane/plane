import {
  transformComment,
  transformTask,
  transformUser,
  transformList,
  transformTag,
  transformState,
  transformTaskType,
  TClickUpConfig,
  TClickUpEntity,
  TClickUpTask,
  TClickUpTag,
  TClickUpStateConfig,
  TClickUpPriorityConfig,
  TClickUpTaskWithComments,
  TClickUpListsWithTasks,
  TClickUpUser,
  TClickUpCustomTaskType,
  ClickUpContentParserConfig,
  ClickupAPIService,
  TClickUpCustomFieldWithTaskType,
  transformCustomField,
  transformCustomFieldOption,
  transformCustomFieldValues,
  TClickUpCustomField,
  transformCustomFieldForDefaultTaskType,
  CLICKUP_TASK_EXTERNAL_ID,
  TClickUpStatus,
  transformProject,
} from "@plane/etl/clickup";
import { TIssuePropertyValuesPayload } from "@plane/etl/core";
import {
  Client as PlaneClient,
  ExIssueComment,
  ExIssueLabel,
  ExIssueType,
  ExModule,
  ExIssue as PlaneIssue,
  PlaneUser,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExState,
} from "@plane/sdk";
import { TImportJob, TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { createProjects, enableIssueTypeForProject } from "@/etl/migrator/projects.migrator";
import { createStates } from "@/etl/migrator/states.migrator";
import { processBatchPromises } from "@/helpers/methods";
import { logger } from "@/logger";
import { APIClient, getAPIClient } from "@/services/client";

/* ------------------ Transformers ----------------------
This file contains transformers for Clickup entities, responsible
for converting the given Clickup entities into Plane entities. The
transformation depends on the types exported by the source core,
and the core types need to be maintained to get the correct
transformation results.
--------------------- Transformers ---------------------- */

export class ClickUpBulkTransformer {
  private readonly job: TImportJob<TClickUpConfig>;
  private readonly entity: TClickUpEntity;
  private readonly teamId: string;
  private readonly spaceId: string;
  private readonly folderId: string;
  private stateMap: TClickUpStateConfig[];
  private readonly priorityMap: TClickUpPriorityConfig[];
  private readonly planeClient: PlaneClient;
  private readonly clickupService: ClickupAPIService;
  private readonly credential: TWorkspaceCredential;
  private readonly apiClient: APIClient;
  private userMap: Map<string, string>;

  constructor(
    job: TImportJob<TClickUpConfig>,
    entity: TClickUpEntity,
    planeClient: PlaneClient,
    clickupService: ClickupAPIService,
    credential: TWorkspaceCredential
  ) {
    this.job = job;
    this.entity = entity;
    this.teamId = job.config?.team?.id || "";
    this.spaceId = job.config?.space?.id || "";
    this.folderId = job.config?.folder?.id || "";
    this.stateMap = job.config?.state || [];
    this.priorityMap = job.config?.priority || [];
    this.planeClient = planeClient;
    this.clickupService = clickupService;
    this.credential = credential;
    this.apiClient = getAPIClient();
    this.userMap = new Map<string, string>();
  }

  /**
   * Verifies if the states and project are present in the job config.
   * If not, it creates the project and state mapping and updates the job config.
   * @returns true if the states and project are present in the job config, false otherwise.
   */
  async verifyStatesAndProject(): Promise<boolean> {
    let planeProject = this.job.config.planeProject;
    let planeStateMapping = this.job.config.state || [];

    logger.info(`[${this.job.id.slice(0, 7)}] Verifying states and project`);

    if (!planeProject) {
      // we create the project and update the job config
      const transformedProject = transformProject(this.job.config.space, this.job.config.folder);
      const existingProjects = await this.planeClient.project.listAllProjects(this.job.workspace_slug);
      const createdProjects = await createProjects(
        this.job.id,
        [transformedProject],
        this.planeClient,
        this.job.workspace_slug,
        existingProjects
      );
      planeProject = createdProjects[0];
      // enable issue type for the project
      if (planeProject?.id) {
        await enableIssueTypeForProject(this.job, planeProject, this.planeClient, this.job.workspace_slug);
        this.job.config.planeProject = planeProject;
        this.job.project_id = planeProject.id;
      }
    }

    if (planeStateMapping.length === 0 && this.job.project_id) {
      // we create the state mapping and update the job config
      const transformedStates = await this.getTransformedStateMapping(this.entity.statuses);
      const existingStates = await this.planeClient.state.list(this.job.workspace_slug, this.job.project_id);
      const stateMapping = await createStates(
        this.job.id,
        transformedStates,
        this.planeClient,
        this.job.workspace_slug,
        this.job.project_id,
        existingStates.results
      );
      planeStateMapping = stateMapping as TClickUpStateConfig[];
      if (planeStateMapping.length !== 0) {
        this.job.config.state = planeStateMapping;
        this.stateMap = planeStateMapping;
      }
    }

    // updating the job config
    await this.apiClient.importJob.updateImportJob(this.job.id, {
      project_id: this.job.project_id,
      config: {
        ...this.job.config,
        planeProject,
        state: planeStateMapping,
      },
    });

    return planeStateMapping.length > 0 && planeProject !== undefined;
  }

  async getTransformedStateMapping(
    states: TClickUpStatus[]
  ): Promise<{ source_state: TClickUpStatus; target_state: Partial<ExState> }[]> {
    return states.map((status: TClickUpStatus) => {
      const targetState = transformState(this.job.config.space, this.job.config.folder, status);
      return {
        target_state: targetState,
        source_state: status,
      };
    });
  }

  async getTransformedTasks(): Promise<Partial<PlaneIssue>[]> {
    const userMap = this.job.config.skipUserImport ? new Map<string, string>() : await this.getUserMap();
    const clickupContentParserConfig: ClickUpContentParserConfig = {
      planeClient: this.planeClient,
      clickupService: this.clickupService,
      workspaceSlug: this.job.workspace_slug,
      projectId: this.job.project_id,
      fileDownloadHeaders: { Authorization: `${this.credential.source_access_token}` },
      apiBaseUrl: env.API_BASE_URL,
      userMap: userMap,
    };
    // transform the tasks in batches of 5
    const transformedTask = async (task: TClickUpTask): Promise<Partial<PlaneIssue>> => {
      const transformedTask = await transformTask(
        this.spaceId,
        this.folderId,
        task,
        this.stateMap,
        this.priorityMap,
        clickupContentParserConfig
      );
      transformedTask.labels = [...(transformedTask.labels || []), "CLICKUP IMPORTED"];
      return transformedTask;
    };

    const transformedTasks = await processBatchPromises(this.entity.tasks, transformedTask, 2);

    return transformedTasks;
  }

  getTransformedTags(): Partial<ExIssueLabel>[] {
    return [
      ...this.entity.tags.map((tag: TClickUpTag): Partial<ExIssueLabel> => transformTag(tag)),
      {
        name: "CLICKUP IMPORTED",
        color: "#8803fc",
      },
    ];
  }

  getTransformedComments(): Partial<ExIssueComment>[] {
    return this.entity.taskComments.map((comment: TClickUpTaskWithComments) =>
      transformComment(this.spaceId, this.folderId, comment.taskId, comment.comment)
    );
  }

  getTransformedLists(): Partial<ExModule>[] {
    return this.entity.listsWithTasks.map((listWithTasks: TClickUpListsWithTasks) =>
      transformList(this.spaceId, this.folderId, listWithTasks)
    );
  }

  getTransformedUsers(): Partial<PlaneUser>[] {
    return this.entity.users.filter((user) => user.username !== null).map((user: TClickUpUser) => transformUser(user));
  }

  getTransformedIssueTypes(): Partial<ExIssueType>[] {
    return this.entity.customTaskTypes.map((taskType: TClickUpCustomTaskType) =>
      transformTaskType(this.spaceId, this.folderId, taskType)
    );
  }

  /**
   * Transforms the issue fields for the custom task types.
   * This includes the issue fields for the default task type and the custom task types.
   * Since to create custom fields for the default task type, we need to have the default task type id.
   * we are setting the default task type id to undefined in the transformCustomFieldForDefaultTaskType function.
   * and in migrator we are setting the type id to the default task type id.
   * @returns An array of transformed issue fields.
   */
  getTransformedIssueFields(): Partial<ExIssueProperty>[] {
    return this.entity.customFieldsForTaskTypes
      .map((customFieldWithTaskType: TClickUpCustomFieldWithTaskType) =>
        transformCustomField(
          this.spaceId,
          this.folderId,
          customFieldWithTaskType.customField,
          customFieldWithTaskType.customTaskType
        )
      )
      .filter((field) => field !== undefined);
  }
  /**
   * Transforms the issue fields for the default task type.
   * @returns An array of transformed issue fields.
   */
  getTransformedIssueFieldsForDefault(): Partial<ExIssueProperty>[] {
    const issueFields: Partial<ExIssueProperty>[] = [];
    const customFields = this.entity.customFieldsForTaskTypes.map(
      (customFieldWithTaskType: TClickUpCustomFieldWithTaskType) => customFieldWithTaskType.customField
    );
    const uniqueCustomFields = new Map<string, TClickUpCustomField>();
    customFields.forEach((customField) => {
      if (!uniqueCustomFields.has(customField.id.toString())) {
        uniqueCustomFields.set(customField.id.toString(), customField);
      }
    });
    uniqueCustomFields.forEach((customField) => {
      const transformedField = transformCustomFieldForDefaultTaskType(this.spaceId, this.folderId, customField);
      if (transformedField) {
        issueFields.push(transformedField);
      }
    });
    return issueFields;
  }

  /**
   * Transforms the options for a custom field.
   * since each custom field can have multiple options, we need to transform each option.
   * @returns An array of transformed options.
   */
  getTransformedIssueFieldOptions(): Partial<ExIssuePropertyOption>[] {
    const transformedOptions: Partial<ExIssuePropertyOption>[] = [];
    this.entity.customFieldsForTaskTypes.forEach((customFieldWithTaskType: TClickUpCustomFieldWithTaskType) => {
      const customFieldOptions = customFieldWithTaskType.customField.type_config.options;
      if (customFieldOptions) {
        customFieldOptions.forEach((option) => {
          const transformedOption = transformCustomFieldOption(
            this.spaceId,
            this.folderId,
            customFieldWithTaskType.customField,
            option,
            customFieldWithTaskType.customTaskType
          );
          if (transformedOption) {
            transformedOptions.push(transformedOption);
          }
        });
      }
    });
    return transformedOptions;
  }

  getTransformedIssuePropertyValues(): TIssuePropertyValuesPayload {
    // Get transformed values for issue_id -> property_id -> property_values
    const transformedIssuePropertyValues: TIssuePropertyValuesPayload = {};
    this.entity.tasks.forEach((task: TClickUpTask) => {
      if (task.id && task.custom_fields.length) {
        const externalTaskId = CLICKUP_TASK_EXTERNAL_ID(task.id);
        const externalTaskCustomFieldValues = transformCustomFieldValues(this.spaceId, this.folderId, task);
        if (Object.keys(externalTaskCustomFieldValues).length > 0) {
          transformedIssuePropertyValues[externalTaskId] = externalTaskCustomFieldValues;
        }
      }
    });
    return transformedIssuePropertyValues;
  }

  private async getUserMap(): Promise<Map<string, string>> {
    if (this.userMap.size > 0) {
      return this.userMap;
    }
    logger.info(`Getting user map`, {
      jobId: this.job.id,
      teamId: this.teamId,
    });
    const clickupUsers = await this.clickupService.getTeamMembers(this.teamId);
    const planeUsers = await this.planeClient.users.listAllUsers(this.job.workspace_slug);
    const userMap = new Map<string, string>();
    clickupUsers.forEach((user) => {
      const planeUser = planeUsers.find((planeUser) => planeUser.email === user.email);
      if (planeUser) {
        userMap.set(user.email, planeUser.id);
      }
    });
    this.userMap = userMap;
    return userMap;
  }
}
