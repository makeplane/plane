// plane imports
import { API_BASE_URL } from "@plane/constants";
import { PartialDeep, TRecurringWorkItem, TRecurringWorkItemActivity } from "@plane/types";
// local imports
import { APIService } from "../api.service";

/**
 * Service class for managing recurring work items
 * @extends {APIService}
 */
export class RecurringWorkItemServiceBase extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all recurring work items
   * @param workspaceSlug The slug of the workspace to retrieve recurring work items from
   * @param projectId The id of the project to retrieve recurring work items from
   * @returns A promise that resolves to an array of recurring work items
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string, projectId: string): Promise<TRecurringWorkItem[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a specific recurring work item by ID
   * @param workspaceSlug The slug of the workspace to retrieve the recurring work item from
   * @param projectId The id of the project to retrieve the recurring work item from
   * @param recurringWorkItemId The ID of the recurring work item to retrieve
   * @returns A promise that resolves to the recurring work item
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, projectId: string, recurringWorkItemId: string): Promise<TRecurringWorkItem> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/${recurringWorkItemId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new recurring work item
   * @param workspaceSlug The slug of the workspace to create the recurring work item in
   * @param projectId The id of the project to create the recurring work item in
   * @param recurringWorkItem The recurring work item to create
   * @returns A promise that resolves to the created recurring work item
   * @throws {Error} If the API request fails
   */
  async create(
    workspaceSlug: string,
    projectId: string,
    recurringWorkItem: PartialDeep<TRecurringWorkItem>
  ): Promise<TRecurringWorkItem> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/`, recurringWorkItem)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing recurring work item
   * @param workspaceSlug The slug of the workspace to update the recurring work item in
   * @param projectId The id of the project to update the recurring work item in
   * @param recurringWorkItemId The ID of the recurring work item to update
   * @param recurringWorkItem The updated recurring work item
   * @returns A promise that resolves to the updated recurring work item
   * @throws {Error} If the API request fails
   */
  async update(
    workspaceSlug: string,
    projectId: string,
    recurringWorkItemId: string,
    recurringWorkItem: PartialDeep<TRecurringWorkItem>
  ): Promise<TRecurringWorkItem> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/${recurringWorkItemId}/`,
      recurringWorkItem
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a recurring work item
   * @param workspaceSlug The slug of the workspace to delete the recurring work item from
   * @param projectId The id of the project to delete the recurring work item from
   * @param recurringWorkItemId The ID of the recurring work item to delete
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, projectId: string, recurringWorkItemId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/${recurringWorkItemId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves all activities for a recurring work item
   * @param workspaceSlug The slug of the workspace to retrieve the recurring work item activities from
   * @param projectId The id of the project to retrieve the recurring work item activities from
   * @param recurringWorkItemId The ID of the recurring work item to retrieve activities for
   * @returns A promise that resolves to an array of recurring work item activities
   * @throws {Error} If the API request fails
   */
  async listActivities(
    workspaceSlug: string,
    projectId: string,
    recurringWorkItemId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TRecurringWorkItemActivity[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/recurring-work-items/${recurringWorkItemId}/activities/`,
      { params }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
