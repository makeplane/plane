// plane imports
import { API_BASE_URL, ETemplateType } from "@plane/constants";
import { PartialDeep, TBaseTemplateWithData } from "@plane/types";
// local imports
import { APIService } from "../api.service";
import { buildWorkspaceLevelTemplateApiUrl, TCopyTemplateResponse } from "./utils";
/**
 * Service class for managing workspace level templates
 * @extends {APIService}
 */
export abstract class WorkspaceLevelTemplateServiceBase<T extends TBaseTemplateWithData> extends APIService {
  protected templateType: ETemplateType;

  constructor(templateType: ETemplateType, BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
    this.templateType = templateType;
  }

  /**
   * Retrieves all workspace level templates
   * @param workspaceSlug The slug of the workspace to retrieve templates from
   * @returns A promise that resolves to an array of workspace level templates
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<T[]> {
    return this.get(buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a specific workspace level template by ID
   * @param workspaceSlug The slug of the workspace to retrieve the template from
   * @param templateId The ID of the template to retrieve
   * @returns A promise that resolves to the workspace level template
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, templateId: string): Promise<T> {
    return this.get(buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType, templateId))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new workspace level template
   * @param workspaceSlug The slug of the workspace to create the template in
   * @param template The workspace level template to create
   * @returns A promise that resolves to the created workspace level template
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, template: PartialDeep<T>): Promise<T> {
    return this.post(buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType), template)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing workspace level template
   * @param workspaceSlug The slug of the workspace to update the template in
   * @param templateId The ID of the template to update
   * @param template The updated workspace level template
   * @returns A promise that resolves to the updated workspace level template
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, templateId: string, template: PartialDeep<T>): Promise<T> {
    return this.patch(buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType, templateId), template)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a workspace level template
   * @param workspaceSlug The slug of the workspace to delete the template from
   * @param templateId The ID of the template to delete
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType, templateId))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Copies a workspace level template
   * @param workspaceSlug The slug of the workspace to copy the template to
   * @param templateId The ID of the template to copy
   * @returns A promise that resolves to the copied workspace level template
   * @throws {Error} If the API request fails
   */
  async copy(workspaceSlug: string, templateId: string): Promise<TCopyTemplateResponse> {
    return this.post(`${buildWorkspaceLevelTemplateApiUrl(workspaceSlug, this.templateType)}copy/`, {
      template_id: templateId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
