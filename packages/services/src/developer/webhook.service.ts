import { API_BASE_URL } from "@plane/constants";
import type { IWebhook } from "@plane/types";
import { APIService } from "../api.service";

/**
 * Service class for managing webhooks
 * Handles CRUD operations for webhooks and secret key management
 * @extends {APIService}
 */
export default class WebhookService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves all webhooks for a workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @returns {Promise<IWebhook[]>} Promise resolving to array of webhooks
   * @throws {Error} If the API request fails
   */
  async list(workspaceSlug: string): Promise<IWebhook[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/webhooks/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves details of a specific webhook
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} webhookId - The unique identifier for the webhook
   * @returns {Promise<IWebhook>} Promise resolving to webhook details
   * @throws {Error} If the API request fails
   */
  async retrieve(workspaceSlug: string, webhookId: string): Promise<IWebhook> {
    return this.get(`/api/workspaces/${workspaceSlug}/webhooks/${webhookId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new webhook in the workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {Object} [data={}] - Webhook configuration data
   * @returns {Promise<IWebhook>} Promise resolving to the created webhook
   * @throws {Error} If the API request fails
   */
  async create(workspaceSlug: string, data = {}): Promise<IWebhook> {
    return this.post(`/api/workspaces/${workspaceSlug}/webhooks/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing webhook
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} webhookId - The unique identifier for the webhook
   * @param {Object} [data={}] - Updated webhook configuration data
   * @returns {Promise<IWebhook>} Promise resolving to the updated webhook
   * @throws {Error} If the API request fails
   */
  async update(workspaceSlug: string, webhookId: string, data = {}): Promise<IWebhook> {
    return this.patch(`/api/workspaces/${workspaceSlug}/webhooks/${webhookId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a webhook from the workspace
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} webhookId - The unique identifier for the webhook
   * @returns {Promise<void>} Promise resolving when webhook is deleted
   * @throws {Error} If the API request fails
   */
  async destroy(workspaceSlug: string, webhookId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/webhooks/${webhookId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Regenerates the secret key for a webhook
   * @param {string} workspaceSlug - The unique slug identifier for the workspace
   * @param {string} webhookId - The unique identifier for the webhook
   * @returns {Promise<IWebhook>} Promise resolving to the webhook with new secret key
   * @throws {Error} If the API request fails
   */
  async regenerateSecretKey(workspaceSlug: string, webhookId: string): Promise<IWebhook> {
    return this.post(`/api/workspaces/${workspaceSlug}/webhooks/${webhookId}/regenerate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export { WebhookService };
