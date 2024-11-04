/**
 * @fileoverview Service class for handling project view operations within workspaces
 * @module ProjectViewService
 */

import { IProjectView } from "@plane/types";
import APIService from "../api.service";

/**
 * Service class for managing project views
 * Handles CRUD operations for project views, issue retrieval, and favorite view management
 * @extends {APIService}
 */
export class ProjectViewService extends APIService {
  /**
   * Creates an instance of ProjectViewService
   * @param {string} baseUrl - The base URL for API requests
   */
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Creates a new project view
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {Partial<IProjectView>} data - Project view configuration data
   * @returns {Promise<any>} Promise resolving to the created project view
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, projectId: string, data: Partial<IProjectView>): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing project view
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} viewId - The unique identifier for the view
   * @param {Partial<IProjectView>} data - Updated project view data
   * @returns {Promise<any>} Promise resolving to the updated project view
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, projectId: string, viewId: string, data: Partial<IProjectView>): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a project view
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} viewId - The unique identifier for the view to delete
   * @returns {Promise<any>} Promise resolving when view is deleted
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves all views for a project
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @returns {Promise<IProjectView[]>} Promise resolving to array of project views
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string, projectId: string): Promise<IProjectView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific project view
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} viewId - The unique identifier for the view
   * @returns {Promise<IProjectView>} Promise resolving to project view details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, projectId: string, viewId: string): Promise<IProjectView> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves issues associated with a specific project view
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} viewId - The unique identifier for the view
   * @returns {Promise<any>} Promise resolving to view's issues
   * @throws {Error} If the API request fails
   */
  async getIssues(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Adds a view to user's favorites
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {Object} data - Favorite view data
   * @param {string} data.view - The identifier of the view to favorite
   * @returns {Promise<any>} Promise resolving when view is added to favorites
   * @throws {Error} If the API request fails
   */
  async addToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      view: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a view from user's favorites
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} viewId - The unique identifier for the view to remove from favorites
   * @returns {Promise<any>} Promise resolving when view is removed from favorites
   * @throws {Error} If the API request fails
   */
  async removeFromFavorites(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
