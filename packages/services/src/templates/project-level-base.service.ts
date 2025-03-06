// plane imports
import { API_BASE_URL } from "@plane/constants";
import { PartialDeep, TBaseTemplateWithData } from "@plane/types";
// local imports
import { APIService } from "../api.service";

/**
 * Service class for managing workspace level templates
 * @extends {APIService}
 */
export abstract class ProjectLevelTemplateServiceBase<T extends TBaseTemplateWithData> extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all project level templates
   * @param workspaceSlug The slug of the workspace to retrieve templates from
   * @param projectId The id of the project to retrieve templates from
   * @returns A promise that resolves to an array of project level templates
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string, projectId: string): Promise<T[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a specific project level template by ID
   * @param workspaceSlug The slug of the workspace to retrieve the template from
   * @param projectId The id of the project to retrieve the template from
   * @param templateId The ID of the template to retrieve
   * @returns A promise that resolves to the project level template
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, projectId: string, templateId: string): Promise<T> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new project level template
   * @param workspaceSlug The slug of the workspace to create the template in
   * @param projectId The id of the project to create the template in
   * @param template The project level template to create
   * @returns A promise that resolves to the created project level template
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, projectId: string, template: PartialDeep<T>): Promise<T> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/templates/`, template)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing project level template
   * @param workspaceSlug The slug of the workspace to update the template in
   * @param projectId The id of the project to update the template in
   * @param templateId The ID of the template to update
   * @param template The updated project level template
   * @returns A promise that resolves to the updated project level template
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, projectId: string, templateId: string, template: PartialDeep<T>): Promise<T> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/templates/${templateId}/`, template)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a project level template
   * @param workspaceSlug The slug of the workspace to delete the template from
   * @param projectId The id of the project to delete the template from
   * @param templateId The ID of the template to delete
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, projectId: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
