// plane imports
import { API_BASE_URL } from "@plane/constants";
import {
  EAutomationNodeType,
  TAutomation,
  TAutomationActivity,
  TAutomationActivityFilters,
  TAutomationDetails,
  TAutomationNode,
  TAutomationNodeConfig,
  TAutomationNodeEdge,
  TAutomationNodeHandlerName,
} from "@plane/types";
// local imports
import { APIService } from "../api.service";

export class ProjectAutomationsService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves the list of automations for a specific project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @returns {Promise<TAutomation[]>} Promise resolving to automations data
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string, projectId: string): Promise<TAutomation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information about a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @returns {Promise<TAutomation>} Promise resolving to automation details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, projectId: string, automationId: string): Promise<TAutomationDetails> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new automation within a project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {Partial<TAutomation>} data - Partial automation data to create
   * @returns {Promise<TAutomation>} Promise resolving to the created automation data
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, projectId: string, data: Partial<TAutomation>): Promise<TAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific automation within a project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {Partial<TAutomation>} data - Partial automation data to update
   * @returns {Promise<TAutomation>} Promise resolving to the updated automation data
   * @throws {Error} If the API request fails
   */
  async update(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    data: Partial<TAutomation>
  ): Promise<TAutomation> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates the status of a specific automation within a project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {Partial<TAutomation>} data - Partial automation data to update
   * @returns {Promise<TAutomation>} Promise resolving to the updated automation data
   * @throws {Error} If the API request fails
   */
  async updateStatus(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    isEnabled: boolean
  ): Promise<TAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/status/`, {
      is_enabled: isEnabled,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a specific automation within a project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, projectId: string, automationId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new node within a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {Partial<TAutomationNode>} data - Partial node data to create
   * @returns {Promise<TAutomationNode>} Promise resolving to the created node data
   * @throws {Error} If the API request fails
   */
  async createNode<T extends TAutomationNode>(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    data: Partial<T>
  ): Promise<T> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/nodes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific node within a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {string} nodeId - The unique identifier for the node
   * @param {Partial<TAutomationNode<T, C>>} data - Partial node data to update
   * @returns {Promise<TAutomationNode<T, C>>} Promise resolving to the updated node data
   * @throws {Error} If the API request fails
   */
  async updateNode<
    T extends EAutomationNodeType,
    H extends TAutomationNodeHandlerName,
    C extends TAutomationNodeConfig,
  >(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    nodeId: string,
    data: Partial<TAutomationNode<T, H, C>>
  ): Promise<TAutomationNode<T, H, C>> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/nodes/${nodeId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific node within a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {string} nodeId - The unique identifier for the node
   * @throws {Error} If the API request fails
   */
  async deleteNode(workspaceSlug: string, projectId: string, automationId: string, nodeId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/nodes/${nodeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new edge within a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {string} sourceNodeId - The unique identifier for the source node
   * @param {string} targetNodeId - The unique identifier for the target node
   * @returns {Promise<TAutomationNodeEdge>} Promise resolving to the created edge data
   * @throws {Error} If the API request fails
   */
  async createEdge(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    sourceNodeId: string,
    targetNodeId: string
  ): Promise<TAutomationNodeEdge> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/edges/`, {
      source_node: sourceNodeId,
      target_node: targetNodeId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a specific edge within a specific automation
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {string} edgeId - The unique identifier for the edge
   * @throws {Error} If the API request fails
   */
  async deleteEdge(workspaceSlug: string, projectId: string, automationId: string, edgeId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/edges/${edgeId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the list of automations for a specific project
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {string} projectId - The unique identifier for the project
   * @param {string} automationId - The unique identifier for the automation
   * @param {TAutomationActivityFilters} filters - The filters to apply to the activities
   * @returns {Promise<TAutomationActivity[]>} Promise resolving to activities data
   * @throws {Error} If the API request fails
   */
  async listActivities(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    filters: TAutomationActivityFilters
  ): Promise<TAutomationActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/activities/`, {
      params: filters,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
