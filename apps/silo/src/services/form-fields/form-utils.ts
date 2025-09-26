import { PriorityEnum } from "@makeplane/plane-node-sdk";
import { SILO_FORM_OPTIONS_CACHE_KEY } from "@/helpers/cache-keys";
import { getPlaneClientV2, PlaneClientV2 } from "@/helpers/plane-api-client-v2";
import { SelectOption } from "@/types/form/base";
import { Store } from "@/worker/base";

export interface ProjectConfig {
  id: string;
  name: string;
  isIntakeEnabled: boolean;
  isIssueTypeEnabled: boolean;
}

export enum OptionsEntity {
  LABEL = "labels",
  STATE = "state",
  PRIORITY = "priority",
  WORK_ITEM_TYPES = "workItemTypes",
  ASSIGNEE = "assignees",
}

export interface GetOptionsForEntityParams {
  slug: string;
  projectId: string;
  typeIdentifier: string;
  searchText?: string;
  sessionCacheKey?: string;
}

export class FormUtils {
  private planeAPIClient: PlaneClientV2;

  constructor(accessToken: string) {
    this.planeAPIClient = getPlaneClientV2({ accessToken });
  }

  async getProjectConfig(slug: string, projectId: string): Promise<ProjectConfig> {
    const project = await this.planeAPIClient.projectsApi.retrieveProject({
      pk: projectId,
      slug,
    });
    if (!project?.id) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
      isIntakeEnabled: project.intakeView ?? false,
      isIssueTypeEnabled: project.isIssueTypeEnabled ?? false,
    };
  }

  /**
   * Get options for an entity
   * @param slug - The slug of the workspace
   * @param projectId - The ID of the project
   * @param optionsEntity - The entity to get options for
   * @param propertyOptionsParams - The parameters for the property options. Only required for WORK_ITEM_PROPERTY.
   * @returns The options for the entity
   */
  async getOptionsForEntity({
    slug,
    projectId,
    typeIdentifier,
    searchText,
  }: GetOptionsForEntityParams): Promise<SelectOption[]> {
    let options: SelectOption[] = [];

    const cacheKey = SILO_FORM_OPTIONS_CACHE_KEY(slug, projectId, typeIdentifier);
    const store = Store.getInstance();
    const cachedOptionsResp = await store.get(cacheKey);
    if (cachedOptionsResp) {
      options = JSON.parse(cachedOptionsResp);
    } else {
      switch (typeIdentifier) {
        case OptionsEntity.LABEL:
          // eslint-disable-next-line no-case-declarations
          const labels = await this.planeAPIClient.labelsApi.listLabels({
            projectId,
            slug,
          });
          options = labels.results.map((label) => ({
            value: label.id ?? "",
            label: label.name ?? "",
          }));
          break;
        case OptionsEntity.STATE:
          // eslint-disable-next-line no-case-declarations
          const states = await this.planeAPIClient.statesApi.listStates({
            projectId,
            slug,
          });
          options = states.results.map((state) => ({
            value: state.id ?? "",
            label: state.name ?? "",
          }));
          break;
        case OptionsEntity.PRIORITY:
          // eslint-disable-next-line no-case-declarations
          const priorities = Object.values(PriorityEnum).map((priority) => ({
            value: priority,
            label: priority.charAt(0).toUpperCase() + priority.slice(1),
          }));
          options = priorities;
          break;
        case OptionsEntity.WORK_ITEM_TYPES:
          // eslint-disable-next-line no-case-declarations
          const workItemTypes = await this.planeAPIClient.workItemTypesApi.listIssueTypes({
            projectId,
            slug,
          });
          options = workItemTypes.map((workItemType) => ({
            value: workItemType.id ?? "",
            label: workItemType.name ?? "",
          }));
          break;
        case OptionsEntity.ASSIGNEE:
          // eslint-disable-next-line no-case-declarations
          const assignees = await this.planeAPIClient.membersApi.getProjectMembers({
            projectId,
            slug,
          });
          options = assignees.map((assignee) => ({
            value: assignee.id ?? "",
            label: assignee.displayName ?? "",
          }));
          break;
        default:
          // assuming this is for custom fields
          // eslint-disable-next-line no-case-declarations
          const [issueTypeId, propertyId] = typeIdentifier.split(":");
          if (!issueTypeId || !propertyId) {
            throw new Error("Invalid type identifier");
          }
          // eslint-disable-next-line no-case-declarations
          const workItemProperty = await this.planeAPIClient.workItemPropertiesApi.retrieveIssueProperty({
            projectId,
            propertyId,
            slug,
            typeId: issueTypeId,
          });
          if (!["RELATION", "OPTION"].includes(workItemProperty.propertyType)) {
            return [];
          }

          if (workItemProperty.propertyType === "RELATION") {
            const assignees = await this.planeAPIClient.membersApi.getProjectMembers({
              projectId,
              slug,
            });
            options = assignees.map((assignee) => ({
              value: assignee.id ?? "",
              label: assignee.displayName ?? "",
            }));
          } else if (workItemProperty.propertyType === "OPTION") {
            const propertyOptions = await this.planeAPIClient.workItemPropertiesApi.listIssuePropertyOptions({
              projectId,
              propertyId,
              slug,
            });
            options = propertyOptions.map((option) => ({
              value: option.id ?? "",
              label: option.name ?? "",
            }));
          }
          break;
      }
      await store.set(cacheKey, JSON.stringify(options), 60 * 5); // 5 minutes
    }

    if (searchText) {
      options = options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase()));
    }

    return options;
  }
}

export const getFormUtilsService = (accessToken: string): FormUtils => new FormUtils(accessToken);
