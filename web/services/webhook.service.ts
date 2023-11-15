// api services
import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import { IWebhook } from "types";

export class WebhookService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getAll(workspaceSlug: string): Promise<IWebhook[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/webhooks/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getById(workspaceSlug: string, webhook_id: string): Promise<IWebhook> {
    return this.get(`/api/workspaces/${workspaceSlug}/webhooks/${webhook_id}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: {}): Promise<IWebhook> {
    return this.post(`/api/workspaces/${workspaceSlug}/webhooks/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, webhook_id: string, data: {}): Promise<IWebhook> {
    return this.patch(`/api/workspaces/${workspaceSlug}/webhooks/${webhook_id}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, webhook_id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/webhooks/${webhook_id}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async regenerate(workspaceSlug: string, webhook_id: string): Promise<IWebhook> {
    return this.post(`/api/workspaces/${workspaceSlug}/webhooks/${webhook_id}/regenerate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
