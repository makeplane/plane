// types
import type { ILinkDetails, ModuleLink } from "@plane/types";
// services
import { APIService } from "../api.service";

/**
 * Service class for handling module link related operations.
 * Extends the base APIService class to interact with module link endpoints.
 */
export class ModuleLinkService extends APIService {
  /**
   * Creates an instance of ModuleLinkService.
   * @param {string} baseURL - The base URL for the API endpoints
   */
  constructor(baseURL: string) {
    super(baseURL);
  }

  /**
   * Creates a new module link.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} moduleId - The unique identifier for the module
   * @param {Partial<ModuleLink>} data - The module link data to be created
   * @returns {Promise<ILinkDetails>} The created module link details
   * @throws {Error} When the API request fails
   */
  async create(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ModuleLink>
  ): Promise<ILinkDetails> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates an existing module link.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} moduleId - The unique identifier for the module
   * @param {string} linkId - The unique identifier for the link to update
   * @param {Partial<ModuleLink>} data - The module link data to be updated
   * @returns {Promise<ILinkDetails>} The updated module link details
   * @throws {Error} When the API request fails
   */
  async update(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ModuleLink>
  ): Promise<ILinkDetails> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/${linkId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a module link.
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} moduleId - The unique identifier for the module
   * @param {string} linkId - The unique identifier for the link to delete
   * @returns {Promise<any>} Response data from the server
   * @throws {Error} When the API request fails
   */
  async destroy(workspaceSlug: string, projectId: string, moduleId: string, linkId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-links/${linkId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
