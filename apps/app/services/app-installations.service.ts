// services
import axios from "axios";
import APIService from "services/api.service";
import IntegrationService from "services/integration";

import {
  WORKSPACE_INTEGRATIONS,
} from "constants/fetch-keys";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class AppInstallationsService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async addInstallationApp(workspaceSlug: string, provider: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/workspace-integrations/${provider}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async addSlackChannel(workspaceSlug: string, projectId: string, integrationId: string | null | undefined, data: any): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workspace-integrations/${integrationId}/project-slack-sync/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getSlackAuthDetails(code: string): Promise<any> {
    const response = await axios({
      method: "post",
      url: "/api/slack-redirect",
      data: {
        code,
      },
    });

    return response.data;
  }
}

export default new AppInstallationsService();
