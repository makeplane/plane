// services
import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class AppInstallationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async addInstallationApp(workspaceSlug: string, provider: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/workspace-integrations/${provider}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async addSlackChannel(
    workspaceSlug: string,
    projectId: string,
    integrationId: string | null | undefined,
    data: any
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/project-slack-sync/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getSlackChannelDetail(
    workspaceSlug: string,
    projectId: string,
    integrationId: string | null | undefined
  ): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/project-slack-sync/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async removeSlackChannel(
    workspaceSlug: string,
    projectId: string,
    integrationId: string | null | undefined,
    slackSyncId: string | undefined
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/project-slack-sync/${slackSyncId}`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
